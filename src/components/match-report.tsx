import { useEffect, useState } from "react";
import type { Analysis } from "@/lib/corners/api";
import type { CornerMatch, ResultCall, ResultForm, SideExpectation, TeamSample } from "@/lib/corners/model";
import { readResult, readShots } from "@/lib/corners/model";
import { TeamCrest } from "@/components/team-field";

const one = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const pct = new Intl.NumberFormat("es-AR", { style: "percent", maximumFractionDigits: 0 });
const day = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "numeric",
  month: "short",
});

function formatDay(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return day.format(date).replace(".", "");
}

function sideNote(side: SideExpectation) {
  if (side.attackSpecific && side.concedeSpecific) {
    return "Usa la localía de cada uno, no el promedio de todos los partidos.";
  }
  if (!side.attackSpecific && !side.concedeSpecific) {
    return "Hay pocos partidos en esa condición, así que usa el promedio de toda la muestra.";
  }
  return "Mezcla local o visitante cuando hay al menos 3 partidos, y el promedio general cuando no.";
}

function HistoryChart({ matches }: { matches: CornerMatch[] }) {
  const [charts, setCharts] = useState<typeof import("recharts") | null>(null);
  useEffect(() => {
    void import("recharts").then(setCharts);
  }, []);
  const data = [...matches].reverse().map((match) => ({
    label: formatDay(match.date),
    favor: match.cornersFor,
    contra: match.cornersAgainst,
  }));
  if (!charts) return <div className="h-52 rounded-2xl bg-panel-2" />;
  const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } = charts;
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} barCategoryGap="28%">
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            width={24}
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--color-panel-2)" }}
            contentStyle={{
              background: "var(--color-panel)",
              border: "1px solid var(--color-line)",
              borderRadius: 12,
              color: "var(--color-ink)",
            }}
          />
          <Bar dataKey="favor" name="A favor" fill="var(--color-flag)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="contra" name="En contra" fill="var(--color-muted)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TeamDossier({ sample }: { sample: TeamSample }) {
  return (
    <article className="rounded-2xl border border-line bg-panel p-4">
      <div className="mb-4 flex items-center gap-3">
        <TeamCrest id={sample.team.id} />
        <div className="min-w-0">
          <h3 className="truncate font-display text-2xl leading-none tracking-wide uppercase">
            {sample.team.name}
          </h3>
          <p className="text-sm text-muted">
            {sample.matches.length} partidos de liga · {sample.team.leagueName}
          </p>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-panel-2 px-3 py-3">
          <p className="text-xs tracking-wide text-muted uppercase">A favor</p>
          <p className="font-display text-4xl leading-none text-flag tabular-nums">
            {one.format(sample.forAvg)}
          </p>
        </div>
        <div className="rounded-xl bg-panel-2 px-3 py-3">
          <p className="text-xs tracking-wide text-muted uppercase">En contra</p>
          <p className="font-display text-4xl leading-none tabular-nums">{one.format(sample.againstAvg)}</p>
        </div>
      </div>
      <HistoryChart matches={sample.matches} />
      <p className="mt-2 mb-3 flex gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-sm bg-flag" /> A favor
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-sm bg-muted" /> En contra
        </span>
      </p>
      <ul className="divide-y divide-line">
        {sample.matches.map((match) => (
          <li key={match.eventId} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 py-2 text-sm">
            <span className="text-muted capitalize">{formatDay(match.date)}</span>
            <span className="min-w-0">
              <span className="block truncate">
                {match.home ? "vs" : "en"} {match.opponent}
              </span>
              <span className="text-xs text-muted">
                {match.scoreFor}–{match.scoreAgainst}
              </span>
            </span>
            <span className="text-right tabular-nums">
              <span className="text-flag">{match.cornersFor}</span>
              <span className="text-muted"> / {match.cornersAgainst}</span>
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function MatchReport({ analysis }: { analysis: Analysis }) {
  const { home, away, projection } = analysis;
  const band =
    projection.band.from === projection.band.to
      ? `${projection.band.from}`
      : `${projection.band.from} a ${projection.band.to}`;
  const visible = projection.distribution.filter((row) => row.total >= 4 && row.total <= 16);
  const peak = Math.max(...visible.map((row) => row.probability), 0.01);

  return (
    <section className="rise grid gap-4">
      <div className="rounded-2xl border border-line bg-panel p-4 md:p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <TeamCrest id={home.team.id} />
            <div className="min-w-0">
              <p className="text-xs text-muted uppercase">Local</p>
              <p className="truncate font-medium">{home.team.name}</p>
            </div>
          </div>
          <span className="font-display text-xl text-muted">VS</span>
          <div className="flex min-w-0 items-center justify-end gap-2 text-right">
            <div className="min-w-0">
              <p className="text-xs text-muted uppercase">Visitante</p>
              <p className="truncate font-medium">{away.team.name}</p>
            </div>
            <TeamCrest id={away.team.id} />
          </div>
        </div>

        <p className="text-xs tracking-wide text-muted uppercase">Córners esperados</p>
        <p className="font-display text-7xl leading-none text-flag tabular-nums">
          {one.format(projection.expectedTotal)}
        </p>
        <p className="mt-3 max-w-xl text-pretty text-ink">
          <span className="font-display text-3xl text-flag tabular-nums">
            {pct.format(projection.headlineProbability)}
          </span>{" "}
          de chances de que haya {projection.headlineAtLeast} o más. La franja más probable es{" "}
          <strong className="font-medium">{band}</strong> ({pct.format(projection.band.probability)}).
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-panel-2 p-4">
            <p className="text-xs tracking-wide text-muted uppercase">{home.team.name} a favor</p>
            <p className="font-display text-4xl leading-none tabular-nums">
              {one.format(projection.expectedHome)}
            </p>
            <p className="mt-2 text-sm text-pretty text-muted">
              Saca {one.format(projection.home.attackAvg)} {projection.home.attackSpecific ? "de local" : "de media"}.{" "}
              {away.team.name} concede {one.format(projection.home.concedeAvg)}{" "}
              {projection.home.concedeSpecific ? "de visitante" : "de media"}.
            </p>
            <p className="mt-1 text-sm text-muted">{sideNote(projection.home)}</p>
          </div>
          <div className="rounded-xl bg-panel-2 p-4">
            <p className="text-xs tracking-wide text-muted uppercase">{away.team.name} a favor</p>
            <p className="font-display text-4xl leading-none tabular-nums">
              {one.format(projection.expectedAway)}
            </p>
            <p className="mt-2 text-sm text-pretty text-muted">
              Saca {one.format(projection.away.attackAvg)} {projection.away.attackSpecific ? "de visitante" : "de media"}.{" "}
              {home.team.name} concede {one.format(projection.away.concedeAvg)}{" "}
              {projection.away.concedeSpecific ? "de local" : "de media"}.
            </p>
            <p className="mt-1 text-sm text-muted">{sideNote(projection.away)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-line bg-panel p-4 md:p-6">
          <h2 className="font-display text-2xl tracking-wide uppercase">Cuántos es probable que haya</h2>
          <ul className="mt-4 grid gap-3">
            {projection.atLeast.map((row) => (
              <li key={row.atLeast} className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-3">
                <span className="text-sm">{row.atLeast} o más</span>
                <span className="h-2 overflow-hidden rounded-full bg-panel-2">
                  <span
                    className="block h-full rounded-full bg-flag"
                    style={{ width: `${Math.round(row.probability * 100)}%` }}
                  />
                </span>
                <span className="text-right text-sm tabular-nums">{pct.format(row.probability)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4 md:p-6">
          <h2 className="font-display text-2xl tracking-wide uppercase">Total exacto</h2>
          <ul className="mt-4 flex h-36 items-end gap-1">
            {visible.map((row) => (
              <li key={row.total} className="flex h-full flex-1 flex-col justify-end gap-1">
                <span
                  className="rounded-sm bg-flag"
                  style={{ height: `${Math.max(4, (row.probability / peak) * 100)}%` }}
                  title={`${row.total}: ${pct.format(row.probability)}`}
                />
                <span className="text-center text-xs text-muted tabular-nums">{row.total}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-pretty text-muted">
            Cada barra es la chance de ese número justo de córners. El modelo es una Poisson: los córners se
            tratan como conteos independientes alrededor del promedio.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-panel">
        <div className="border-b border-line px-4 py-4 md:px-6">
          <h2 className="font-display text-2xl tracking-wide uppercase">Líneas de más / menos</h2>
          <p className="text-sm text-muted">Más de 8,5 quiere decir 9 córners o más.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[20rem] text-left text-sm">
            <thead className="text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium md:px-6">Línea</th>
                <th className="px-4 py-3 font-medium">Más</th>
                <th className="px-4 py-3 font-medium md:px-6">Menos</th>
              </tr>
            </thead>
            <tbody>
              {projection.lines.map((line) => (
                <tr key={line.line} className="border-t border-line">
                  <td className="px-4 py-3 tabular-nums md:px-6">{one.format(line.line)}</td>
                  <td className="px-4 py-3 text-flag tabular-nums">{pct.format(line.over)}</td>
                  <td className="px-4 py-3 tabular-nums md:px-6">{pct.format(line.under)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TeamDossier sample={home} />
        <TeamDossier sample={away} />
      </div>

      <p className="text-sm text-pretty text-muted">
        Lectura con los últimos partidos que FotMob publica, el mismo peso para cada uno. No es una
        recomendación de apuesta: un partido puede salir del promedio por el rival, el marcador o el árbitro.
      </p>
    </section>
  );
}

export function ResultReport({ analysis }: { analysis: Analysis }) {
  const { home, away, cards } = analysis;
  const result = readResult(home, away, cards.meetings);
  if (!result.enough) {
    return (
      <section className="rounded-2xl border border-line bg-panel p-4 text-sm text-pretty text-muted">
        No hay suficientes resultados recientes para estimar este cruce.
      </section>
    );
  }

  const favorite =
    result.call === "home" ? home.team.name : result.call === "away" ? away.team.name : "el empate";
  const favoriteChance =
    result.call === "home" ? result.homeWin : result.call === "away" ? result.awayWin : result.draw;
  const rows: { key: ResultCall; label: string; chance: number }[] = [
    { key: "home", label: home.team.name, chance: result.homeWin },
    { key: "draw", label: "Empate", chance: result.draw },
    { key: "away", label: away.team.name, chance: result.awayWin },
  ];

  return (
    <section className="rise grid gap-4">
      <div className="rounded-2xl border border-line bg-panel p-4 md:p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <TeamCrest id={home.team.id} />
            <div className="min-w-0">
              <p className="text-xs text-muted uppercase">Local</p>
              <p className="truncate font-medium">{home.team.name}</p>
            </div>
          </div>
          <span className="font-display text-xl text-muted">VS</span>
          <div className="flex min-w-0 items-center justify-end gap-2 text-right">
            <div className="min-w-0">
              <p className="text-xs text-muted uppercase">Visitante</p>
              <p className="truncate font-medium">{away.team.name}</p>
            </div>
            <TeamCrest id={away.team.id} />
          </div>
        </div>
        <p className="text-xs tracking-wide text-muted uppercase">Resultado más probable</p>
        <p className="mt-1 font-display text-5xl leading-none tracking-wide uppercase md:text-6xl">
          {result.call === "draw" ? "Empate" : favorite}
        </p>
        <p className="mt-3 max-w-xl text-pretty text-ink">
          <span className="font-display text-3xl text-flag tabular-nums">{pct.format(favoriteChance)}</span> de
          chances para {favorite}.
          {result.call === "draw"
            ? ` El local tiene ${pct.format(result.homeWin)} y el visitante ${pct.format(result.awayWin)}.`
            : ` El empate tiene ${pct.format(result.draw)}.`}
        </p>
        <ul className="mt-6 grid gap-3">
          {rows.map((row) => (
            <li key={row.key} className="grid gap-1">
              <span className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{row.label}</span>
                <span className="tabular-nums">{pct.format(row.chance)}</span>
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-panel-2">
                <span
                  className={`block h-full rounded-full ${row.key === result.call ? "bg-flag" : "bg-ink/40"}`}
                  style={{ width: `${Math.max(4, Math.round(row.chance * 100))}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-pretty text-muted">
          Goles esperados: {one.format(result.expectedHome)} para {home.team.name} y{" "}
          {one.format(result.expectedAway)} para {away.team.name}. Sale de lo que marca cada uno y de lo que le
          hacen al rival
          {result.home.venue && result.away.venue ? ", de local y de visitante" : ""}.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FormCard name={home.team.name} form={result.home} place="local" />
        <FormCard name={away.team.name} form={result.away} place="visitante" />
      </div>

      <div className="rounded-2xl border border-line bg-panel p-4 md:p-6">
        <h2 className="font-display text-2xl tracking-wide uppercase">Entre ellos</h2>
        {result.meetings.length === 0 ? (
          <p className="mt-3 text-sm text-pretty text-muted">
            No hay cruces recientes publicados. La lectura usa solo los últimos partidos de cada equipo.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-pretty text-muted">
              En {result.meetings.length} {result.meetings.length === 1 ? "cruce" : "cruces"}, el marcador está
              puesto como lo vería hoy {home.team.name}.
            </p>
            <ul className="mt-2 divide-y divide-line">
              {result.meetings.map((meeting) => (
                <li key={meeting.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="capitalize text-muted">{formatDay(meeting.date)}</span>
                  <span className="tabular-nums">{meeting.score}</span>
                  <span className="text-right">
                    {meeting.outcome === "draw"
                      ? "Empate"
                      : `Ganó ${meeting.outcome === "home" ? home.team.name : away.team.name}`}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <p className="text-sm text-pretty text-muted">
        Mezcla los últimos resultados, los goles de esa muestra y los encuentros entre ellos. No es una
        recomendación de apuesta: un partido se puede ir por un gol, una expulsión o el arco.
      </p>
    </section>
  );
}

function FormCard({ name, form, place }: { name: string; form: ResultForm; place: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4 md:p-6">
      <h2 className="truncate font-display text-2xl tracking-wide uppercase">{name}</h2>
      <p className="mt-1 text-sm text-muted">
        {form.venue ? `Últimos ${form.sample} de ${place}` : `Últimos ${form.sample}, sin separar localía`}
      </p>
      <p className="mt-3 font-display text-4xl leading-none tabular-nums">
        {form.wins}G {form.draws}E {form.losses}P
      </p>
      <p className="mt-2 text-sm text-muted">
        {one.format(form.goalsFor)} a favor y {one.format(form.goalsAgainst)} en contra.
      </p>
      <ul className="mt-4 divide-y divide-line">
        {form.recent.map((match) => {
          const mark = match.for > match.against ? "G" : match.for === match.against ? "E" : "P";
          return (
            <li key={match.id} className="flex items-center gap-3 py-2 text-sm">
              <span className={`w-6 font-medium ${mark === "G" ? "text-flag" : "text-muted"}`}>{mark}</span>
              <span className="min-w-0 flex-1 truncate">
                {match.home ? "vs" : "en"} {match.opponent}
              </span>
              <span className="tabular-nums">
                {match.for}–{match.against}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CardReport({ analysis }: { analysis: Analysis }) {
  const { cards, home, away } = analysis;
  if (!cards.enough) {
    return (
      <section className="rounded-2xl border border-line bg-panel p-4 text-sm text-pretty text-muted">
        No hay suficientes partidos con tarjetas publicadas para estimar este cruce.
      </section>
    );
  }

  return (
    <section className="rise grid gap-4">
      <div className="rounded-2xl border border-line bg-panel p-4 md:p-6">
        <p className="text-xs tracking-wide text-muted uppercase">Tarjetas esperadas</p>
        <p className="font-display text-7xl leading-none text-flag tabular-nums">{one.format(cards.expectedTotal)}</p>
        <p className="mt-3 max-w-xl text-pretty text-ink">
          {one.format(cards.expectedHome)} para {home.team.name} y {one.format(cards.expectedAway)} para{" "}
          {away.team.name}. Sale de lo que comete cada uno y de lo que le hacen al rival, en los últimos 10.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            [home.team.name, cards.home],
            [away.team.name, cards.away],
          ].map(([name, side]) => {
            const row = side as typeof cards.home;
            return (
              <div key={String(name)} className="rounded-xl bg-panel-2 p-4">
                <p className="truncate text-xs tracking-wide text-muted uppercase">{String(name)}</p>
                <p className="mt-2 text-sm text-muted">Comete</p>
                <p className="font-display text-4xl leading-none tabular-nums">{one.format(row.commitAvg)}</p>
                <p className="mt-2 text-sm text-muted">
                  {one.format(row.yellowAvg)} amarillas · {one.format(row.redAvg)} rojas
                </p>
                <p className="mt-3 text-sm text-muted">Concede</p>
                <p className="font-display text-4xl leading-none tabular-nums">{one.format(row.concedeAvg)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-panel p-4 md:p-6">
        <h2 className="font-display text-2xl tracking-wide uppercase">Últimos 3 enfrentamientos</h2>
        {cards.meetings.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No encontré cruces recientes entre estos equipos.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {cards.meetings.map((meeting) => (
              <li key={meeting.id} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 py-3 text-sm">
                <span className="text-muted capitalize">{formatDay(meeting.date)}</span>
                <span className="min-w-0">
                  <span className="block truncate">
                    {meeting.home} {meeting.score} {meeting.away}
                  </span>
                </span>
                <span className="text-right tabular-nums">
                  <span className="text-flag">{meeting.homeCards + meeting.awayCards}</span>
                  <span className="text-muted">
                    {" "}
                    ({meeting.homeCards}-{meeting.awayCards})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-panel p-4 md:p-6">
        <h2 className="font-display text-2xl tracking-wide uppercase">Árbitro</h2>
        {cards.referee ? (
          <p className="mt-3 text-pretty text-ink">
            <strong className="font-medium">{cards.referee.name}</strong>
            {cards.referee.matches > 0 ? (
              <>
                {" "}
                promedia {one.format(cards.referee.yellowPerMatch)} amarillas por partido y mostró{" "}
                {cards.referee.reds} rojas en {cards.referee.matches} partidos.
              </>
            ) : (
              <> está designado, pero todavía no hay un promedio de tarjetas.</>
            )}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted">El árbitro de este partido todavía no está designado.</p>
        )}
      </div>
    </section>
  );
}

function avgOf(values: number[]) {
  const usable = values.filter((value) => value >= 0);
  if (usable.length === 0) return null;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function VolumePanel({
  title,
  tone,
  unitFor,
  unitAgainst,
  total,
  homeName,
  awayName,
  homeExpected,
  awayExpected,
  homeFor,
  homeAgainst,
  awayFor,
  awayAgainst,
  homeSample,
  awaySample,
  homeNote,
  awayNote,
  homeRows,
  awayRows,
  meetings,
}: {
  title: string;
  tone: "corners" | "shots";
  unitFor: string;
  unitAgainst: string;
  total: number | null;
  homeName: string;
  awayName: string;
  homeExpected: number | null;
  awayExpected: number | null;
  homeFor: number;
  homeAgainst: number;
  awayFor: number;
  awayAgainst: number;
  homeSample: number;
  awaySample: number;
  homeNote: string;
  awayNote: string;
  homeRows: { id: string; date: string; label: string; score: string; own: number; other: number }[];
  awayRows: { id: string; date: string; label: string; score: string; own: number; other: number }[];
  meetings: { id: string; date: string; label: string; home: number; away: number }[];
}) {
  const meetingHome = avgOf(meetings.map((meeting) => meeting.home));
  const meetingAway = avgOf(meetings.map((meeting) => meeting.away));
  const ink = tone === "corners" ? "text-flag" : "text-[#9ad0ff]";
  const frame = tone === "corners" ? "border-flag" : "border-[#9ad0ff]";
  const banner = tone === "corners" ? "bg-flag text-flag-ink" : "bg-[#9ad0ff] text-[#071018]";
  return (
    <section className={`overflow-hidden rounded-3xl border-2 ${frame}`}>
      <header className={`px-4 py-4 ${banner}`}>
        <p className="font-display text-4xl leading-none tracking-wide uppercase">{title}</p>
        <p className="mt-1 text-sm">Este bloque es solo {title.toLowerCase()}.</p>
      </header>
      <div className="grid gap-4 p-3 md:p-4">
      <div className="rounded-2xl border border-line bg-panel p-4 md:p-6">
        <p className="text-xs tracking-wide text-muted uppercase">{title} en este partido</p>
        <p className={`font-display text-6xl leading-none tabular-nums ${ink}`}>
          {total == null ? "–" : one.format(total)}
        </p>
        <p className="mt-2 text-sm text-muted">Se esperan entre los dos equipos.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-panel-2 p-4">
            <p className="text-xs tracking-wide text-muted uppercase">{homeName}</p>
            <p className="font-display text-4xl leading-none tabular-nums">
              {homeExpected == null ? "–" : one.format(homeExpected)}
            </p>
            <p className="mt-1 text-sm text-muted">Se esperan de él</p>
          </div>
          <div className="rounded-xl bg-panel-2 p-4">
            <p className="text-xs tracking-wide text-muted uppercase">{awayName}</p>
            <p className="font-display text-4xl leading-none tabular-nums">
              {awayExpected == null ? "–" : one.format(awayExpected)}
            </p>
            <p className="mt-1 text-sm text-muted">Se esperan de él</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-line bg-panel p-4">
          <h3 className="truncate font-display text-2xl tracking-wide uppercase">{homeName}</h3>
          <p className="text-xs text-muted">Promedio de los últimos {homeSample}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-panel-2 px-3 py-3">
              <p className="text-xs tracking-wide text-muted uppercase">{unitFor}</p>
              <p className={`font-display text-4xl leading-none tabular-nums ${ink}`}>{one.format(homeFor)}</p>
            </div>
            <div className="rounded-xl bg-panel-2 px-3 py-3">
              <p className="text-xs tracking-wide text-muted uppercase">{unitAgainst}</p>
              <p className="font-display text-4xl leading-none tabular-nums">{one.format(homeAgainst)}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-pretty text-muted">{homeNote}</p>
          <ul className="mt-3 divide-y divide-line">
            {homeRows.map((row) => (
              <li key={row.id} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 py-2 text-sm">
                <span className="text-muted capitalize">{formatDay(row.date)}</span>
                <span className="min-w-0">
                  <span className="block truncate">{row.label}</span>
                  <span className="text-xs text-muted">{row.score}</span>
                </span>
                <span className="text-right tabular-nums">
                  <span className={ink}>{row.own}</span>
                  <span className="text-muted"> / {row.other}</span>
                </span>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-line bg-panel p-4">
          <h3 className="truncate font-display text-2xl tracking-wide uppercase">{awayName}</h3>
          <p className="text-xs text-muted">Promedio de los últimos {awaySample}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-panel-2 px-3 py-3">
              <p className="text-xs tracking-wide text-muted uppercase">{unitFor}</p>
              <p className={`font-display text-4xl leading-none tabular-nums ${ink}`}>{one.format(awayFor)}</p>
            </div>
            <div className="rounded-xl bg-panel-2 px-3 py-3">
              <p className="text-xs tracking-wide text-muted uppercase">{unitAgainst}</p>
              <p className="font-display text-4xl leading-none tabular-nums">{one.format(awayAgainst)}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-pretty text-muted">{awayNote}</p>
          <ul className="mt-3 divide-y divide-line">
            {awayRows.map((row) => (
              <li key={row.id} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 py-2 text-sm">
                <span className="text-muted capitalize">{formatDay(row.date)}</span>
                <span className="min-w-0">
                  <span className="block truncate">{row.label}</span>
                  <span className="text-xs text-muted">{row.score}</span>
                </span>
                <span className="text-right tabular-nums">
                  <span className={ink}>{row.own}</span>
                  <span className="text-muted"> / {row.other}</span>
                </span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="rounded-2xl border border-line bg-panel p-4 md:p-6">
        <h3 className="font-display text-2xl tracking-wide uppercase">Mano a mano · {title}</h3>
        {meetings.length === 0 || meetingHome == null || meetingAway == null ? (
          <p className="mt-3 text-sm text-muted">No hay cruces recientes con este dato.</p>
        ) : (
          <>
            <p className="mt-3 text-sm text-pretty text-muted">
              En {meetings.length} {meetings.length === 1 ? "cruce" : "cruces"}, el local promedió{" "}
              {one.format(meetingHome)} y el visitante {one.format(meetingAway)}.
            </p>
            <ul className="mt-2 divide-y divide-line">
              {meetings.map((meeting) => (
                <li key={meeting.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 truncate">{meeting.label}</span>
                  <span className="shrink-0 text-muted capitalize">{formatDay(meeting.date)}</span>
                  <span className="shrink-0 tabular-nums">
                    {meeting.home < 0 ? "–" : meeting.home}-{meeting.away < 0 ? "–" : meeting.away}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      </div>
      <p className={`border-t px-4 py-3 text-center text-xs tracking-wide uppercase ${frame} ${ink}`}>
        Termina {title.toLowerCase()}
      </p>
    </section>
  );
}

export function DeepReport({ analysis }: { analysis: Analysis }) {
  const { home, away, projection, cards } = analysis;
  const shots = readShots(home.matches, away.matches);
  const cornerRows = (sample: TeamSample) =>
    sample.matches.map((match) => ({
      id: match.eventId,
      date: match.date,
      label: `${match.home ? "vs" : "en"} ${match.opponent}`,
      score: `${match.scoreFor}–${match.scoreAgainst}`,
      own: match.cornersFor,
      other: match.cornersAgainst,
    }));
  const shotRows = (sample: TeamSample) =>
    sample.matches
      .filter((match) => match.shotsFor >= 0)
      .map((match) => ({
        id: match.eventId,
        date: match.date,
        label: `${match.home ? "vs" : "en"} ${match.opponent}`,
        score: `${match.scoreFor}–${match.scoreAgainst}`,
        own: match.shotsFor,
        other: match.shotsAgainst,
      }));
  const cornerMeetings = cards.meetings.map((meeting) => ({
    id: meeting.id,
    date: meeting.date,
    label: `${meeting.home} ${meeting.score} ${meeting.away}`,
    home: meeting.homeCorners,
    away: meeting.awayCorners,
  }));
  const shotMeetings = cards.meetings.map((meeting) => ({
    id: meeting.id,
    date: meeting.date,
    label: `${meeting.home} ${meeting.score} ${meeting.away}`,
    home: meeting.homeShots,
    away: meeting.awayShots,
  }));

  return (
    <section className="rise grid gap-8">
      <VolumePanel
        title="Córners"
        tone="corners"
        unitFor="A favor"
        unitAgainst="En contra"
        total={projection.expectedTotal}
        homeName={home.team.name}
        awayName={away.team.name}
        homeExpected={projection.expectedHome}
        awayExpected={projection.expectedAway}
        homeFor={home.forAvg}
        homeAgainst={home.againstAvg}
        awayFor={away.forAvg}
        awayAgainst={away.againstAvg}
        homeSample={home.matches.length}
        awaySample={away.matches.length}
        homeNote={`Saca ${one.format(projection.home.attackAvg)} ${projection.home.attackSpecific ? "de local" : "de media"}. ${away.team.name} concede ${one.format(projection.home.concedeAvg)} ${projection.home.concedeSpecific ? "de visitante" : "de media"}.`}
        awayNote={`Saca ${one.format(projection.away.attackAvg)} ${projection.away.attackSpecific ? "de visitante" : "de media"}. ${home.team.name} concede ${one.format(projection.away.concedeAvg)} ${projection.away.concedeSpecific ? "de local" : "de media"}.`}
        homeRows={cornerRows(home)}
        awayRows={cornerRows(away)}
        meetings={cornerMeetings}
      />
      <VolumePanel
        title="Remates"
        tone="shots"
        unitFor="Que hace"
        unitAgainst="Que le hacen"
        total={shots.enough ? shots.expectedTotal : null}
        homeName={home.team.name}
        awayName={away.team.name}
        homeExpected={shots.enough ? shots.expectedHome : null}
        awayExpected={shots.enough ? shots.expectedAway : null}
        homeFor={shots.home.forAvg}
        homeAgainst={shots.home.againstAvg}
        awayFor={shots.away.forAvg}
        awayAgainst={shots.away.againstAvg}
        homeSample={shots.home.sample}
        awaySample={shots.away.sample}
        homeNote={
          shots.enough
            ? `Hace ${one.format(shots.homeRole.attackAvg)} ${shots.homeRole.attackSpecific ? "de local" : "de media"}. ${away.team.name} recibe ${one.format(shots.homeRole.concedeAvg)} ${shots.homeRole.concedeSpecific ? "de visitante" : "de media"}.`
            : "No hay suficientes remates publicados en los últimos partidos."
        }
        awayNote={
          shots.enough
            ? `Hace ${one.format(shots.awayRole.attackAvg)} ${shots.awayRole.attackSpecific ? "de visitante" : "de media"}. ${home.team.name} recibe ${one.format(shots.awayRole.concedeAvg)} ${shots.awayRole.concedeSpecific ? "de local" : "de media"}.`
            : "No hay suficientes remates publicados en los últimos partidos."
        }
        homeRows={shotRows(home)}
        awayRows={shotRows(away)}
        meetings={shotMeetings}
      />

      <div className="rounded-2xl border border-line bg-panel p-4 md:p-6">
        <h2 className="font-display text-2xl tracking-wide uppercase">Tarjetas</h2>
        <p className="mt-2 font-display text-5xl leading-none text-flag tabular-nums">
          {cards.enough ? one.format(cards.expectedTotal) : "–"}
        </p>
        <p className="mt-2 text-sm text-muted">Se esperan en este partido.</p>
        {cards.enough ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <p className="text-sm text-pretty">
              <span className="font-medium">{home.team.name}</span> promedia {one.format(cards.home.commitAvg)} que
              comete y {one.format(cards.home.concedeAvg)} que concede. Se esperan {one.format(cards.expectedHome)}.
            </p>
            <p className="text-sm text-pretty">
              <span className="font-medium">{away.team.name}</span> promedia {one.format(cards.away.commitAvg)} que
              comete y {one.format(cards.away.concedeAvg)} que concede. Se esperan {one.format(cards.expectedAway)}.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">No hay suficientes tarjetas en los últimos partidos.</p>
        )}
        {cards.referee ? (
          <p className="mt-4 text-sm text-pretty">
            Árbitro: <strong className="font-medium">{cards.referee.name}</strong>
            {cards.referee.matches > 0
              ? ` promedia ${one.format(cards.referee.yellowPerMatch)} amarillas por partido.`
              : " está designado, sin promedio todavía."}
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">El árbitro todavía no está designado.</p>
        )}
      </div>
    </section>
  );
}

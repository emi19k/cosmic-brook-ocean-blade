import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, ChevronDown, Flag } from "lucide-react";
import { analyzeMatch, listCompetitions, listFixtures, type Analysis, type CompetitionBoard } from "@/lib/corners/api";
import type { FixtureCard, TeamPick } from "@/lib/corners/model";
import { CardReport, DeepReport, MatchReport, ResultReport } from "@/components/match-report";
import { TeamField } from "@/components/team-field";
import { ScoutBoard } from "@/components/scout-board";

const STORAGE_KEY = "esquina-picks-fotmob";

function errorText(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "No se pudo leer el partido. Probá de nuevo en un momento.";
}

const kickTime = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const kickDay = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  weekday: "short",
  day: "numeric",
  month: "short",
});

function crestUrl(id: string) {
  return `https://images.fotmob.com/image_resources/logo/teamlogo/${id}_xsmall.png`;
}

function Crest({ id }: { id: string }) {
  return (
    <img
      src={crestUrl(id)}
      alt=""
      width={22}
      height={22}
      loading="lazy"
      className="size-5 shrink-0 object-contain"
    />
  );
}

function MatchFace({ fixture }: { fixture: FixtureCard }) {
  const when = new Date(fixture.date);
  return (
    <span className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2">
      <span className="flex min-w-0 items-center justify-end gap-2">
        <span className="truncate text-sm font-medium">{fixture.home.name}</span>
        <Crest id={fixture.home.id} />
      </span>
      <span className="px-1 text-center">
        <span className="block text-[10px] tracking-wide text-muted capitalize">{kickDay.format(when)}</span>
        <span className="block text-base font-semibold tabular-nums">{kickTime.format(when)}</span>
      </span>
      <span className="flex min-w-0 items-center gap-2">
        <Crest id={fixture.away.id} />
        <span className="truncate text-sm font-medium">{fixture.away.name}</span>
      </span>
    </span>
  );
}

function FixtureStack({
  title,
  hint,
  fixtures,
  open,
  onToggle,
  onPick,
  homeId,
  awayId,
}: {
  title: string;
  hint?: string;
  fixtures: FixtureCard[];
  open: boolean;
  onToggle: () => void;
  onPick: (fixture: FixtureCard) => void;
  homeId?: string;
  awayId?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-[#182117]">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="min-w-0">
          <span className="block truncate font-medium">{title}</span>
          {hint ? <span className="mt-0.5 block text-xs text-muted">{hint}</span> : null}
        </span>
        <span className="ml-auto rounded-md bg-white/10 px-2 py-0.5 text-sm tabular-nums">{fixtures.length}</span>
        <ChevronDown className={`size-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="border-t border-line">
          {fixtures.map((fixture) => {
            const selected = homeId === fixture.home.id && awayId === fixture.away.id;
            return (
              <button
                key={fixture.id}
                type="button"
                aria-pressed={selected}
                className={`flex w-full border-t border-line px-3 py-3 text-left first:border-t-0 hover:bg-white/5 ${
                  selected ? "bg-white/5" : ""
                }`}
                onClick={() => onPick(fixture)}
              >
                <MatchFace fixture={fixture} />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function CornerApp() {
  const [home, setHome] = useState<TeamPick | null>(null);
  const [away, setAway] = useState<TeamPick | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [view, setView] = useState<"corners" | "cards" | "result" | "deep">("corners");
  const [matchId, setMatchId] = useState("");
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [fixtures, setFixtures] = useState<FixtureCard[]>([]);
  const [boards, setBoards] = useState<CompetitionBoard[]>([]);
  const [openBoard, setOpenBoard] = useState("");
  const [fixturesReady, setFixturesReady] = useState(false);
  const [agendaError, setAgendaError] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { home?: TeamPick | null; away?: TeamPick | null };
        if (saved.home?.id) setHome(saved.home);
        if (saved.away?.id) setAway(saved.away);
      }
    } catch {
      /* ignore broken local prefs */
    }
    setReady(true);
    void loadAgenda();
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ home, away }));
  }, [home, away, ready]);

  useEffect(() => {
    if (!analysis) return;
    reportRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [analysis]);

  async function loadAgenda() {
    setAgendaError("");
    setFixturesReady(false);
    try {
      const [rows, extra] = await Promise.all([
        listFixtures({ data: {} }),
        listCompetitions({ data: {} }).catch(() => [] as CompetitionBoard[]),
      ]);
      setFixtures(rows);
      setBoards(extra);
    } catch {
      setFixtures([]);
      setAgendaError("No pude leer la agenda. Tocá para reintentar.");
    } finally {
      setFixturesReady(true);
    }
  }

  async function run(nextHome = home, nextAway = away) {
    if (!nextHome || !nextAway) return;
    setLoading(true);
    setError("");
    try {
      const result = await analyzeMatch({
        data: { home: nextHome, away: nextAway, matchId },
      });
      setAnalysis(result);
    } catch (caught) {
      setAnalysis(null);
      setError(errorText(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 md:py-12">
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-flag text-flag-ink">
            <Flag className="size-5" aria-hidden="true" />
          </span>
          <p className="on-wallpaper font-display text-4xl leading-none tracking-wide uppercase md:text-5xl">
            Córners turbo sacados
          </p>
        </div>
        <p className="on-wallpaper text-sm text-ink">Últimos 10 de cada lado</p>
      </header>

      <section className="grid gap-3">
        <h1 className="on-wallpaper max-w-3xl font-display text-5xl leading-none tracking-wide uppercase md:text-7xl">
          Cuántos córners puede tener el partido
        </h1>
        <p className="on-wallpaper max-w-2xl text-pretty text-ink">
          Mirá los últimos partidos de cada equipo, cuántos córners sacan y cuántos conceden, y estimá el
          total del cruce que elijas.
        </p>
      </section>

      <form
        className="grid gap-4 rounded-2xl border border-white/20 bg-[#182117]/40 p-4 backdrop-blur-md md:p-6"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <div className="flex flex-col gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-end">
          <div className="w-full">
            <TeamField
              label="Local"
              hint="Boca, River, Arsenal…"
              value={home}
              ready={fixturesReady}
              glass
              onChange={(team) => {
                setHome(team);
                setMatchId("");
                setAnalysis(null);
              }}
            />
          </div>
          <button
            type="button"
            className="grid size-12 place-items-center self-center rounded-full border border-line text-muted hover:border-flag hover:text-ink"
            aria-label="Invertir local y visitante"
            onClick={() => {
              setHome(away);
              setAway(home);
              setAnalysis(null);
            }}
          >
            <ArrowLeftRight className="size-4" />
          </button>
          <div className="w-full">
            <TeamField
              label="Visitante"
              hint="El que juega de visitante"
              value={away}
              ready={fixturesReady}
              glass
              onChange={(team) => {
                setAway(team);
                setMatchId("");
                setAnalysis(null);
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["corners", "Córners"],
              ["cards", "Tarjetas"],
              ["result", "Resultado"],
              ["deep", "Análisis profundo"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              disabled={!fixturesReady || !home || !away || loading}
              className={`h-12 rounded-full px-2 text-sm font-medium disabled:opacity-40 ${
                view === id ? "bg-flag text-flag-ink" : "border border-line bg-transparent text-ink"
              }`}
              onClick={() => {
                setView(id);
                if (!analysis) void run();
              }}
            >
              {loading && view === id ? "Leyendo…" : label}
            </button>
          ))}
        </div>
        {error ? (
          <p className="rounded-xl border border-line bg-panel-2 px-3 py-3 text-sm text-pretty" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </main>

    <div className="bg-[#10140f]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <ScoutBoard
        homeId={home?.id}
        awayId={away?.id}
        onPick={(fixture) => {
          setHome(fixture.home);
          setAway(fixture.away);
          setMatchId(fixture.id);
          setAnalysis(null);
        }}
      />

      {analysis && view === "corners" ? (
        <div ref={reportRef}>
          <MatchReport analysis={analysis} />
        </div>
      ) : null}
      {analysis && view === "cards" ? (
        <div ref={reportRef}>
          <CardReport analysis={analysis} />
        </div>
      ) : null}
      {analysis && view === "result" ? (
        <div ref={reportRef}>
          <ResultReport analysis={analysis} />
        </div>
      ) : null}
      {analysis && view === "deep" ? (
        <div ref={reportRef}>
          <DeepReport analysis={analysis} />
        </div>
      ) : null}

      <section className="grid gap-3">
        {!fixturesReady ? (
          <p className="rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-muted">
            La agenda se está cargando…
          </p>
        ) : agendaError ? (
          <button
            type="button"
            className="rounded-2xl border border-line bg-panel px-4 py-3 text-left text-sm hover:border-flag"
            onClick={() => void loadAgenda()}
          >
            {agendaError}
          </button>
        ) : fixtures.length === 0 ? (
          <p className="rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-muted">
            No hay partidos de Liga o Copa Argentina en los próximos 5 días.
          </p>
        ) : (
          <FixtureStack
            title="Agenda"
            hint="Próximos 5 días."
            fixtures={fixtures}
            open={agendaOpen}
            onToggle={() => setAgendaOpen((open) => !open)}
            homeId={home?.id}
            awayId={away?.id}
            onPick={(fixture) => {
              setHome(fixture.home);
              setAway(fixture.away);
              setMatchId(fixture.id);
              setAnalysis(null);
            }}
          />
        )}
        {boards.map((board) => (
          <FixtureStack
            key={board.title}
            title={board.title}
            hint={board.title.toLowerCase().includes("nations league") ? "Hoy y mañana." : undefined}
            fixtures={board.fixtures}
            open={openBoard === board.title}
            onToggle={() => setOpenBoard((current) => (current === board.title ? "" : board.title))}
            homeId={home?.id}
            awayId={away?.id}
            onPick={(fixture) => {
              setHome(fixture.home);
              setAway(fixture.away);
              setMatchId(fixture.id);
              setAnalysis(null);
            }}
          />
        ))}
      </section>

      {!analysis && !loading ? (
        <section className="grid gap-3 sm:grid-cols-3">
          {[
            ["01", "Elegís el cruce", "Local y visitante, o un partido que está por jugarse."],
            ["02", "Mirá los últimos 10", "Córners a favor y en contra de cada equipo."],
            ["03", "Leé el porcentaje", "Cuántos córners es más probable que haya, y las líneas de más y menos."],
          ].map(([step, title, copy]) => (
            <article key={step} className="rounded-2xl border border-line bg-panel p-4">
              <p className="font-display text-3xl text-flag">{step}</p>
              <h2 className="mt-2 font-medium">{title}</h2>
              <p className="mt-1 text-sm text-pretty text-muted">{copy}</p>
            </article>
          ))}
        </section>
      ) : null}
      </div>
    </div>
    </>
  );
}

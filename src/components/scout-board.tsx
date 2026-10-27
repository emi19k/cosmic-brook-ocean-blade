import { useEffect, useState } from "react";
import { ScanSearch } from "lucide-react";
import { listScout } from "@/lib/corners/api";
import type { ScoutPick, TeamPick } from "@/lib/corners/model";

const pct = new Intl.NumberFormat("es-AR", { style: "percent", maximumFractionDigits: 0 });
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

const filters = [
  ["all", "Todos"],
  ["result", "Resultados"],
  ["shots", "Remates"],
  ["outside", "Fuera de agenda"],
] as const;

type FilterId = (typeof filters)[number][0];

export function ScoutBoard({
  homeId,
  awayId,
  onPick,
}: {
  homeId?: string;
  awayId?: string;
  onPick: (fixture: { id: string; home: TeamPick; away: TeamPick }) => void;
}) {
  const [picks, setPicks] = useState<ScoutPick[] | null>(null);
  const [scanned, setScanned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const board = await listScout({ data: {} });
      setPicks(board.picks);
      setScanned(board.scanned);
    } catch {
      setPicks(null);
      setError("No pude armar el scout. Tocá para reintentar.");
    } finally {
      setLoading(false);
    }
  }

  const visible = (picks ?? []).filter((pick) => {
    if (filter === "result") return pick.kind === "result";
    if (filter === "shots") return pick.kind === "shots";
    if (filter === "outside") return pick.outside;
    return true;
  });

  return (
    <section className="grid gap-3">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-flag text-flag-ink">
          <ScanSearch className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-3xl leading-none tracking-wide uppercase">Scout</h2>
          <p className="mt-1 text-sm text-pretty text-muted">
            Las chances más altas de un resultado o de remates. También mira partidos que no están en la agenda.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3">
          <p className="text-sm text-muted">Buscando rachas, mano a mano y remates…</p>
          <div className="motion-safe:animate-pulse h-28 rounded-2xl border border-line bg-panel" />
          <div className="motion-safe:animate-pulse h-28 rounded-2xl border border-line bg-panel" />
        </div>
      ) : error ? (
        <button
          type="button"
          className="rounded-2xl border border-line bg-panel px-4 py-3 text-left text-sm hover:border-flag"
          onClick={() => void load()}
        >
          {error}
        </button>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {filters.map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                className={`h-11 rounded-full px-4 text-sm font-medium ${
                  filter === id ? "bg-flag text-flag-ink" : "border border-line bg-panel text-ink"
                }`}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {scanned > 0 ? (
            <p className="text-xs text-muted">
              Estimación con los partidos recientes, no es una recomendación. Miré {scanned} cruces de varias ligas.
            </p>
          ) : null}
          {visible.length === 0 ? (
            <p className="rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-muted">
              {picks && picks.length === 0
                ? "En esta pasada no apareció una racha, un mano a mano o un remate con chance clara."
                : "Nada en este filtro."}
            </p>
          ) : (
            <div className="grid gap-3">
              {visible.map((pick) => {
                const when = new Date(pick.when);
                const selected = homeId === pick.home.id && awayId === pick.away.id;
                return (
                  <button
                    key={pick.id}
                    type="button"
                    aria-pressed={selected}
                    className={`rounded-2xl border bg-panel p-4 text-left hover:border-flag ${
                      selected ? "border-flag" : "border-line"
                    }`}
                    onClick={() => onPick({ id: pick.matchId, home: pick.home, away: pick.away })}
                  >
                    <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-xs tracking-wide text-muted uppercase">
                          {pick.kind === "result" ? "Resultado" : "Remates"} · {pick.league}
                        </p>
                        <h3 className="mt-1 font-display text-2xl leading-none tracking-wide uppercase">{pick.headline}</h3>
                      </div>
                      <p className="font-display text-4xl leading-none text-flag tabular-nums">{pct.format(pick.chance)}</p>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-sm">
                      <img src={crestUrl(pick.home.id)} alt="" width={20} height={20} className="size-5 object-contain" />
                      <span className="min-w-0 truncate">{pick.detail}</span>
                      <img src={crestUrl(pick.away.id)} alt="" width={20} height={20} className="size-5 object-contain" />
                    </p>
                    <p className="mt-2 text-sm text-pretty text-muted">{pick.reason}</p>
                    <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="capitalize">
                        {kickDay.format(when).replace(".", "")} · {kickTime.format(when)}
                      </span>
                      {pick.outside ? (
                        <span className="rounded-md bg-flag px-2 py-1 font-medium text-flag-ink">Fuera de la agenda</span>
                      ) : null}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

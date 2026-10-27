import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { searchTeams } from "@/lib/corners/api";
import type { TeamPick } from "@/lib/corners/model";

function crest(id: string) {
  return `https://images.fotmob.com/image_resources/logo/teamlogo/${id}_xsmall.png`;
}

export function TeamCrest({ id }: { id: string }) {
  return (
    <img
      src={crest(id)}
      alt=""
      width={40}
      height={40}
      className="size-10 rounded-full bg-panel-2 object-contain p-1"
    />
  );
}

export function TeamField({
  label,
  hint,
  value,
  ready = true,
  glass = false,
  onChange,
}: {
  label: string;
  hint: string;
  value: TeamPick | null;
  ready?: boolean;
  glass?: boolean;
  onChange: (team: TeamPick | null) => void;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TeamPick[]>([]);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const handle = window.setTimeout(() => {
      setLoading(true);
      void searchTeams({ data: { q } })
        .then((teams) => {
          setResults(teams);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 280);
    return () => window.clearTimeout(handle);
  }, [query]);

  const boxClass = glass
    ? "border-white/25 bg-black/25 backdrop-blur-sm"
    : "border-line bg-panel";

  if (!ready) {
    return (
      <div>
        <p className="mb-2 text-xs tracking-wide text-muted uppercase">{label}</p>
        <p className={`flex min-h-12 items-center rounded-2xl border px-4 text-sm text-muted ${boxClass}`}>
          La agenda se está cargando…
        </p>
      </div>
    );
  }

  if (value) {
    return (
      <div className={`flex min-h-16 items-center gap-3 rounded-2xl border px-3 py-2 ${boxClass}`}>
        <TeamCrest id={value.id} />
        <div className="min-w-0 flex-1">
          <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
          <p className="truncate font-medium">{value.name}</p>
          <p className="truncate text-sm text-muted">{value.leagueName}</p>
        </div>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full text-muted hover:bg-panel-2 hover:text-ink"
          aria-label={`Cambiar ${label.toLowerCase()}`}
          onClick={() => {
            onChange(null);
            setQuery("");
            setResults([]);
          }}
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={box} className="relative">
      <label className="mb-2 block text-xs tracking-wide text-muted uppercase" htmlFor={listId}>
        {label}
      </label>
      <div className={`flex min-h-12 items-center gap-2 rounded-2xl border px-3 ${glass ? "border-white/25 bg-black/25 backdrop-blur-sm" : "border-line bg-panel-2"}`}>
        <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
        <input
          id={listId}
          value={query}
          placeholder={hint}
          autoComplete="off"
          className="h-12 w-full bg-transparent text-base text-ink outline-none placeholder:text-muted"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
        />
      </div>
      {open && query.trim().length >= 2 ? (
        <ul className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-line bg-panel p-1 shadow-lg">
          {loading && results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted">Buscando equipos…</li>
          ) : null}
          {!loading && results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted">Ningún equipo con ese nombre.</li>
          ) : null}
          {results.map((team) => (
            <li key={`${team.id}-${team.league}`}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-panel-2"
                onClick={() => {
                  onChange(team);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <TeamCrest id={team.id} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{team.name}</span>
                  <span className="block truncate text-sm text-muted">{team.leagueName}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

import { createServerFn } from "@tanstack/react-start";
import { projectMatch, readCards, type CardRead, type FixtureCard, type Projection, type ScoutPick, type ShotBoard, type TeamPick, type TeamSample } from "@/lib/corners/model";

export type Analysis = {
  home: TeamSample;
  away: TeamSample;
  projection: Projection;
  cards: CardRead;
};

function readTeam(value: unknown, label: string): TeamPick {
  if (!value || typeof value !== "object") throw new Error(`Elegí el equipo ${label}.`);
  const team = value as Partial<TeamPick>;
  if (!team.id || !team.name || !team.league) throw new Error(`Elegí el equipo ${label}.`);
  if (!/^[a-z0-9._-]+$/i.test(team.league) || !/^\d+$/.test(team.id)) {
    throw new Error("Equipo inválido.");
  }
  return {
    id: team.id,
    name: String(team.name).slice(0, 80),
    league: team.league,
    leagueName: String(team.leagueName || team.league).slice(0, 80),
    abbreviation: String(team.abbreviation || team.name.slice(0, 3)).slice(0, 8),
  };
}

export const searchTeams = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const query = typeof data === "object" && data && "q" in data ? String(data.q) : "";
    const q = query.trim().slice(0, 60);
    if (q.length < 2) return { q: "" };
    return { q };
  })
  .handler(async ({ data }) => {
    if (!data.q) return [];
    const { searchFotmobTeams } = await import("./fotmob.server");
    return searchFotmobTeams(data.q);
  });

export const analyzeMatch = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Falta el partido.");
    const body = data as { home?: unknown; away?: unknown; matchId?: unknown };
    const home = readTeam(body.home, "local");
    const away = readTeam(body.away, "visitante");
    if (home.id === away.id) throw new Error("Elegí dos equipos distintos.");
    const matchId = typeof body.matchId === "string" && /^\d+$/.test(body.matchId) ? body.matchId : "";
    return { home, away, matchId };
  })
  .handler(async ({ data }): Promise<Analysis> => {
    const { loadCardContext, loadTeamSample } = await import("./fotmob.server");
    const [home, away, context] = await Promise.all([
      loadTeamSample(data.home),
      loadTeamSample(data.away),
      loadCardContext(data.home, data.away, data.matchId),
    ]);
    return {
      home,
      away,
      projection: projectMatch(home, away),
      cards: readCards(home.matches, away.matches, context.meetings, context.referee),
    };
  });

export type CompetitionBoard = {
  title: string;
  fixtures: FixtureCard[];
};

export const listFixtures = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .handler(async () => {
    const { loadFixtures } = await import("./fotmob.server");
    return loadFixtures();
  });

export const listCompetitions = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .handler(async () => {
    const { loadCompetitions } = await import("./fotmob.server");
    return loadCompetitions();
  });

export type { ShotBoard };

export type ScoutBoard = {
  scanned: number;
  picks: ScoutPick[];
};

export const listScout = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .handler(async (): Promise<ScoutBoard> => {
    const { loadScout } = await import("./fotmob.server");
    return loadScout();
  });

export const loadShotPicks = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Falta el partido.");
    const body = data as { home?: unknown; away?: unknown };
    const home = readTeam(body.home, "local");
    const away = readTeam(body.away, "visitante");
    if (home.id === away.id) throw new Error("Elegí dos equipos distintos.");
    return { home, away };
  })
  .handler(async ({ data }): Promise<ShotBoard> => {
    const { loadShotPicks: readPicks } = await import("./fotmob.server");
    return readPicks(data.home, data.away);
  });

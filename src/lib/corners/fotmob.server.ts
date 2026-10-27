import { bestShotLine, rankShotPlayers, readResult, resultScoutPick, summarizeTeam, takeScoutPicks, winStreak, type CardMeeting, type CardReferee, type CornerMatch, type FixtureCard, type ScoutPick, type ShotBoard, type ShotGame, type ShotPlayer, type TeamPick, type TeamSample } from "@/lib/corners/model";

const API = "https://www.fotmob.com/api/data";
const ART = "America/Argentina/Buenos_Aires";
const SAMPLE_TARGET = 10;
const SAMPLE_LOOKBACK = 12;

type CacheEntry = { exp: number; data: unknown };
const cache = new Map<string, CacheEntry>();

async function getJson<T>(url: string, ttlMs: number): Promise<T | null> {
  const hit = cache.get(url);
  if (hit && hit.exp > Date.now()) return hit.data as T;
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        referer: "https://www.fotmob.com/",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as T;
    cache.set(url, { exp: Date.now() + ttlMs, data });
    return data;
  } catch {
    return null;
  }
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function artParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ART,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: pick("year"), month: pick("month"), day: pick("day") };
}

function artMidnight(offsetDays: number) {
  const today = artParts(new Date());
  return Date.UTC(today.year, today.month - 1, today.day + offsetDays, 3, 0, 0);
}

function ymdFromOffset(offsetDays: number) {
  const parts = artParts(new Date(artMidnight(offsetDays)));
  return `${parts.year}${String(parts.month).padStart(2, "0")}${String(parts.day).padStart(2, "0")}`;
}

function abbreviate(name: string) {
  const clean = name.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, "").trim();
  const bits = clean.split(/\s+/).filter((part) => part.length > 2);
  if (bits.length >= 2) return (bits[0][0] + bits[1][0]).toUpperCase();
  return clean.slice(0, 3).toUpperCase();
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

type SuggestHit = {
  type?: string;
  id?: string;
  name?: string;
  leagueId?: number;
  leagueName?: string;
};

const MAIN_LEAGUES = new Set([112, 9305, 45, 13]);

function teamRank(name: string, leagueId: number, leagueName: string, query: string) {
  const folded = fold(name);
  const words = folded.split(/[^a-z0-9]+/).filter(Boolean);
  let score = 10;
  if (folded === query) score = 100;
  else if (words[0] === query) score = 80;
  else if (words.includes(query)) score = 70;
  else if (folded.includes(query)) score = 40;
  score -= Math.max(0, folded.length - query.length) * 0.35;
  if (MAIN_LEAGUES.has(leagueId) || /liga profesional|copa argentina|libertadores|sudamericana/i.test(leagueName)) {
    score += 24;
  }
  if (leagueId === 112) score += 8;
  if (!/\bu-?\d{2}\b/.test(query) && /\bu-?\d{2}\b|\bii\b|\breserves\b|\byouth\b/.test(folded)) score -= 50;
  return score;
}

export async function searchFotmobTeams(query: string): Promise<TeamPick[]> {
  const data = await getJson<Array<{ suggestions?: SuggestHit[] }>>(
    `${API}/search/suggest?term=${encodeURIComponent(query)}`,
    10 * 60 * 1000,
  );
  const folded = fold(query);
  const hits = (data ?? [])
    .flatMap((group) => group.suggestions ?? [])
    .filter((hit) => hit.type === "team" && hit.id && hit.name && /^\d+$/.test(hit.id));
  const ranked = [...hits].sort(
    (a, b) =>
      teamRank(b.name || "", b.leagueId || 0, b.leagueName || "", folded) -
      teamRank(a.name || "", a.leagueId || 0, a.leagueName || "", folded),
  );
  const seen = new Set<string>();
  const teams: TeamPick[] = [];
  for (const hit of ranked) {
    const id = hit.id as string;
    if (seen.has(id)) continue;
    seen.add(id);
    const league = String(hit.leagueId || "football");
    teams.push({
      id,
      name: hit.name as string,
      league,
      leagueName: hit.leagueName || "Fútbol",
      abbreviation: abbreviate(hit.name as string),
    });
    if (teams.length >= 8) break;
  }
  return teams;
}

type Side = { id?: number | string; name?: string; score?: number };
type TeamFixture = {
  id?: number;
  home?: Side;
  away?: Side;
  status?: { utcTime?: string; finished?: boolean; scoreStr?: string; cancelled?: boolean; awarded?: boolean };
  tournament?: { name?: string };
  notStarted?: boolean;
};

type TeamPayload = {
  fixtures?: { allFixtures?: { fixtures?: TeamFixture[] } };
};

function scoreText(side: Side | undefined, scoreStr: string | undefined, index: number) {
  if (typeof side?.score === "number") return String(side.score);
  const parts = (scoreStr || "").split(/\s+-\s+/);
  return parts[index] || "–";
}

type StatItem = { key?: string; title?: string; stats?: unknown[] };
type MatchEvent = { type?: string; card?: string; isHome?: boolean };
type MatchDetails = {
  content?: {
    stats?: { Periods?: { All?: { stats?: Array<{ stats?: StatItem[] }> } } };
    matchFacts?: {
      events?: { events?: MatchEvent[] };
      infoBox?: { Referee?: { text?: string; stats?: Array<{ type?: string; value?: number }> } | null };
    };
    h2h?: {
      matches?: Array<{
        home?: { name?: string; id?: string };
        away?: { name?: string; id?: string };
        status?: { utcTime?: string; finished?: boolean; scoreStr?: string };
        matchUrl?: string;
      }>;
    };
    playerStats?: Record<
      string,
      {
        name?: string;
        id?: number;
        teamId?: number;
        isGoalkeeper?: boolean;
        stats?: Array<{
          stats?: Record<string, { key?: string | null; stat?: { value?: number } }>;
        }>;
      }
    >;
  };
};

function readPair(detail: MatchDetails | null, key: string) {
  const groups = detail?.content?.stats?.Periods?.All?.stats ?? [];
  for (const group of groups) {
    for (const item of group.stats ?? []) {
      if ((item.key || "").toLowerCase() !== key) continue;
      const home = asNumber(item.stats?.[0]);
      const away = asNumber(item.stats?.[1]);
      if (home === null || away === null) return null;
      return { home, away };
    }
  }
  return null;
}

function readCorners(detail: MatchDetails | null) {
  return readPair(detail, "corners");
}

function countSide(events: MatchEvent[], homeSide: boolean) {
  let yellow = 0;
  let red = 0;
  for (const event of events) {
    if (event.type !== "Card" || Boolean(event.isHome) !== homeSide) continue;
    if (event.card === "Yellow") yellow += 1;
    else if (event.card === "Red") red += 1;
    else if (event.card === "YellowRed" || event.card === "SecondYellow") {
      yellow += 1;
      red += 1;
    }
  }
  return { yellow, red };
}

function readTeamCards(detail: MatchDetails | null, teamIsHome: boolean) {
  const events = detail?.content?.matchFacts?.events?.events;
  if (Array.isArray(events)) {
    const mine = countSide(events, teamIsHome);
    const theirs = countSide(events, !teamIsHome);
    return {
      yellowFor: mine.yellow,
      yellowAgainst: theirs.yellow,
      redFor: mine.red,
      redAgainst: theirs.red,
    };
  }
  const yellow = readPair(detail, "yellow_cards");
  const red = readPair(detail, "red_cards");
  if (!yellow && !red) return null;
  const yHome = yellow?.home ?? 0;
  const yAway = yellow?.away ?? 0;
  const rHome = red?.home ?? 0;
  const rAway = red?.away ?? 0;
  return teamIsHome
    ? { yellowFor: yHome, yellowAgainst: yAway, redFor: rHome, redAgainst: rAway }
    : { yellowFor: yAway, yellowAgainst: yHome, redFor: rAway, redAgainst: rHome };
}

export async function loadTeamSample(team: TeamPick): Promise<TeamSample> {
  const payload = await getJson<TeamPayload>(`${API}/teams?id=${team.id}`, 15 * 60 * 1000);
  const fixtures = payload?.fixtures?.allFixtures?.fixtures ?? [];
  const recent = fixtures
    .filter((fixture) => fixture.id && fixture.status?.finished && !fixture.status.cancelled && fixture.status.utcTime)
    .sort((a, b) => String(b.status?.utcTime).localeCompare(String(a.status?.utcTime)))
    .slice(0, SAMPLE_LOOKBACK);
  if (recent.length === 0) throw new Error(`No encontré partidos recientes de ${team.name}.`);

  const rows = await mapPool(recent, 5, async (fixture) => {
    const detail = await getJson<MatchDetails>(`${API}/matchDetails?matchId=${fixture.id}`, 12 * 60 * 60 * 1000);
    const corners = readCorners(detail);
    const homeId = String(fixture.home?.id ?? "");
    const awayId = String(fixture.away?.id ?? "");
    if (!corners || (homeId !== team.id && awayId !== team.id)) return null;
    const home = homeId === team.id;
    const rival = home ? fixture.away : fixture.home;
    const cards = readTeamCards(detail, home);
    const shots = readPair(detail, "total_shots");
    const match: CornerMatch = {
      eventId: String(fixture.id),
      date: fixture.status?.utcTime || "",
      opponent: rival?.name || "Rival",
      opponentId: String(rival?.id || ""),
      home,
      scoreFor: scoreText(home ? fixture.home : fixture.away, fixture.status?.scoreStr, home ? 0 : 1),
      scoreAgainst: scoreText(home ? fixture.away : fixture.home, fixture.status?.scoreStr, home ? 1 : 0),
      cornersFor: home ? corners.home : corners.away,
      cornersAgainst: home ? corners.away : corners.home,
      yellowFor: cards?.yellowFor ?? -1,
      yellowAgainst: cards?.yellowAgainst ?? -1,
      redFor: cards?.redFor ?? -1,
      redAgainst: cards?.redAgainst ?? -1,
      cardsFor: cards ? cards.yellowFor + cards.redFor : -1,
      cardsAgainst: cards ? cards.yellowAgainst + cards.redAgainst : -1,
      shotsFor: shots ? (home ? shots.home : shots.away) : -1,
      shotsAgainst: shots ? (home ? shots.away : shots.home) : -1,
      competition: fixture.tournament?.name || team.leagueName,
    };
    return match;
  });

  const matches = rows.filter((match): match is CornerMatch => match !== null).slice(0, SAMPLE_TARGET);
  if (matches.length < 4) {
    throw new Error(`${team.name} no tiene córners publicados en los últimos partidos.`);
  }
  return summarizeTeam(team, matches);
}

function eventIdFromUrl(url?: string) {
  return url?.match(/#(\d+)/)?.[1] || "";
}

function readReferee(detail: MatchDetails | null): CardReferee | null {
  const referee = detail?.content?.matchFacts?.infoBox?.Referee;
  if (!referee?.text) return null;
  const stats = referee.stats ?? [];
  const pick = (type: string) => stats.find((item) => item.type === type)?.value;
  const yellow = pick("yellowCards");
  return {
    name: referee.text,
    yellowPerMatch: typeof yellow === "number" ? yellow : 0,
    reds: pick("redCards") ?? 0,
    matches: pick("matches") ?? 0,
  };
}

export async function loadCardContext(
  home: TeamPick,
  away: TeamPick,
  matchId?: string,
): Promise<{ meetings: CardMeeting[]; referee: CardReferee | null }> {
  let id = matchId && /^\d+$/.test(matchId) ? matchId : "";
  if (!id) {
    const payload = await getJson<TeamPayload>(`${API}/teams?id=${home.id}`, 15 * 60 * 1000);
    const fixtures = payload?.fixtures?.allFixtures?.fixtures ?? [];
    const hit = fixtures.find(
      (fixture) => String(fixture.home?.id || "") === away.id || String(fixture.away?.id || "") === away.id,
    );
    if (hit?.id) id = String(hit.id);
  }
  if (!id) return { meetings: [], referee: null };

  const detail = await getJson<MatchDetails>(`${API}/matchDetails?matchId=${id}`, 30 * 60 * 1000);
  const raw = (detail?.content?.h2h?.matches ?? [])
    .filter((meeting) => meeting.status?.finished && meeting.status.utcTime)
    .sort((a, b) => String(b.status?.utcTime).localeCompare(String(a.status?.utcTime)))
    .slice(0, 3);
  const rows = await mapPool(raw, 3, async (meeting) => {
    const eventId = eventIdFromUrl(meeting.matchUrl);
    if (!eventId) return null;
    const played = await getJson<MatchDetails>(`${API}/matchDetails?matchId=${eventId}`, 12 * 60 * 60 * 1000);
    const events = played?.content?.matchFacts?.events?.events;
    if (!Array.isArray(events)) return null;
    const homeCards = countSide(events, true);
    const awayCards = countSide(events, false);
    const corners = readCorners(played);
    const shots = readPair(played, "total_shots");
    const row: CardMeeting = {
      id: eventId,
      date: meeting.status?.utcTime || "",
      home: meeting.home?.name || "Local",
      away: meeting.away?.name || "Visitante",
      score: meeting.status?.scoreStr || "–",
      homeCards: homeCards.yellow + homeCards.red,
      awayCards: awayCards.yellow + awayCards.red,
      homeCorners: corners?.home ?? -1,
      awayCorners: corners?.away ?? -1,
      homeShots: shots?.home ?? -1,
      awayShots: shots?.away ?? -1,
    };
    return row;
  });
  return {
    meetings: rows.filter((meeting): meeting is CardMeeting => meeting !== null),
    referee: readReferee(detail),
  };
}

type DayMatch = {
  id?: number;
  home?: { id?: number; name?: string; longName?: string };
  away?: { id?: number; name?: string; longName?: string };
  status?: { utcTime?: string; finished?: boolean; cancelled?: boolean; started?: boolean };
};
type DayLeague = { ccode?: string; name?: string; primaryId?: number; matches?: DayMatch[] };
type DayPayload = { leagues?: DayLeague[] };

function wantedLeague(name: string) {
  const folded = fold(name);
  return (
    folded.startsWith("liga profesional") ||
    folded.startsWith("copa argentina") ||
    folded.includes("libertadores") ||
    folded.includes("sudamericana")
  );
}

function leagueTitle(name: string) {
  if (fold(name).startsWith("copa argentina")) return "Copa Argentina";
  if (fold(name).startsWith("liga profesional")) return "Liga Profesional";
  return name.split(" - ")[0];
}

function pick(side: DayMatch["home"], leagueId: string, leagueName: string): TeamPick | null {
  if (!side?.id || !side.name) return null;
  const name = side.name;
  return {
    id: String(side.id),
    name,
    league: leagueId,
    leagueName,
    abbreviation: abbreviate(name),
  };
}

let agendaCache: { exp: number; cards: FixtureCard[] } | null = null;

export async function loadFixtures(): Promise<FixtureCard[]> {
  if (agendaCache && agendaCache.exp > Date.now()) return agendaCache.cards;
  const start = artMidnight(0);
  const end = artMidnight(5);
  const dates = [0, 1, 2, 3, 4, 5].map(ymdFromOffset);
  const days = await Promise.all(
    dates.map((ymd) => getJson<DayPayload>(`${API}/matches?date=${ymd}`, 10 * 60 * 1000)),
  );
  if (days.every((day) => !day)) throw new Error("No pude leer la agenda. Tocá para reintentar.");

  const cards = new Map<string, FixtureCard>();
  for (const day of days) {
    for (const league of day?.leagues ?? []) {
      const name = league.name || "";
      if (league.ccode !== "ARG" && !wantedLeague(name)) continue;
      if (!wantedLeague(name)) continue;
      const title = leagueTitle(name);
      const leagueId = String(league.primaryId || "football");
      for (const match of league.matches ?? []) {
        if (!match.id || !match.status?.utcTime || match.status.finished || match.status.cancelled) continue;
        const kick = Date.parse(match.status.utcTime);
        if (!Number.isFinite(kick) || kick < start || kick >= end) continue;
        const home = pick(match.home, leagueId, title);
        const away = pick(match.away, leagueId, title);
        if (!home || !away) continue;
        cards.set(String(match.id), {
          id: String(match.id),
          date: match.status.utcTime,
          league: leagueId,
          leagueName: title,
          home,
          away,
        });
      }
    }
  }
  const agenda = [...cards.values()].sort((a, b) => a.date.localeCompare(b.date));
  agendaCache = { exp: Date.now() + 10 * 60 * 1000, cards: agenda };
  return agenda;
}

export type CompetitionBoard = {
  title: string;
  fixtures: FixtureCard[];
};

function competitionTitle(name: string) {
  const folded = fold(name);
  if (/women|femen|frauen|dames|kvinner|u-?\d{2}|youth/.test(folded)) return null;
  if (folded.includes("uefa nations league")) return "Nations League";
  if (folded.includes("concacaf nations league")) return "CONCACAF Nations League";
  if (folded.includes("libertadores")) return "Copa Libertadores";
  if (folded.includes("sudamericana")) return "Copa Sudamericana";
  if (folded.startsWith("copa argentina")) return "Copa Argentina";
  if (folded.includes("caf champions league")) return "CAF Champions League";
  if (folded.includes("uefa champions league")) return "Champions League";
  if (folded.includes("europa league")) return "Europa League";
  if (folded.includes("conference league")) return "Conference League";
  return null;
}

function groupLabel(name: string, title: string) {
  const group = name.match(/\b([A-D])\s+Grp\.?\s*(\d+)/i);
  if (group) return `Grupo ${group[1]}`;
  if (/qualification/i.test(name)) return "Clasificación";
  if (/quarter/i.test(name)) return "Cuartos de final";
  if (/semi/i.test(name)) return "Semifinal";
  if (/round of 16|octavos/i.test(name)) return "Octavos";
  return title;
}

let boardsCache: { exp: number; boards: CompetitionBoard[] } | null = null;

export async function loadCompetitions(): Promise<CompetitionBoard[]> {
  if (boardsCache && boardsCache.exp > Date.now()) return boardsCache.boards;
  const start = artMidnight(0);
  const end = artMidnight(5);
  const dates = [0, 1, 2, 3, 4, 5].map(ymdFromOffset);
  const days = await Promise.all(
    dates.map((ymd) => getJson<DayPayload>(`${API}/matches?date=${ymd}`, 10 * 60 * 1000)),
  );
  if (days.every((day) => !day)) throw new Error("No pude leer las otras competiciones.");

  const groups = new Map<string, Map<string, FixtureCard>>();
  for (const day of days) {
    for (const league of day?.leagues ?? []) {
      const raw = league.name || "";
      const title = competitionTitle(raw);
      if (!title) continue;
      const leagueId = String(league.primaryId || "football");
      const label = groupLabel(raw, title);
      for (const match of league.matches ?? []) {
        if (!match.id || !match.status?.utcTime || match.status.finished || match.status.cancelled) continue;
        const kick = Date.parse(match.status.utcTime);
        const limit = title.toLowerCase().includes("nations league") ? artMidnight(2) : end;
        if (!Number.isFinite(kick) || kick < start || kick >= limit) continue;
        const home = pick(match.home, leagueId, label);
        const away = pick(match.away, leagueId, label);
        if (!home || !away) continue;
        const bucket = groups.get(title) ?? new Map<string, FixtureCard>();
        bucket.set(String(match.id), {
          id: String(match.id),
          date: match.status.utcTime,
          league: leagueId,
          leagueName: label,
          home,
          away,
        });
        groups.set(title, bucket);
      }
    }
  }

  const boards = [...groups.entries()]
    .map(([title, cards]) => ({
      title,
      fixtures: [...cards.values()].sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .filter((board) => board.fixtures.length > 0)
    .sort((a, b) => a.fixtures[0].date.localeCompare(b.fixtures[0].date));
  boardsCache = { exp: Date.now() + 10 * 60 * 1000, boards };
  return boards;
}

type SquadMember = { id?: number; name?: string };
type SquadPayload = TeamPayload & {
  details?: { name?: string };
  squad?: { squad?: Array<{ title?: string; members?: SquadMember[] }> };
};

function roleLabel(title: string) {
  const folded = fold(title);
  if (folded.includes("keep")) return "Arquero";
  if (folded.includes("defend")) return "Defensor";
  if (folded.includes("mid")) return "Volante";
  if (folded.includes("attack") || folded.includes("forward")) return "Delantero";
  return "Jugador";
}

function readPlayerStat(
  block: NonNullable<NonNullable<MatchDetails["content"]>["playerStats"]>[string],
  labels: string[],
  key?: string,
) {
  for (const group of block.stats ?? []) {
    const stats = group.stats ?? {};
    for (const [name, item] of Object.entries(stats)) {
      if (labels.includes(name) || (key && item.key === key)) {
        const value = item.stat?.value;
        if (typeof value === "number" && Number.isFinite(value)) return value;
      }
    }
  }
  return null;
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function summarizeShotPlayer(player: ShotPlayer): ShotPlayer {
  const shots = player.games.map((game) => game.shots);
  const onTarget = player.games.map((game) => game.onTarget);
  const average = shots.length ? shots.reduce((sum, value) => sum + value, 0) / shots.length : 0;
  const onTargetAvg = onTarget.length ? onTarget.reduce((sum, value) => sum + value, 0) / onTarget.length : 0;
  return {
    ...player,
    games: [...player.games].sort((a, b) => a.date.localeCompare(b.date)).slice(-10),
    average,
    median: median(shots),
    onTargetAvg,
  };
}

export async function loadShotPicks(home: TeamPick, away: TeamPick): Promise<ShotBoard> {
  const [homeTeam, awayTeam] = await Promise.all([
    getJson<SquadPayload>(`${API}/teams?id=${home.id}`, 15 * 60 * 1000),
    getJson<SquadPayload>(`${API}/teams?id=${away.id}`, 15 * 60 * 1000),
  ]);
  if (!homeTeam || !awayTeam) throw new Error("No pude leer las plantillas.");

  const players = new Map<string, ShotPlayer>();
  const seed = (payload: SquadPayload, team: TeamPick) => {
    for (const group of payload.squad?.squad ?? []) {
      const title = group.title || "";
      if (fold(title).includes("coach")) continue;
      const role = roleLabel(title);
      for (const member of group.members ?? []) {
        if (!member.id || !member.name) continue;
        const id = String(member.id);
        players.set(id, {
          id,
          name: member.name,
          teamId: team.id,
          teamName: team.name,
          role,
          games: [],
          average: 0,
          median: 0,
          onTargetAvg: 0,
        });
      }
    }
  };
  seed(homeTeam, home);
  seed(awayTeam, away);
  if (players.size === 0) throw new Error("No encontré jugadores de estos equipos.");

  const recentOf = (payload: SquadPayload | null, team: TeamPick) =>
    (payload?.fixtures?.allFixtures?.fixtures ?? [])
      .filter((fixture) => fixture.id && fixture.status?.finished && !fixture.status.cancelled && fixture.status.utcTime)
      .sort((a, b) => String(b.status?.utcTime).localeCompare(String(a.status?.utcTime)))
      .slice(0, SAMPLE_LOOKBACK)
      .map((fixture) => ({ team, fixture }));

  const seen = new Set<number>();
  const queue = [...recentOf(homeTeam, home), ...recentOf(awayTeam, away)].filter((row) => {
    const id = row.fixture.id as number;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  if (queue.length === 0) throw new Error("No hay partidos recientes para leer remates.");

  await mapPool(queue, 4, async ({ fixture }) => {
    const detail = await getJson<MatchDetails>(`${API}/matchDetails?matchId=${fixture.id}`, 12 * 60 * 60 * 1000);
    const stats = detail?.content?.playerStats;
    if (!stats) return null;
    const homeId = String(fixture.home?.id ?? "");
    const awayId = String(fixture.away?.id ?? "");
    for (const block of Object.values(stats)) {
      const teamId = String(block.teamId ?? "");
      if (teamId !== home.id && teamId !== away.id) continue;
      const id = String(block.id ?? "");
      if (!id) continue;
      const minutes = readPlayerStat(block, ["Minutes played"], "minutes_played");
      if (!minutes || minutes < 1) continue;
      const shots = readPlayerStat(block, ["Total shots"], "total_shots") ?? 0;
      const onTarget = readPlayerStat(block, ["Shots on target"], "ShotsOnTarget") ?? 0;
      const current = players.get(id);
      const teamName = teamId === home.id ? home.name : away.name;
      const opponent = teamId === homeId ? fixture.away : fixture.home;
      const game: ShotGame = {
        matchId: String(fixture.id),
        date: fixture.status?.utcTime || "",
        opponent: opponent?.name || "Rival",
        shots,
        onTarget,
        minutes,
      };
      if (current) {
        current.games.push(game);
      } else {
        players.set(id, {
          id,
          name: block.name || "Jugador",
          teamId,
          teamName,
          role: block.isGoalkeeper ? "Arquero" : "Jugador",
          games: [game],
          average: 0,
          median: 0,
          onTargetAvg: 0,
        });
      }
    }
    return null;
  });

  const ranked = rankShotPlayers([...players.values()].map(summarizeShotPlayer));
  if (ranked.every((player) => player.games.length === 0)) {
    throw new Error("Estos equipos no tienen remates de jugadores publicados.");
  }
  return { home, away, players: ranked };
}

function isScoutNoise(name: string) {
  const folded = fold(name);
  return /women|\(w\)|femen|frauen|dames|kvinner|u-?\d{2}|youth|reserve|\bii\b|amistoso|friendly/.test(folded);
}

function normalAgenda(name: string) {
  const folded = fold(name);
  return (
    folded.startsWith("liga profesional") ||
    folded.startsWith("copa argentina") ||
    folded.includes("libertadores") ||
    folded.includes("sudamericana")
  );
}

function isFeaturedLeague(name: string) {
  const folded = fold(name);
  return /serie a|premier league|laliga|la liga|bundesliga|ligue 1|eredivisie|brasileir|liga mx|primeira|championship|super league|dfb pokal|copa del rey|champions league|europa league|conference league|j1 league|k league|^mls$|liga portugal|liga 1|superliga|allsvenskan|eliteserien|ekstraklasa/.test(folded);
}

function onePerLeague(fixtures: FixtureCard[]): FixtureCard[] {
  const byLeague = new Map<string, FixtureCard[]>();
  for (const fixture of fixtures) {
    const bucket = byLeague.get(fixture.leagueName) ?? [];
    bucket.push(fixture);
    byLeague.set(fixture.leagueName, bucket);
  }
  return [...byLeague.values()].map((bucket) => bucket[Math.min(bucket.length - 1, Math.floor(bucket.length / 2))]);
}

function spaced(fixtures: FixtureCard[], limit: number): FixtureCard[] {
  if (fixtures.length <= limit) return fixtures;
  const out: FixtureCard[] = [];
  const used = new Set<string>();
  for (let i = 0; i < limit; i += 1) {
    const index = Math.min(fixtures.length - 1, Math.floor(((i + 0.5) * fixtures.length) / limit));
    const fixture = fixtures[index];
    if (!fixture || used.has(fixture.id)) continue;
    used.add(fixture.id);
    out.push(fixture);
  }
  return out;
}

function scoreMatches(team: TeamPick, payload: TeamPayload | null): CornerMatch[] {
  const fixtures = (payload?.fixtures?.allFixtures?.fixtures ?? [])
    .filter((fixture) => fixture.id && fixture.status?.finished && !fixture.status.cancelled && !fixture.status.awarded && fixture.status.utcTime)
    .sort((a, b) => String(b.status?.utcTime).localeCompare(String(a.status?.utcTime)))
    .slice(0, 10);
  const rows: CornerMatch[] = [];
  for (const fixture of fixtures) {
    const homeId = String(fixture.home?.id ?? "");
    const awayId = String(fixture.away?.id ?? "");
    if (homeId !== team.id && awayId !== team.id) continue;
    const home = homeId === team.id;
    const mine = home ? fixture.home : fixture.away;
    const rival = home ? fixture.away : fixture.home;
    if (typeof mine?.score !== "number" || typeof rival?.score !== "number") continue;
    rows.push({
      eventId: String(fixture.id),
      date: fixture.status?.utcTime || "",
      opponent: rival?.name || "Rival",
      opponentId: String(rival?.id || ""),
      home,
      scoreFor: String(mine.score),
      scoreAgainst: String(rival.score),
      cornersFor: 0,
      cornersAgainst: 0,
      yellowFor: -1,
      yellowAgainst: -1,
      redFor: -1,
      redAgainst: -1,
      cardsFor: -1,
      cardsAgainst: -1,
      shotsFor: -1,
      shotsAgainst: -1,
      competition: fixture.tournament?.name || team.leagueName,
    });
  }
  return rows;
}

function meetingsFromDetail(detail: MatchDetails | null): CardMeeting[] {
  return (detail?.content?.h2h?.matches ?? [])
    .filter((meeting) => meeting.status?.finished && meeting.status.scoreStr)
    .sort((a, b) => String(b.status?.utcTime).localeCompare(String(a.status?.utcTime)))
    .slice(0, 5)
    .map((meeting) => ({
      id: eventIdFromUrl(meeting.matchUrl) || String(meeting.status?.utcTime || meeting.home?.name),
      date: meeting.status?.utcTime || "",
      home: meeting.home?.name || "Local",
      away: meeting.away?.name || "Visitante",
      score: meeting.status?.scoreStr || "",
      homeCards: 0,
      awayCards: 0,
      homeCorners: -1,
      awayCorners: -1,
      homeShots: -1,
      awayShots: -1,
    }));
}

type FormRead = {
  fixture: FixtureCard;
  outside: boolean;
  home: TeamSample;
  away: TeamSample;
  chance: number;
  streak: number;
};

async function readForm(fixture: FixtureCard, outside: boolean): Promise<FormRead | null> {
  const [homePayload, awayPayload] = await Promise.all([
    getJson<TeamPayload>(`${API}/teams?id=${fixture.home.id}`, 15 * 60 * 1000),
    getJson<TeamPayload>(`${API}/teams?id=${fixture.away.id}`, 15 * 60 * 1000),
  ]);
  const homeMatches = scoreMatches(fixture.home, homePayload);
  const awayMatches = scoreMatches(fixture.away, awayPayload);
  if (homeMatches.length < 4 || awayMatches.length < 4) return null;
  const home = summarizeTeam(fixture.home, homeMatches);
  const away = summarizeTeam(fixture.away, awayMatches);
  const result = readResult(home, away, []);
  if (!result.enough || result.call === "draw") return null;
  const chance = result.call === "home" ? result.homeWin : result.awayWin;
  const streak = winStreak((result.call === "home" ? home : away).matches);
  return { fixture, outside, home, away, chance, streak };
}

function heat(row: FormRead) {
  return row.chance + Math.min(row.streak, 8) * 0.035 + (row.outside ? 0.03 : 0);
}

async function finishResult(row: FormRead): Promise<ScoutPick | null> {
  const detail = await getJson<MatchDetails>(`${API}/matchDetails?matchId=${row.fixture.id}`, 30 * 60 * 1000);
  return resultScoutPick({
    fixtureId: row.fixture.id,
    league: row.fixture.leagueName,
    when: row.fixture.date,
    outside: row.outside,
    home: row.home,
    away: row.away,
    meetings: meetingsFromDetail(detail),
  });
}

const shotAverage = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

async function scoutFixtureShots(fixture: FixtureCard, outside: boolean): Promise<ScoutPick[]> {
  const [homeTeam, awayTeam] = await Promise.all([
    getJson<TeamPayload>(`${API}/teams?id=${fixture.home.id}`, 15 * 60 * 1000),
    getJson<TeamPayload>(`${API}/teams?id=${fixture.away.id}`, 15 * 60 * 1000),
  ]);
  const recentOf = (payload: TeamPayload | null) =>
    (payload?.fixtures?.allFixtures?.fixtures ?? [])
      .filter((row) => row.id && row.status?.finished && !row.status.cancelled && row.status.utcTime)
      .sort((a, b) => String(b.status?.utcTime).localeCompare(String(a.status?.utcTime)))
      .slice(0, 5);
  const seen = new Set<number>();
  const queue = [...recentOf(homeTeam), ...recentOf(awayTeam)].filter((row) => {
    const id = row.id as number;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  const games = new Map<string, { name: string; teamId: string; shots: number[] }>();
  await mapPool(queue, 4, async (row) => {
    const detail = await getJson<MatchDetails>(`${API}/matchDetails?matchId=${row.id}`, 12 * 60 * 60 * 1000);
    const stats = detail?.content?.playerStats;
    if (!stats) return null;
    for (const block of Object.values(stats)) {
      const teamId = String(block.teamId ?? "");
      if (teamId !== fixture.home.id && teamId !== fixture.away.id) continue;
      if (block.isGoalkeeper) continue;
      const minutes = readPlayerStat(block, ["Minutes played"], "minutes_played");
      if (!minutes || minutes < 20) continue;
      const id = String(block.id ?? "");
      if (!id || !block.name) continue;
      const shots = readPlayerStat(block, ["Total shots"], "total_shots") ?? 0;
      const current = games.get(id) ?? { name: block.name, teamId, shots: [] };
      current.shots.push(shots);
      games.set(id, current);
    }
    return null;
  });

  const picks: ScoutPick[] = [];
  for (const [id, player] of games) {
    const line = bestShotLine(player.shots);
    if (!line) continue;
    const team = player.teamId === fixture.home.id ? fixture.home : fixture.away;
    const rival = player.teamId === fixture.home.id ? fixture.away : fixture.home;
    const every = line.hits === player.shots.length;
    picks.push({
      id: `shots-${fixture.id}-${id}-${line.line}`,
      kind: "shots",
      chance: line.chance,
      headline: `${player.name} hace ${line.line} remates o más`,
      detail: `${team.name} contra ${rival.name}`,
      reason: every
        ? `Lo hizo en todos sus últimos ${player.shots.length} partidos. Promedio ${shotAverage.format(line.average)} remates.`
        : `Lo hizo en ${line.hits} de sus últimos ${player.shots.length} partidos. Promedio ${shotAverage.format(line.average)} remates.`,
      league: fixture.leagueName,
      when: fixture.date,
      outside,
      matchId: fixture.id,
      home: fixture.home,
      away: fixture.away,
      player: player.name,
      line: line.line,
    });
  }
  const kept: ScoutPick[] = [];
  const usedTeams = new Set<string>();
  for (const pick of picks.sort((a, b) => b.chance - a.chance || (b.line ?? 0) - (a.line ?? 0))) {
    const teamId = pick.detail;
    if (usedTeams.has(teamId)) continue;
    usedTeams.add(teamId);
    kept.push(pick);
  }
  return kept;
}

export type ScoutBoard = {
  scanned: number;
  picks: ScoutPick[];
};

let scoutCache: { exp: number; board: ScoutBoard } | null = null;

export async function loadScout(): Promise<ScoutBoard> {
  if (scoutCache && scoutCache.exp > Date.now()) return scoutCache.board;
  const dates = [0, 1, 2].map(ymdFromOffset);
  const days = await Promise.all(
    dates.map((ymd) => getJson<DayPayload>(`${API}/matches?date=${ymd}`, 10 * 60 * 1000)),
  );
  if (days.every((day) => !day)) throw new Error("No pude leer los partidos para el scout.");

  const start = artMidnight(0);
  const end = artMidnight(3);
  const cards = new Map<string, FixtureCard>();
  for (const day of days) {
    for (const league of day?.leagues ?? []) {
      const raw = league.name || "";
      if (isScoutNoise(raw)) continue;
      const leagueId = String(league.primaryId || "football");
      const title = raw.split(" - ")[0];
      for (const match of league.matches ?? []) {
        if (!match.id || !match.status?.utcTime || match.status.finished || match.status.cancelled || match.status.started) continue;
        const kick = Date.parse(match.status.utcTime);
        if (!Number.isFinite(kick) || kick < start || kick >= end) continue;
        const home = pick(match.home, leagueId, title);
        const away = pick(match.away, leagueId, title);
        if (!home || !away || isScoutNoise(home.name) || isScoutNoise(away.name)) continue;
        cards.set(String(match.id), {
          id: String(match.id),
          date: match.status.utcTime,
          league: leagueId,
          leagueName: title,
          home,
          away,
        });
      }
    }
  }

  const all = [...cards.values()].sort((a, b) => a.date.localeCompare(b.date));
  const outside = all.filter((fixture) => !normalAgenda(fixture.leagueName));
  const inside = all.filter((fixture) => normalAgenda(fixture.leagueName));
  const outsideReps = onePerLeague(outside);
  const insideReps = onePerLeague(inside);
  const chosen = [
    ...spaced(outsideReps.filter((fixture) => isFeaturedLeague(fixture.leagueName)), 6),
    ...spaced(outsideReps.filter((fixture) => !isFeaturedLeague(fixture.leagueName)), 6),
    ...spaced(insideReps, 2),
  ];
  const forms = (
    await mapPool(chosen, 6, async (fixture) => {
      try {
        return await readForm(fixture, !normalAgenda(fixture.leagueName));
      } catch {
        return null;
      }
    })
  ).filter((row): row is FormRead => row !== null);
  const ranked = [...forms].sort((a, b) => heat(b) - heat(a));
  const signaled = ranked.filter(
    (row) => row.streak >= 3 || row.chance >= 0.56 || (row.outside && row.streak >= 2 && row.chance >= 0.5),
  );
  const shortlist = (signaled.length >= 4 ? signaled : ranked).slice(0, 8);
  const resultRows = await mapPool(shortlist, 4, async (row) => {
    try {
      return await finishResult(row);
    } catch {
      return null;
    }
  });
  const resultPicks = resultRows.filter((pick): pick is ScoutPick => pick !== null);

  const shotSource = (shortlist.length > 0 ? shortlist : ranked).filter((row) => row.outside);
  const shotHosts = (shotSource.length > 0 ? shotSource : shortlist.length > 0 ? shortlist : ranked)
    .slice(0, 2)
    .map((row) => row.fixture);
  const shotGroups = await mapPool(shotHosts, 2, async (fixture) => {
    try {
      return await scoutFixtureShots(fixture, !normalAgenda(fixture.leagueName));
    } catch {
      return [] as ScoutPick[];
    }
  });

  const board: ScoutBoard = {
    scanned: chosen.length,
    picks: [...takeScoutPicks(resultPicks, "result", 4), ...takeScoutPicks(shotGroups.flat(), "shots", 4)],
  };
  if (board.picks.length > 0) scoutCache = { exp: Date.now() + 20 * 60 * 1000, board };
  return board;
}

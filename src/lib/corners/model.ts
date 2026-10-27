export type CornerMatch = {
  eventId: string;
  date: string;
  opponent: string;
  opponentId: string;
  home: boolean;
  scoreFor: string;
  scoreAgainst: string;
  cornersFor: number;
  cornersAgainst: number;
  yellowFor: number;
  yellowAgainst: number;
  redFor: number;
  redAgainst: number;
  cardsFor: number;
  cardsAgainst: number;
  shotsFor: number;
  shotsAgainst: number;
  competition: string;
};

export type TeamPick = {
  id: string;
  name: string;
  league: string;
  leagueName: string;
  abbreviation: string;
};

export type FixtureCard = {
  id: string;
  date: string;
  league: string;
  leagueName: string;
  home: TeamPick;
  away: TeamPick;
};

export type TeamSample = {
  team: TeamPick;
  matches: CornerMatch[];
  forAvg: number;
  againstAvg: number;
  homeForAvg: number;
  homeForN: number;
  awayForAvg: number;
  awayForN: number;
  homeAgainstAvg: number;
  homeAgainstN: number;
  awayAgainstAvg: number;
  awayAgainstN: number;
};

export type SideExpectation = {
  expected: number;
  attackAvg: number;
  concedeAvg: number;
  attackSpecific: boolean;
  concedeSpecific: boolean;
};

export type LineOdds = {
  atLeast: number;
  probability: number;
};

export type Projection = {
  expectedHome: number;
  expectedAway: number;
  expectedTotal: number;
  home: SideExpectation;
  away: SideExpectation;
  distribution: { total: number; probability: number }[];
  atLeast: LineOdds[];
  lines: { line: number; over: number; under: number }[];
  band: { from: number; to: number; probability: number };
  headlineAtLeast: number;
  headlineProbability: number;
};

export type CardMeeting = {
  id: string;
  date: string;
  home: string;
  away: string;
  score: string;
  homeCards: number;
  awayCards: number;
  homeCorners: number;
  awayCorners: number;
  homeShots: number;
  awayShots: number;
};

export type CardReferee = {
  name: string;
  yellowPerMatch: number;
  reds: number;
  matches: number;
};

export type CardSide = {
  sample: number;
  commitAvg: number;
  concedeAvg: number;
  yellowAvg: number;
  redAvg: number;
  recent: CornerMatch[];
};

export type CardRead = {
  enough: boolean;
  expectedHome: number;
  expectedAway: number;
  expectedTotal: number;
  home: CardSide;
  away: CardSide;
  meetings: CardMeeting[];
  referee: CardReferee | null;
};

const VENUE_MIN = 3;
const DIST_MAX = 22;

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function poisson(k: number, lambda: number): number {
  if (k < 0) return 0;
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let log = -lambda;
  for (let i = 1; i <= k; i++) log += Math.log(lambda) - Math.log(i);
  return Math.exp(log);
}

function pickAvg(specific: number, n: number, overall: number) {
  if (n >= VENUE_MIN) return { value: specific, specific: true };
  return { value: overall, specific: false };
}

export function summarizeTeam(team: TeamPick, matches: CornerMatch[]): TeamSample {
  const home = matches.filter((match) => match.home);
  const away = matches.filter((match) => !match.home);
  return {
    team,
    matches,
    forAvg: mean(matches.map((match) => match.cornersFor)),
    againstAvg: mean(matches.map((match) => match.cornersAgainst)),
    homeForAvg: mean(home.map((match) => match.cornersFor)),
    homeForN: home.length,
    awayForAvg: mean(away.map((match) => match.cornersFor)),
    awayForN: away.length,
    homeAgainstAvg: mean(home.map((match) => match.cornersAgainst)),
    homeAgainstN: home.length,
    awayAgainstAvg: mean(away.map((match) => match.cornersAgainst)),
    awayAgainstN: away.length,
  };
}

function expectSide(
  attack: TeamSample,
  defense: TeamSample,
  venue: "home" | "away",
): SideExpectation {
  const attackPick =
    venue === "home"
      ? pickAvg(attack.homeForAvg, attack.homeForN, attack.forAvg)
      : pickAvg(attack.awayForAvg, attack.awayForN, attack.forAvg);
  const concedePick =
    venue === "home"
      ? pickAvg(defense.homeAgainstAvg, defense.homeAgainstN, defense.againstAvg)
      : pickAvg(defense.awayAgainstAvg, defense.awayAgainstN, defense.againstAvg);
  return {
    expected: (attackPick.value + concedePick.value) / 2,
    attackAvg: attackPick.value,
    concedeAvg: concedePick.value,
    attackSpecific: attackPick.specific,
    concedeSpecific: concedePick.specific,
  };
}

function centralBand(distribution: { total: number; probability: number }[]) {
  const mode = distribution.reduce((best, row) =>
    row.probability > best.probability ? row : best,
  );
  let from = mode.total;
  let to = mode.total;
  let probability = mode.probability;
  while (to - from < 4 && probability < 0.5) {
    const left = distribution.find((row) => row.total === from - 1)?.probability ?? -1;
    const right = distribution.find((row) => row.total === to + 1)?.probability ?? -1;
    if (right < 0 && left < 0) break;
    if (right >= left) {
      to += 1;
      probability += right;
    } else {
      from -= 1;
      probability += left;
    }
  }
  return { from, to, probability };
}

export function projectMatch(home: TeamSample, away: TeamSample): Projection {
  const homeSide = expectSide(home, away, "home");
  const awaySide = expectSide(away, home, "away");
  const expectedHome = homeSide.expected;
  const expectedAway = awaySide.expected;
  const expectedTotal = expectedHome + expectedAway;

  const raw = Array.from({ length: DIST_MAX + 1 }, (_, total) => ({
    total,
    probability: poisson(total, expectedTotal),
  }));
  const mass = raw.reduce((sum, row) => sum + row.probability, 0) || 1;
  const distribution = raw.map((row) => ({
    total: row.total,
    probability: row.probability / mass,
  }));

  const atLeast = [6, 7, 8, 9, 10, 11, 12, 13].map((goals) => ({
    atLeast: goals,
    probability: distribution
      .filter((row) => row.total >= goals)
      .reduce((sum, row) => sum + row.probability, 0),
  }));

  const lines = [6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5].map((line) => {
    const over = distribution
      .filter((row) => row.total > line)
      .reduce((sum, row) => sum + row.probability, 0);
    return { line, over, under: 1 - over };
  });

  const headlineAtLeast = Math.max(1, Math.round(expectedTotal));
  const headlineProbability = distribution
    .filter((row) => row.total >= headlineAtLeast)
    .reduce((sum, row) => sum + row.probability, 0);

  return {
    expectedHome,
    expectedAway,
    expectedTotal,
    home: homeSide,
    away: awaySide,
    distribution,
    atLeast,
    lines,
    band: centralBand(distribution),
    headlineAtLeast,
    headlineProbability,
  };
}

function venueRows(matches: CornerMatch[], venue: "home" | "away") {
  const rows = matches.filter((match) => (venue === "home" ? match.home : !match.home));
  return rows.length >= VENUE_MIN ? rows : matches;
}

function cardSide(matches: CornerMatch[]): CardSide {
  const usable = matches.filter((match) => match.cardsFor >= 0);
  return {
    sample: usable.length,
    commitAvg: mean(usable.map((match) => match.cardsFor)),
    concedeAvg: mean(usable.map((match) => match.cardsAgainst)),
    yellowAvg: mean(usable.map((match) => match.yellowFor)),
    redAvg: mean(usable.map((match) => match.redFor)),
    recent: usable.slice(0, 10),
  };
}

export function readCards(homeMatches: CornerMatch[], awayMatches: CornerMatch[], meetings: CardMeeting[], referee: CardReferee | null): CardRead {
  const home = cardSide(homeMatches);
  const away = cardSide(awayMatches);
  const homeCommit = mean(venueRows(home.recent, "home").map((match) => match.cardsFor));
  const awayConcede = mean(venueRows(away.recent, "away").map((match) => match.cardsAgainst));
  const awayCommit = mean(venueRows(away.recent, "away").map((match) => match.cardsFor));
  const homeConcede = mean(venueRows(home.recent, "home").map((match) => match.cardsAgainst));
  const expectedHome = home.sample && away.sample ? (homeCommit + awayConcede) / 2 : 0;
  const expectedAway = home.sample && away.sample ? (awayCommit + homeConcede) / 2 : 0;
  return {
    enough: home.sample >= 4 && away.sample >= 4,
    expectedHome,
    expectedAway,
    expectedTotal: expectedHome + expectedAway,
    home,
    away,
    meetings,
    referee,
  };
}

export type ShotSide = {
  sample: number;
  forAvg: number;
  againstAvg: number;
  homeForAvg: number;
  homeForN: number;
  awayForAvg: number;
  awayForN: number;
  homeAgainstAvg: number;
  homeAgainstN: number;
  awayAgainstAvg: number;
  awayAgainstN: number;
};

export type ShotRead = {
  enough: boolean;
  expectedHome: number;
  expectedAway: number;
  expectedTotal: number;
  home: ShotSide;
  away: ShotSide;
  homeRole: SideExpectation;
  awayRole: SideExpectation;
};

function shotSide(matches: CornerMatch[]): ShotSide {
  const usable = matches.filter((match) => match.shotsFor >= 0);
  const home = usable.filter((match) => match.home);
  const away = usable.filter((match) => !match.home);
  return {
    sample: usable.length,
    forAvg: mean(usable.map((match) => match.shotsFor)),
    againstAvg: mean(usable.map((match) => match.shotsAgainst)),
    homeForAvg: mean(home.map((match) => match.shotsFor)),
    homeForN: home.length,
    awayForAvg: mean(away.map((match) => match.shotsFor)),
    awayForN: away.length,
    homeAgainstAvg: mean(home.map((match) => match.shotsAgainst)),
    homeAgainstN: home.length,
    awayAgainstAvg: mean(away.map((match) => match.shotsAgainst)),
    awayAgainstN: away.length,
  };
}

function shotRole(attack: ShotSide, defense: ShotSide, venue: "home" | "away"): SideExpectation {
  const attackPick =
    venue === "home"
      ? pickAvg(attack.homeForAvg, attack.homeForN, attack.forAvg)
      : pickAvg(attack.awayForAvg, attack.awayForN, attack.forAvg);
  const concedePick =
    venue === "home"
      ? pickAvg(defense.awayAgainstAvg, defense.awayAgainstN, defense.againstAvg)
      : pickAvg(defense.homeAgainstAvg, defense.homeAgainstN, defense.againstAvg);
  return {
    expected: attack.sample && defense.sample ? (attackPick.value + concedePick.value) / 2 : 0,
    attackAvg: attackPick.value,
    concedeAvg: concedePick.value,
    attackSpecific: attackPick.specific,
    concedeSpecific: concedePick.specific,
  };
}

export function readShots(homeMatches: CornerMatch[], awayMatches: CornerMatch[]): ShotRead {
  const home = shotSide(homeMatches);
  const away = shotSide(awayMatches);
  const homeRole = shotRole(home, away, "home");
  const awayRole = shotRole(away, home, "away");
  return {
    enough: home.sample >= 4 && away.sample >= 4,
    expectedHome: homeRole.expected,
    expectedAway: awayRole.expected,
    expectedTotal: homeRole.expected + awayRole.expected,
    home,
    away,
    homeRole,
    awayRole,
  };
}

export type ShotGame = {
  matchId: string;
  date: string;
  opponent: string;
  shots: number;
  onTarget: number;
  minutes: number;
};

export type ShotPlayer = {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  role: string;
  games: ShotGame[];
  average: number;
  median: number;
  onTargetAvg: number;
};

export type ShotBoard = {
  home: TeamPick;
  away: TeamPick;
  players: ShotPlayer[];
};

export function rankShotPlayers(players: ShotPlayer[]) {
  return [...players].sort((a, b) => {
    if (b.games.length !== a.games.length) {
      if (a.games.length === 0) return 1;
      if (b.games.length === 0) return -1;
    }
    return b.average - a.average || b.games.length - a.games.length;
  });
}

export type ResultCall = "home" | "draw" | "away";

export type ResultForm = {
  sample: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  venue: boolean;
  recent: { id: string; date: string; opponent: string; home: boolean; for: number; against: number }[];
};

export type ResultMeeting = {
  id: string;
  date: string;
  score: string;
  outcome: ResultCall;
};

export type ResultRead = {
  enough: boolean;
  homeWin: number;
  draw: number;
  awayWin: number;
  expectedHome: number;
  expectedAway: number;
  home: ResultForm;
  away: ResultForm;
  meetings: ResultMeeting[];
  call: ResultCall;
};

function goalsOf(value: string): number | null {
  const hit = String(value).match(/\d+/);
  return hit ? Number(hit[0]) : null;
}

function foldName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function sameClub(left: string, right: string) {
  const a = foldName(left);
  const b = foldName(right);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  const token = (name: string) => name.split(/\s+/).find((part) => part.length > 3) || name;
  return token(a) === token(b);
}

function formOf(matches: CornerMatch[], venue: "home" | "away"): ResultForm {
  const filtered = matches.filter((match) => (venue === "home" ? match.home : !match.home));
  const source = filtered.length >= VENUE_MIN ? filtered : matches;
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let scored = 0;
  let conceded = 0;
  const recent: ResultForm["recent"] = [];
  for (const match of source) {
    const scoredNow = goalsOf(match.scoreFor);
    const concededNow = goalsOf(match.scoreAgainst);
    if (scoredNow == null || concededNow == null) continue;
    scored += scoredNow;
    conceded += concededNow;
    if (scoredNow > concededNow) wins += 1;
    else if (scoredNow === concededNow) draws += 1;
    else losses += 1;
    if (recent.length < 8) {
      recent.push({
        id: match.eventId,
        date: match.date,
        opponent: match.opponent,
        home: match.home,
        for: scoredNow,
        against: concededNow,
      });
    }
  }
  const sample = wins + draws + losses;
  return {
    sample,
    wins,
    draws,
    losses,
    goalsFor: sample ? scored / sample : 0,
    goalsAgainst: sample ? conceded / sample : 0,
    venue: filtered.length >= VENUE_MIN,
    recent,
  };
}

function scoreChances(homeGoals: number, awayGoals: number) {
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  for (let home = 0; home <= 7; home += 1) {
    for (let away = 0; away <= 7; away += 1) {
      const weight = poisson(home, homeGoals) * poisson(away, awayGoals);
      if (home > away) homeWin += weight;
      else if (home === away) draw += weight;
      else awayWin += weight;
    }
  }
  const mass = homeWin + draw + awayWin || 1;
  return { homeWin: homeWin / mass, draw: draw / mass, awayWin: awayWin / mass };
}

function share(part: number, total: number) {
  return total > 0 ? part / total : 0;
}

export function winStreak(matches: CornerMatch[]): number {
  let streak = 0;
  for (const match of matches) {
    const scored = goalsOf(match.scoreFor);
    const conceded = goalsOf(match.scoreAgainst);
    if (scored == null || conceded == null) continue;
    if (scored <= conceded) break;
    streak += 1;
  }
  return streak;
}

export type ScoutPick = {
  id: string;
  kind: "result" | "shots";
  chance: number;
  headline: string;
  detail: string;
  reason: string;
  league: string;
  when: string;
  outside: boolean;
  matchId: string;
  home: TeamPick;
  away: TeamPick;
  player?: string;
  line?: number;
};

export function bestShotLine(shots: number[]): { line: number; chance: number; hits: number; average: number } | null {
  if (shots.length < 4) return null;
  const average = shots.reduce((sum, value) => sum + value, 0) / shots.length;
  for (const line of [5, 4, 3, 2]) {
    const hits = shots.filter((value) => value >= line).length;
    const chance = hits / shots.length;
    if (chance >= 0.62) return { line, chance, hits, average };
  }
  return null;
}

export function resultScoutPick(args: {
  fixtureId: string;
  league: string;
  when: string;
  outside: boolean;
  home: TeamSample;
  away: TeamSample;
  meetings: CardMeeting[];
}): ScoutPick | null {
  const result = readResult(args.home, args.away, args.meetings);
  if (!result.enough || result.call === "draw") return null;
  const side = result.call;
  const chance = side === "home" ? result.homeWin : result.awayWin;
  const team = side === "home" ? args.home : args.away;
  const opponent = side === "home" ? args.away.team : args.home.team;
  const streak = winStreak(team.matches);
  const h2hN = result.meetings.length;
  const h2hFor = result.meetings.filter((meeting) => meeting.outcome === side).length;
  const storyStreak = streak >= 3 && chance >= 0.52;
  const strongStreak = streak >= 4 && chance >= 0.5;
  const storyH2h = h2hN >= 2 && h2hFor * 2 >= h2hN && chance >= 0.55;
  const storyOutside = args.outside && ((streak >= 2 && chance >= 0.58) || chance >= 0.64);
  if (!strongStreak && !storyStreak && !storyH2h && !storyOutside) return null;
  if (chance >= 0.82 && streak < 3 && h2hFor < 2) return null;

  const bits: string[] = [];
  if (streak >= 3 || (args.outside && streak >= 2)) {
    bits.push(`Viene de ganar ${streak} partidos seguidos.`);
  }
  if (h2hN >= 2 && h2hFor * 2 >= h2hN) {
    bits.push(
      h2hFor === h2hN
        ? `Le ganó los últimos ${h2hN} mano a mano a ${opponent.name}.`
        : `En los últimos ${h2hN} mano a mano le ganó ${h2hFor} a ${opponent.name}.`,
    );
  }
  if (bits.length === 0) {
    bits.push(
      args.outside
        ? "La forma reciente lo pone arriba, y el partido no está en la agenda de siempre."
        : "La forma reciente lo pone arriba.",
    );
  }
  return {
    id: `result-${args.fixtureId}-${side}`,
    kind: "result",
    chance,
    headline: `${team.team.name} gana`,
    detail: `${args.home.team.name} vs ${args.away.team.name}`,
    reason: bits.join(" "),
    league: args.league,
    when: args.when,
    outside: args.outside,
    matchId: args.fixtureId,
    home: args.home.team,
    away: args.away.team,
  };
}

export function takeScoutPicks(picks: ScoutPick[], kind: ScoutPick["kind"], limit: number): ScoutPick[] {
  const pool = picks.filter((pick) => pick.kind === kind).sort((a, b) => b.chance - a.chance);
  const top = pool.slice(0, limit);
  let outside = top.filter((pick) => pick.outside).length;
  const merged = [...top];
  if (outside < 2) {
    for (const pick of pool) {
      if (!pick.outside || merged.includes(pick)) continue;
      merged.push(pick);
      outside += 1;
      if (outside >= 2 || merged.length >= limit + 2) break;
    }
  }
  return merged.sort((a, b) => b.chance - a.chance);
}

export function readResult(home: TeamSample, away: TeamSample, meetings: CardMeeting[]): ResultRead {
  const homeForm = formOf(home.matches, "home");
  const awayForm = formOf(away.matches, "away");
  const expectedHome = (homeForm.goalsFor + awayForm.goalsAgainst) / 2;
  const expectedAway = (awayForm.goalsFor + homeForm.goalsAgainst) / 2;
  const fromGoals = scoreChances(expectedHome, expectedAway);

  let homeRate =
    0.5 * (share(homeForm.wins, homeForm.sample) + share(awayForm.losses, awayForm.sample));
  let awayRate =
    0.5 * (share(awayForm.wins, awayForm.sample) + share(homeForm.losses, homeForm.sample));
  let drawRate =
    0.5 * (share(homeForm.draws, homeForm.sample) + share(awayForm.draws, awayForm.sample));
  const formMass = homeRate + awayRate + drawRate || 1;
  homeRate /= formMass;
  awayRate /= formMass;
  drawRate /= formMass;

  const played: ResultMeeting[] = [];
  let h2hHome = 0;
  let h2hDraw = 0;
  let h2hAway = 0;
  for (const meeting of meetings) {
    const parts = meeting.score.split(/\s*[-–]\s*/);
    if (parts.length < 2) continue;
    const left = goalsOf(parts[0]);
    const right = goalsOf(parts[1]);
    if (left == null || right == null) continue;
    const todayHomeWasHome = sameClub(meeting.home, home.team.name);
    const todayHomeWasAway = sameClub(meeting.away, home.team.name);
    if (!todayHomeWasHome && !todayHomeWasAway) continue;
    const homeGoals = todayHomeWasHome ? left : right;
    const awayGoals = todayHomeWasHome ? right : left;
    const outcome: ResultCall = homeGoals > awayGoals ? "home" : homeGoals < awayGoals ? "away" : "draw";
    if (outcome === "home") h2hHome += 1;
    else if (outcome === "draw") h2hDraw += 1;
    else h2hAway += 1;
    played.push({
      id: meeting.id,
      date: meeting.date,
      score: `${homeGoals}–${awayGoals}`,
      outcome,
    });
  }

  const h2h = h2hHome + h2hDraw + h2hAway;
  const goalWeight = h2h >= 2 ? 0.4 : h2h === 1 ? 0.45 : 0.55;
  const formWeight = h2h >= 2 ? 0.3 : h2h === 1 ? 0.35 : 0.45;
  const h2hWeight = h2h >= 2 ? 0.3 : h2h === 1 ? 0.2 : 0;
  let homeWin = goalWeight * fromGoals.homeWin + formWeight * homeRate + (h2h ? h2hWeight * (h2hHome / h2h) : 0);
  let draw = goalWeight * fromGoals.draw + formWeight * drawRate + (h2h ? h2hWeight * (h2hDraw / h2h) : 0);
  let awayWin = goalWeight * fromGoals.awayWin + formWeight * awayRate + (h2h ? h2hWeight * (h2hAway / h2h) : 0);
  const mass = homeWin + draw + awayWin || 1;
  homeWin /= mass;
  draw /= mass;
  awayWin /= mass;
  const call: ResultCall =
    homeWin >= draw && homeWin >= awayWin ? "home" : awayWin > homeWin && awayWin >= draw ? "away" : "draw";

  return {
    enough: homeForm.sample >= 4 && awayForm.sample >= 4,
    homeWin,
    draw,
    awayWin,
    expectedHome,
    expectedAway,
    home: homeForm,
    away: awayForm,
    meetings: played,
    call,
  };
}

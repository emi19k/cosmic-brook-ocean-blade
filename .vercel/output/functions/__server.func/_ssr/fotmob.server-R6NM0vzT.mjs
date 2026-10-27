import { n as rankShotPlayers, o as summarizeTeam } from "./model-DVfYXpyL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fotmob.server-R6NM0vzT.js
var API = "https://www.fotmob.com/api/data";
var ART = "America/Argentina/Buenos_Aires";
var SAMPLE_TARGET = 10;
var SAMPLE_LOOKBACK = 12;
var cache = /* @__PURE__ */ new Map();
async function getJson(url, ttlMs) {
	const hit = cache.get(url);
	if (hit && hit.exp > Date.now()) return hit.data;
	try {
		const response = await fetch(url, {
			headers: {
				accept: "application/json",
				"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
				referer: "https://www.fotmob.com/"
			},
			signal: AbortSignal.timeout(12e3)
		});
		if (!response.ok) return null;
		const data = await response.json();
		cache.set(url, {
			exp: Date.now() + ttlMs,
			data
		});
		return data;
	} catch {
		return null;
	}
}
async function mapPool(items, limit, fn) {
	const out = new Array(items.length);
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
function fold(value) {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function artParts(date) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: ART,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).formatToParts(date);
	const pick = (type) => Number(parts.find((part) => part.type === type)?.value);
	return {
		year: pick("year"),
		month: pick("month"),
		day: pick("day")
	};
}
function artMidnight(offsetDays) {
	const today = artParts(/* @__PURE__ */ new Date());
	return Date.UTC(today.year, today.month - 1, today.day + offsetDays, 3, 0, 0);
}
function ymdFromOffset(offsetDays) {
	const parts = artParts(new Date(artMidnight(offsetDays)));
	return `${parts.year}${String(parts.month).padStart(2, "0")}${String(parts.day).padStart(2, "0")}`;
}
function abbreviate(name) {
	const clean = name.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, "").trim();
	const bits = clean.split(/\s+/).filter((part) => part.length > 2);
	if (bits.length >= 2) return (bits[0][0] + bits[1][0]).toUpperCase();
	return clean.slice(0, 3).toUpperCase();
}
function asNumber(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
	return null;
}
var MAIN_LEAGUES = /* @__PURE__ */ new Set([
	112,
	9305,
	45,
	13
]);
function teamRank(name, leagueId, leagueName, query) {
	const folded = fold(name);
	const words = folded.split(/[^a-z0-9]+/).filter(Boolean);
	let score = 10;
	if (folded === query) score = 100;
	else if (words[0] === query) score = 80;
	else if (words.includes(query)) score = 70;
	else if (folded.includes(query)) score = 40;
	score -= Math.max(0, folded.length - query.length) * .35;
	if (MAIN_LEAGUES.has(leagueId) || /liga profesional|copa argentina|libertadores|sudamericana/i.test(leagueName)) score += 24;
	if (leagueId === 112) score += 8;
	if (!/\bu-?\d{2}\b/.test(query) && /\bu-?\d{2}\b|\bii\b|\breserves\b|\byouth\b/.test(folded)) score -= 50;
	return score;
}
async function searchFotmobTeams(query) {
	const data = await getJson(`${API}/search/suggest?term=${encodeURIComponent(query)}`, 6e5);
	const folded = fold(query);
	const ranked = [...(data ?? []).flatMap((group) => group.suggestions ?? []).filter((hit) => hit.type === "team" && hit.id && hit.name && /^\d+$/.test(hit.id))].sort((a, b) => teamRank(b.name || "", b.leagueId || 0, b.leagueName || "", folded) - teamRank(a.name || "", a.leagueId || 0, a.leagueName || "", folded));
	const seen = /* @__PURE__ */ new Set();
	const teams = [];
	for (const hit of ranked) {
		const id = hit.id;
		if (seen.has(id)) continue;
		seen.add(id);
		const league = String(hit.leagueId || "football");
		teams.push({
			id,
			name: hit.name,
			league,
			leagueName: hit.leagueName || "Fútbol",
			abbreviation: abbreviate(hit.name)
		});
		if (teams.length >= 8) break;
	}
	return teams;
}
function scoreText(side, scoreStr, index) {
	if (typeof side?.score === "number") return String(side.score);
	return (scoreStr || "").split(/\s+-\s+/)[index] || "–";
}
function readPair(detail, key) {
	const groups = detail?.content?.stats?.Periods?.All?.stats ?? [];
	for (const group of groups) for (const item of group.stats ?? []) {
		if ((item.key || "").toLowerCase() !== key) continue;
		const home = asNumber(item.stats?.[0]);
		const away = asNumber(item.stats?.[1]);
		if (home === null || away === null) return null;
		return {
			home,
			away
		};
	}
	return null;
}
function readCorners(detail) {
	return readPair(detail, "corners");
}
function countSide(events, homeSide) {
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
	return {
		yellow,
		red
	};
}
function readTeamCards(detail, teamIsHome) {
	const events = detail?.content?.matchFacts?.events?.events;
	if (Array.isArray(events)) {
		const mine = countSide(events, teamIsHome);
		const theirs = countSide(events, !teamIsHome);
		return {
			yellowFor: mine.yellow,
			yellowAgainst: theirs.yellow,
			redFor: mine.red,
			redAgainst: theirs.red
		};
	}
	const yellow = readPair(detail, "yellow_cards");
	const red = readPair(detail, "red_cards");
	if (!yellow && !red) return null;
	const yHome = yellow?.home ?? 0;
	const yAway = yellow?.away ?? 0;
	const rHome = red?.home ?? 0;
	const rAway = red?.away ?? 0;
	return teamIsHome ? {
		yellowFor: yHome,
		yellowAgainst: yAway,
		redFor: rHome,
		redAgainst: rAway
	} : {
		yellowFor: yAway,
		yellowAgainst: yHome,
		redFor: rAway,
		redAgainst: rHome
	};
}
async function loadTeamSample(team) {
	const recent = ((await getJson(`${API}/teams?id=${team.id}`, 9e5))?.fixtures?.allFixtures?.fixtures ?? []).filter((fixture) => fixture.id && fixture.status?.finished && !fixture.status.cancelled && fixture.status.utcTime).sort((a, b) => String(b.status?.utcTime).localeCompare(String(a.status?.utcTime))).slice(0, SAMPLE_LOOKBACK);
	if (recent.length === 0) throw new Error(`No encontré partidos recientes de ${team.name}.`);
	const matches = (await mapPool(recent, 5, async (fixture) => {
		const detail = await getJson(`${API}/matchDetails?matchId=${fixture.id}`, 432e5);
		const corners = readCorners(detail);
		const homeId = String(fixture.home?.id ?? "");
		const awayId = String(fixture.away?.id ?? "");
		if (!corners || homeId !== team.id && awayId !== team.id) return null;
		const home = homeId === team.id;
		const rival = home ? fixture.away : fixture.home;
		const cards = readTeamCards(detail, home);
		const shots = readPair(detail, "total_shots");
		return {
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
			shotsFor: shots ? home ? shots.home : shots.away : -1,
			shotsAgainst: shots ? home ? shots.away : shots.home : -1,
			competition: fixture.tournament?.name || team.leagueName
		};
	})).filter((match) => match !== null).slice(0, SAMPLE_TARGET);
	if (matches.length < 4) throw new Error(`${team.name} no tiene córners publicados en los últimos partidos.`);
	return summarizeTeam(team, matches);
}
function eventIdFromUrl(url) {
	return url?.match(/#(\d+)/)?.[1] || "";
}
function readReferee(detail) {
	const referee = detail?.content?.matchFacts?.infoBox?.Referee;
	if (!referee?.text) return null;
	const stats = referee.stats ?? [];
	const pick = (type) => stats.find((item) => item.type === type)?.value;
	const yellow = pick("yellowCards");
	return {
		name: referee.text,
		yellowPerMatch: typeof yellow === "number" ? yellow : 0,
		reds: pick("redCards") ?? 0,
		matches: pick("matches") ?? 0
	};
}
async function loadCardContext(home, away, matchId) {
	let id = matchId && /^\d+$/.test(matchId) ? matchId : "";
	if (!id) {
		const hit = ((await getJson(`${API}/teams?id=${home.id}`, 9e5))?.fixtures?.allFixtures?.fixtures ?? []).find((fixture) => String(fixture.home?.id || "") === away.id || String(fixture.away?.id || "") === away.id);
		if (hit?.id) id = String(hit.id);
	}
	if (!id) return {
		meetings: [],
		referee: null
	};
	const detail = await getJson(`${API}/matchDetails?matchId=${id}`, 18e5);
	return {
		meetings: (await mapPool((detail?.content?.h2h?.matches ?? []).filter((meeting) => meeting.status?.finished && meeting.status.utcTime).sort((a, b) => String(b.status?.utcTime).localeCompare(String(a.status?.utcTime))).slice(0, 3), 3, async (meeting) => {
			const eventId = eventIdFromUrl(meeting.matchUrl);
			if (!eventId) return null;
			const played = await getJson(`${API}/matchDetails?matchId=${eventId}`, 432e5);
			const events = played?.content?.matchFacts?.events?.events;
			if (!Array.isArray(events)) return null;
			const homeCards = countSide(events, true);
			const awayCards = countSide(events, false);
			const corners = readCorners(played);
			const shots = readPair(played, "total_shots");
			return {
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
				awayShots: shots?.away ?? -1
			};
		})).filter((meeting) => meeting !== null),
		referee: readReferee(detail)
	};
}
function wantedLeague(name) {
	const folded = fold(name);
	return folded.startsWith("liga profesional") || folded.startsWith("copa argentina") || folded.includes("libertadores") || folded.includes("sudamericana");
}
function leagueTitle(name) {
	if (fold(name).startsWith("copa argentina")) return "Copa Argentina";
	if (fold(name).startsWith("liga profesional")) return "Liga Profesional";
	return name.split(" - ")[0];
}
function pick(side, leagueId, leagueName) {
	if (!side?.id || !side.name) return null;
	const name = side.name;
	return {
		id: String(side.id),
		name,
		league: leagueId,
		leagueName,
		abbreviation: abbreviate(name)
	};
}
var agendaCache = null;
async function loadFixtures() {
	if (agendaCache && agendaCache.exp > Date.now()) return agendaCache.cards;
	const start = artMidnight(0);
	const end = artMidnight(5);
	const dates = [
		0,
		1,
		2,
		3,
		4,
		5
	].map(ymdFromOffset);
	const days = await Promise.all(dates.map((ymd) => getJson(`${API}/matches?date=${ymd}`, 6e5)));
	if (days.every((day) => !day)) throw new Error("No pude leer la agenda. Tocá para reintentar.");
	const cards = /* @__PURE__ */ new Map();
	for (const day of days) for (const league of day?.leagues ?? []) {
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
				away
			});
		}
	}
	const agenda = [...cards.values()].sort((a, b) => a.date.localeCompare(b.date));
	agendaCache = {
		exp: Date.now() + 6e5,
		cards: agenda
	};
	return agenda;
}
function competitionTitle(name) {
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
function groupLabel(name, title) {
	const group = name.match(/\b([A-D])\s+Grp\.?\s*(\d+)/i);
	if (group) return `Grupo ${group[1]}`;
	if (/qualification/i.test(name)) return "Clasificación";
	if (/quarter/i.test(name)) return "Cuartos de final";
	if (/semi/i.test(name)) return "Semifinal";
	if (/round of 16|octavos/i.test(name)) return "Octavos";
	return title;
}
var boardsCache = null;
async function loadCompetitions() {
	if (boardsCache && boardsCache.exp > Date.now()) return boardsCache.boards;
	const start = artMidnight(0);
	const end = artMidnight(5);
	const dates = [
		0,
		1,
		2,
		3,
		4,
		5
	].map(ymdFromOffset);
	const days = await Promise.all(dates.map((ymd) => getJson(`${API}/matches?date=${ymd}`, 6e5)));
	if (days.every((day) => !day)) throw new Error("No pude leer las otras competiciones.");
	const groups = /* @__PURE__ */ new Map();
	for (const day of days) for (const league of day?.leagues ?? []) {
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
			const bucket = groups.get(title) ?? /* @__PURE__ */ new Map();
			bucket.set(String(match.id), {
				id: String(match.id),
				date: match.status.utcTime,
				league: leagueId,
				leagueName: label,
				home,
				away
			});
			groups.set(title, bucket);
		}
	}
	const boards = [...groups.entries()].map(([title, cards]) => ({
		title,
		fixtures: [...cards.values()].sort((a, b) => a.date.localeCompare(b.date))
	})).filter((board) => board.fixtures.length > 0).sort((a, b) => a.fixtures[0].date.localeCompare(b.fixtures[0].date));
	boardsCache = {
		exp: Date.now() + 6e5,
		boards
	};
	return boards;
}
function roleLabel(title) {
	const folded = fold(title);
	if (folded.includes("keep")) return "Arquero";
	if (folded.includes("defend")) return "Defensor";
	if (folded.includes("mid")) return "Volante";
	if (folded.includes("attack") || folded.includes("forward")) return "Delantero";
	return "Jugador";
}
function readPlayerStat(block, labels, key) {
	for (const group of block.stats ?? []) {
		const stats = group.stats ?? {};
		for (const [name, item] of Object.entries(stats)) if (labels.includes(name) || key && item.key === key) {
			const value = item.stat?.value;
			if (typeof value === "number" && Number.isFinite(value)) return value;
		}
	}
	return null;
}
function median(values) {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function summarizeShotPlayer(player) {
	const shots = player.games.map((game) => game.shots);
	const onTarget = player.games.map((game) => game.onTarget);
	const average = shots.length ? shots.reduce((sum, value) => sum + value, 0) / shots.length : 0;
	const onTargetAvg = onTarget.length ? onTarget.reduce((sum, value) => sum + value, 0) / onTarget.length : 0;
	return {
		...player,
		games: [...player.games].sort((a, b) => a.date.localeCompare(b.date)).slice(-10),
		average,
		median: median(shots),
		onTargetAvg
	};
}
async function loadShotPicks(home, away) {
	const [homeTeam, awayTeam] = await Promise.all([getJson(`${API}/teams?id=${home.id}`, 9e5), getJson(`${API}/teams?id=${away.id}`, 9e5)]);
	if (!homeTeam || !awayTeam) throw new Error("No pude leer las plantillas.");
	const players = /* @__PURE__ */ new Map();
	const seed = (payload, team) => {
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
					onTargetAvg: 0
				});
			}
		}
	};
	seed(homeTeam, home);
	seed(awayTeam, away);
	if (players.size === 0) throw new Error("No encontré jugadores de estos equipos.");
	const recentOf = (payload, team) => (payload?.fixtures?.allFixtures?.fixtures ?? []).filter((fixture) => fixture.id && fixture.status?.finished && !fixture.status.cancelled && fixture.status.utcTime).sort((a, b) => String(b.status?.utcTime).localeCompare(String(a.status?.utcTime))).slice(0, SAMPLE_LOOKBACK).map((fixture) => ({
		team,
		fixture
	}));
	const seen = /* @__PURE__ */ new Set();
	const queue = [...recentOf(homeTeam, home), ...recentOf(awayTeam, away)].filter((row) => {
		const id = row.fixture.id;
		if (seen.has(id)) return false;
		seen.add(id);
		return true;
	});
	if (queue.length === 0) throw new Error("No hay partidos recientes para leer remates.");
	await mapPool(queue, 4, async ({ fixture }) => {
		const stats = (await getJson(`${API}/matchDetails?matchId=${fixture.id}`, 432e5))?.content?.playerStats;
		if (!stats) return null;
		const homeId = String(fixture.home?.id ?? "");
		String(fixture.away?.id ?? "");
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
			const game = {
				matchId: String(fixture.id),
				date: fixture.status?.utcTime || "",
				opponent: opponent?.name || "Rival",
				shots,
				onTarget,
				minutes
			};
			if (current) current.games.push(game);
			else players.set(id, {
				id,
				name: block.name || "Jugador",
				teamId,
				teamName,
				role: block.isGoalkeeper ? "Arquero" : "Jugador",
				games: [game],
				average: 0,
				median: 0,
				onTargetAvg: 0
			});
		}
		return null;
	});
	const ranked = rankShotPlayers([...players.values()].map(summarizeShotPlayer));
	if (ranked.every((player) => player.games.length === 0)) throw new Error("Estos equipos no tienen remates de jugadores publicados.");
	return {
		home,
		away,
		players: ranked
	};
}
//#endregion
export { loadCardContext, loadCompetitions, loadFixtures, loadShotPicks, loadTeamSample, searchFotmobTeams };

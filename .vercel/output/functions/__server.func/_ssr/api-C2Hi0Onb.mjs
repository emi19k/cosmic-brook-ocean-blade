import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { r as readCards, t as projectMatch } from "./model-DVfYXpyL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-C2Hi0Onb.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function readTeam(value, label) {
	if (!value || typeof value !== "object") throw new Error(`Elegí el equipo ${label}.`);
	const team = value;
	if (!team.id || !team.name || !team.league) throw new Error(`Elegí el equipo ${label}.`);
	if (!/^[a-z0-9._-]+$/i.test(team.league) || !/^\d+$/.test(team.id)) throw new Error("Equipo inválido.");
	return {
		id: team.id,
		name: String(team.name).slice(0, 80),
		league: team.league,
		leagueName: String(team.leagueName || team.league).slice(0, 80),
		abbreviation: String(team.abbreviation || team.name.slice(0, 3)).slice(0, 8)
	};
}
var searchTeams_createServerFn_handler = createServerRpc({
	id: "d3796fdfdf6f38647b72c95ad34a5663b35a42ee8f7dca1fececb35cba1ef28f",
	name: "searchTeams",
	filename: "src/lib/corners/api.ts"
}, (opts) => searchTeams.__executeServer(opts));
var searchTeams = createServerFn({ method: "POST" }).validator((data) => {
	const q = (typeof data === "object" && data && "q" in data ? String(data.q) : "").trim().slice(0, 60);
	if (q.length < 2) return { q: "" };
	return { q };
}).handler(searchTeams_createServerFn_handler, async ({ data }) => {
	if (!data.q) return [];
	const { searchFotmobTeams } = await import("./fotmob.server-R6NM0vzT.mjs");
	return searchFotmobTeams(data.q);
});
var analyzeMatch_createServerFn_handler = createServerRpc({
	id: "f412762f6c7add807024ecd702969422b80dd0e681531a74a484518c94516a85",
	name: "analyzeMatch",
	filename: "src/lib/corners/api.ts"
}, (opts) => analyzeMatch.__executeServer(opts));
var analyzeMatch = createServerFn({ method: "POST" }).validator((data) => {
	if (!data || typeof data !== "object") throw new Error("Falta el partido.");
	const body = data;
	const home = readTeam(body.home, "local");
	const away = readTeam(body.away, "visitante");
	if (home.id === away.id) throw new Error("Elegí dos equipos distintos.");
	return {
		home,
		away,
		matchId: typeof body.matchId === "string" && /^\d+$/.test(body.matchId) ? body.matchId : ""
	};
}).handler(analyzeMatch_createServerFn_handler, async ({ data }) => {
	const { loadCardContext, loadTeamSample } = await import("./fotmob.server-R6NM0vzT.mjs");
	const [home, away, context] = await Promise.all([
		loadTeamSample(data.home),
		loadTeamSample(data.away),
		loadCardContext(data.home, data.away, data.matchId)
	]);
	return {
		home,
		away,
		projection: projectMatch(home, away),
		cards: readCards(home.matches, away.matches, context.meetings, context.referee)
	};
});
var listFixtures_createServerFn_handler = createServerRpc({
	id: "ed726d8124ab8143d0c953254586b743933259b6b429871ccf2457f83454c5d1",
	name: "listFixtures",
	filename: "src/lib/corners/api.ts"
}, (opts) => listFixtures.__executeServer(opts));
var listFixtures = createServerFn({ method: "POST" }).validator(() => ({})).handler(listFixtures_createServerFn_handler, async () => {
	const { loadFixtures } = await import("./fotmob.server-R6NM0vzT.mjs");
	return loadFixtures();
});
var listCompetitions_createServerFn_handler = createServerRpc({
	id: "45aac49c198bc294dd34ecfd5aef9f32226ed5f87c0da763933aa90049c26ab3",
	name: "listCompetitions",
	filename: "src/lib/corners/api.ts"
}, (opts) => listCompetitions.__executeServer(opts));
var listCompetitions = createServerFn({ method: "POST" }).validator(() => ({})).handler(listCompetitions_createServerFn_handler, async () => {
	const { loadCompetitions } = await import("./fotmob.server-R6NM0vzT.mjs");
	return loadCompetitions();
});
var loadShotPicks_createServerFn_handler = createServerRpc({
	id: "013a902e69b739748818c1655ab50ae274593bd2108003545d10a84a35f760bb",
	name: "loadShotPicks",
	filename: "src/lib/corners/api.ts"
}, (opts) => loadShotPicks.__executeServer(opts));
var loadShotPicks = createServerFn({ method: "POST" }).validator((data) => {
	if (!data || typeof data !== "object") throw new Error("Falta el partido.");
	const body = data;
	const home = readTeam(body.home, "local");
	const away = readTeam(body.away, "visitante");
	if (home.id === away.id) throw new Error("Elegí dos equipos distintos.");
	return {
		home,
		away
	};
}).handler(loadShotPicks_createServerFn_handler, async ({ data }) => {
	const { loadShotPicks: readPicks } = await import("./fotmob.server-R6NM0vzT.mjs");
	return readPicks(data.home, data.away);
});
//#endregion
export { analyzeMatch_createServerFn_handler, listCompetitions_createServerFn_handler, listFixtures_createServerFn_handler, loadShotPicks_createServerFn_handler, searchTeams_createServerFn_handler };

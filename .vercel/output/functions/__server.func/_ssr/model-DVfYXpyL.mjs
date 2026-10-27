//#region node_modules/.nitro/vite/services/ssr/assets/model-DVfYXpyL.js
var VENUE_MIN = 3;
function mean(values) {
	if (values.length === 0) return 0;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function poisson(k, lambda) {
	if (k < 0) return 0;
	if (lambda <= 0) return k === 0 ? 1 : 0;
	let log = -lambda;
	for (let i = 1; i <= k; i++) log += Math.log(lambda) - Math.log(i);
	return Math.exp(log);
}
function pickAvg(specific, n, overall) {
	if (n >= VENUE_MIN) return {
		value: specific,
		specific: true
	};
	return {
		value: overall,
		specific: false
	};
}
function summarizeTeam(team, matches) {
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
		awayAgainstN: away.length
	};
}
function expectSide(attack, defense, venue) {
	const attackPick = venue === "home" ? pickAvg(attack.homeForAvg, attack.homeForN, attack.forAvg) : pickAvg(attack.awayForAvg, attack.awayForN, attack.forAvg);
	const concedePick = venue === "home" ? pickAvg(defense.homeAgainstAvg, defense.homeAgainstN, defense.againstAvg) : pickAvg(defense.awayAgainstAvg, defense.awayAgainstN, defense.againstAvg);
	return {
		expected: (attackPick.value + concedePick.value) / 2,
		attackAvg: attackPick.value,
		concedeAvg: concedePick.value,
		attackSpecific: attackPick.specific,
		concedeSpecific: concedePick.specific
	};
}
function centralBand(distribution) {
	const mode = distribution.reduce((best, row) => row.probability > best.probability ? row : best);
	let from = mode.total;
	let to = mode.total;
	let probability = mode.probability;
	while (to - from < 4 && probability < .5) {
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
	return {
		from,
		to,
		probability
	};
}
function projectMatch(home, away) {
	const homeSide = expectSide(home, away, "home");
	const awaySide = expectSide(away, home, "away");
	const expectedHome = homeSide.expected;
	const expectedAway = awaySide.expected;
	const expectedTotal = expectedHome + expectedAway;
	const raw = Array.from({ length: 23 }, (_, total) => ({
		total,
		probability: poisson(total, expectedTotal)
	}));
	const mass = raw.reduce((sum, row) => sum + row.probability, 0) || 1;
	const distribution = raw.map((row) => ({
		total: row.total,
		probability: row.probability / mass
	}));
	const atLeast = [
		6,
		7,
		8,
		9,
		10,
		11,
		12,
		13
	].map((goals) => ({
		atLeast: goals,
		probability: distribution.filter((row) => row.total >= goals).reduce((sum, row) => sum + row.probability, 0)
	}));
	const lines = [
		6.5,
		7.5,
		8.5,
		9.5,
		10.5,
		11.5,
		12.5
	].map((line) => {
		const over = distribution.filter((row) => row.total > line).reduce((sum, row) => sum + row.probability, 0);
		return {
			line,
			over,
			under: 1 - over
		};
	});
	const headlineAtLeast = Math.max(1, Math.round(expectedTotal));
	const headlineProbability = distribution.filter((row) => row.total >= headlineAtLeast).reduce((sum, row) => sum + row.probability, 0);
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
		headlineProbability
	};
}
function venueRows(matches, venue) {
	const rows = matches.filter((match) => venue === "home" ? match.home : !match.home);
	return rows.length >= VENUE_MIN ? rows : matches;
}
function cardSide(matches) {
	const usable = matches.filter((match) => match.cardsFor >= 0);
	return {
		sample: usable.length,
		commitAvg: mean(usable.map((match) => match.cardsFor)),
		concedeAvg: mean(usable.map((match) => match.cardsAgainst)),
		yellowAvg: mean(usable.map((match) => match.yellowFor)),
		redAvg: mean(usable.map((match) => match.redFor)),
		recent: usable.slice(0, 10)
	};
}
function readCards(homeMatches, awayMatches, meetings, referee) {
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
		referee
	};
}
function shotSide(matches) {
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
		awayAgainstN: away.length
	};
}
function shotRole(attack, defense, venue) {
	const attackPick = venue === "home" ? pickAvg(attack.homeForAvg, attack.homeForN, attack.forAvg) : pickAvg(attack.awayForAvg, attack.awayForN, attack.forAvg);
	const concedePick = venue === "home" ? pickAvg(defense.awayAgainstAvg, defense.awayAgainstN, defense.againstAvg) : pickAvg(defense.homeAgainstAvg, defense.homeAgainstN, defense.againstAvg);
	return {
		expected: attack.sample && defense.sample ? (attackPick.value + concedePick.value) / 2 : 0,
		attackAvg: attackPick.value,
		concedeAvg: concedePick.value,
		attackSpecific: attackPick.specific,
		concedeSpecific: concedePick.specific
	};
}
function readShots(homeMatches, awayMatches) {
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
		awayRole
	};
}
function rankShotPlayers(players) {
	return [...players].sort((a, b) => {
		if (b.games.length !== a.games.length) {
			if (a.games.length === 0) return 1;
			if (b.games.length === 0) return -1;
		}
		return b.average - a.average || b.games.length - a.games.length;
	});
}
function goalsOf(value) {
	const hit = String(value).match(/\d+/);
	return hit ? Number(hit[0]) : null;
}
function foldName(value) {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function sameClub(left, right) {
	const a = foldName(left);
	const b = foldName(right);
	if (!a || !b) return false;
	if (a === b || a.includes(b) || b.includes(a)) return true;
	const token = (name) => name.split(/\s+/).find((part) => part.length > 3) || name;
	return token(a) === token(b);
}
function formOf(matches, venue) {
	const filtered = matches.filter((match) => venue === "home" ? match.home : !match.home);
	const source = filtered.length >= VENUE_MIN ? filtered : matches;
	let wins = 0;
	let draws = 0;
	let losses = 0;
	let scored = 0;
	let conceded = 0;
	const recent = [];
	for (const match of source) {
		const scoredNow = goalsOf(match.scoreFor);
		const concededNow = goalsOf(match.scoreAgainst);
		if (scoredNow == null || concededNow == null) continue;
		scored += scoredNow;
		conceded += concededNow;
		if (scoredNow > concededNow) wins += 1;
		else if (scoredNow === concededNow) draws += 1;
		else losses += 1;
		if (recent.length < 8) recent.push({
			id: match.eventId,
			date: match.date,
			opponent: match.opponent,
			home: match.home,
			for: scoredNow,
			against: concededNow
		});
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
		recent
	};
}
function scoreChances(homeGoals, awayGoals) {
	let homeWin = 0;
	let draw = 0;
	let awayWin = 0;
	for (let home = 0; home <= 7; home += 1) for (let away = 0; away <= 7; away += 1) {
		const weight = poisson(home, homeGoals) * poisson(away, awayGoals);
		if (home > away) homeWin += weight;
		else if (home === away) draw += weight;
		else awayWin += weight;
	}
	const mass = homeWin + draw + awayWin || 1;
	return {
		homeWin: homeWin / mass,
		draw: draw / mass,
		awayWin: awayWin / mass
	};
}
function share(part, total) {
	return total > 0 ? part / total : 0;
}
function readResult(home, away, meetings) {
	const homeForm = formOf(home.matches, "home");
	const awayForm = formOf(away.matches, "away");
	const expectedHome = (homeForm.goalsFor + awayForm.goalsAgainst) / 2;
	const expectedAway = (awayForm.goalsFor + homeForm.goalsAgainst) / 2;
	const fromGoals = scoreChances(expectedHome, expectedAway);
	let homeRate = .5 * (share(homeForm.wins, homeForm.sample) + share(awayForm.losses, awayForm.sample));
	let awayRate = .5 * (share(awayForm.wins, awayForm.sample) + share(homeForm.losses, homeForm.sample));
	let drawRate = .5 * (share(homeForm.draws, homeForm.sample) + share(awayForm.draws, awayForm.sample));
	const formMass = homeRate + awayRate + drawRate || 1;
	homeRate /= formMass;
	awayRate /= formMass;
	drawRate /= formMass;
	const played = [];
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
		const outcome = homeGoals > awayGoals ? "home" : homeGoals < awayGoals ? "away" : "draw";
		if (outcome === "home") h2hHome += 1;
		else if (outcome === "draw") h2hDraw += 1;
		else h2hAway += 1;
		played.push({
			id: meeting.id,
			date: meeting.date,
			score: `${homeGoals}–${awayGoals}`,
			outcome
		});
	}
	const h2h = h2hHome + h2hDraw + h2hAway;
	const goalWeight = h2h >= 2 ? .4 : h2h === 1 ? .45 : .55;
	const formWeight = h2h >= 2 ? .3 : h2h === 1 ? .35 : .45;
	const h2hWeight = h2h >= 2 ? .3 : h2h === 1 ? .2 : 0;
	let homeWin = goalWeight * fromGoals.homeWin + formWeight * homeRate + (h2h ? h2hWeight * (h2hHome / h2h) : 0);
	let draw = goalWeight * fromGoals.draw + formWeight * drawRate + (h2h ? h2hWeight * (h2hDraw / h2h) : 0);
	let awayWin = goalWeight * fromGoals.awayWin + formWeight * awayRate + (h2h ? h2hWeight * (h2hAway / h2h) : 0);
	const mass = homeWin + draw + awayWin || 1;
	homeWin /= mass;
	draw /= mass;
	awayWin /= mass;
	const call = homeWin >= draw && homeWin >= awayWin ? "home" : awayWin > homeWin && awayWin >= draw ? "away" : "draw";
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
		call
	};
}
//#endregion
export { readShots as a, readResult as i, rankShotPlayers as n, summarizeTeam as o, readCards as r, projectMatch as t };

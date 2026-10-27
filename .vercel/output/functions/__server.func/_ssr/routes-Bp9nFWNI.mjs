import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as readShots, i as readResult } from "./model-DVfYXpyL.mjs";
import { a as ChevronDown, i as Flag, o as ArrowLeftRight, r as Search, t as X } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Bp9nFWNI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
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
var searchTeams = createServerFn({ method: "POST" }).validator((data) => {
	const q = (typeof data === "object" && data && "q" in data ? String(data.q) : "").trim().slice(0, 60);
	if (q.length < 2) return { q: "" };
	return { q };
}).handler(createSsrRpc("d3796fdfdf6f38647b72c95ad34a5663b35a42ee8f7dca1fececb35cba1ef28f"));
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
}).handler(createSsrRpc("f412762f6c7add807024ecd702969422b80dd0e681531a74a484518c94516a85"));
var listFixtures = createServerFn({ method: "POST" }).validator(() => ({})).handler(createSsrRpc("ed726d8124ab8143d0c953254586b743933259b6b429871ccf2457f83454c5d1"));
var listCompetitions = createServerFn({ method: "POST" }).validator(() => ({})).handler(createSsrRpc("45aac49c198bc294dd34ecfd5aef9f32226ed5f87c0da763933aa90049c26ab3"));
createServerFn({ method: "POST" }).validator((data) => {
	if (!data || typeof data !== "object") throw new Error("Falta el partido.");
	const body = data;
	const home = readTeam(body.home, "local");
	const away = readTeam(body.away, "visitante");
	if (home.id === away.id) throw new Error("Elegí dos equipos distintos.");
	return {
		home,
		away
	};
}).handler(createSsrRpc("013a902e69b739748818c1655ab50ae274593bd2108003545d10a84a35f760bb"));
function crest(id) {
	return `https://images.fotmob.com/image_resources/logo/teamlogo/${id}_xsmall.png`;
}
function TeamCrest({ id }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: crest(id),
		alt: "",
		width: 40,
		height: 40,
		className: "size-10 rounded-full bg-panel-2 object-contain p-1"
	});
}
function TeamField({ label, hint, value, ready = true, glass = false, onChange }) {
	const listId = (0, import_react.useId)();
	const [query, setQuery] = (0, import_react.useState)("");
	const [open, setOpen] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [results, setResults] = (0, import_react.useState)([]);
	const box = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		function onDoc(event) {
			if (!box.current?.contains(event.target)) setOpen(false);
		}
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, []);
	(0, import_react.useEffect)(() => {
		const q = query.trim();
		if (q.length < 2) {
			setResults([]);
			setLoading(false);
			return;
		}
		const handle = window.setTimeout(() => {
			setLoading(true);
			searchTeams({ data: { q } }).then((teams) => {
				setResults(teams);
				setOpen(true);
			}).catch(() => setResults([])).finally(() => setLoading(false));
		}, 280);
		return () => window.clearTimeout(handle);
	}, [query]);
	const boxClass = glass ? "border-white/25 bg-black/25 backdrop-blur-sm" : "border-line bg-panel";
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mb-2 text-xs tracking-wide text-muted uppercase",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: `flex min-h-12 items-center rounded-2xl border px-4 text-sm text-muted ${boxClass}`,
		children: "La agenda se está cargando…"
	})] });
	if (value) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `flex min-h-16 items-center gap-3 rounded-2xl border px-3 py-2 ${boxClass}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamCrest, { id: value.id }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-wide text-muted uppercase",
						children: label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate font-medium",
						children: value.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-sm text-muted",
						children: value.leagueName
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "grid size-11 place-items-center rounded-full text-muted hover:bg-panel-2 hover:text-ink",
				"aria-label": `Cambiar ${label.toLowerCase()}`,
				onClick: () => {
					onChange(null);
					setQuery("");
					setResults([]);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: box,
		className: "relative",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "mb-2 block text-xs tracking-wide text-muted uppercase",
				htmlFor: listId,
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `flex min-h-12 items-center gap-2 rounded-2xl border px-3 ${glass ? "border-white/25 bg-black/25 backdrop-blur-sm" : "border-line bg-panel-2"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
					className: "size-4 shrink-0 text-muted",
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: listId,
					value: query,
					placeholder: hint,
					autoComplete: "off",
					className: "h-12 w-full bg-transparent text-base text-ink outline-none placeholder:text-muted",
					onChange: (event) => {
						setQuery(event.target.value);
						setOpen(true);
					},
					onFocus: () => {
						if (results.length > 0) setOpen(true);
					}
				})]
			}),
			open && query.trim().length >= 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-line bg-panel p-1 shadow-lg",
				children: [
					loading && results.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "px-3 py-3 text-sm text-muted",
						children: "Buscando equipos…"
					}) : null,
					!loading && results.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "px-3 py-3 text-sm text-muted",
						children: "Ningún equipo con ese nombre."
					}) : null,
					results.map((team) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-panel-2",
						onClick: () => {
							onChange(team);
							setOpen(false);
							setQuery("");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamCrest, { id: team.id }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate font-medium",
								children: team.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm text-muted",
								children: team.leagueName
							})]
						})]
					}) }, `${team.id}-${team.league}`))
				]
			}) : null
		]
	});
}
var one = new Intl.NumberFormat("es-AR", {
	minimumFractionDigits: 1,
	maximumFractionDigits: 1
});
var pct = new Intl.NumberFormat("es-AR", {
	style: "percent",
	maximumFractionDigits: 0
});
var day = new Intl.DateTimeFormat("es-AR", {
	timeZone: "America/Argentina/Buenos_Aires",
	day: "numeric",
	month: "short"
});
function formatDay(iso) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	return day.format(date).replace(".", "");
}
function sideNote(side) {
	if (side.attackSpecific && side.concedeSpecific) return "Usa la localía de cada uno, no el promedio de todos los partidos.";
	if (!side.attackSpecific && !side.concedeSpecific) return "Hay pocos partidos en esa condición, así que usa el promedio de toda la muestra.";
	return "Mezcla local o visitante cuando hay al menos 3 partidos, y el promedio general cuando no.";
}
function HistoryChart({ matches }) {
	const [charts, setCharts] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		import("../_libs/recharts+[...].mjs").then((n) => n.t).then(setCharts);
	}, []);
	const data = [...matches].reverse().map((match) => ({
		label: formatDay(match.date),
		favor: match.cornersFor,
		contra: match.cornersAgainst
	}));
	if (!charts) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-52 rounded-2xl bg-panel-2" });
	const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } = charts;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-52",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
			width: "100%",
			height: "100%",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
				data,
				barGap: 2,
				barCategoryGap: "28%",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
						stroke: "var(--color-line)",
						vertical: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
						dataKey: "label",
						tick: {
							fill: "var(--color-muted)",
							fontSize: 12
						},
						axisLine: false,
						tickLine: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
						allowDecimals: false,
						width: 24,
						tick: {
							fill: "var(--color-muted)",
							fontSize: 12
						},
						axisLine: false,
						tickLine: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
						cursor: { fill: "var(--color-panel-2)" },
						contentStyle: {
							background: "var(--color-panel)",
							border: "1px solid var(--color-line)",
							borderRadius: 12,
							color: "var(--color-ink)"
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
						dataKey: "favor",
						name: "A favor",
						fill: "var(--color-flag)",
						radius: [
							4,
							4,
							0,
							0
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
						dataKey: "contra",
						name: "En contra",
						fill: "var(--color-muted)",
						radius: [
							4,
							4,
							0,
							0
						]
					})
				]
			})
		})
	});
}
function TeamDossier({ sample }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-2xl border border-line bg-panel p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamCrest, { id: sample.team.id }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "truncate font-display text-2xl leading-none tracking-wide uppercase",
						children: sample.team.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							sample.matches.length,
							" partidos de liga · ",
							sample.team.leagueName
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-panel-2 px-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-wide text-muted uppercase",
						children: "A favor"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-4xl leading-none text-flag tabular-nums",
						children: one.format(sample.forAvg)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-panel-2 px-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-wide text-muted uppercase",
						children: "En contra"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-4xl leading-none tabular-nums",
						children: one.format(sample.againstAvg)
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistoryChart, { matches: sample.matches }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 mb-3 flex gap-4 text-xs text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-sm bg-flag" }), " A favor"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-sm bg-muted" }), " En contra"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-line",
				children: sample.matches.map((match) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 py-2 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted capitalize",
							children: formatDay(match.date)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block truncate",
								children: [
									match.home ? "vs" : "en",
									" ",
									match.opponent
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-muted",
								children: [
									match.scoreFor,
									"–",
									match.scoreAgainst
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-right tabular-nums",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-flag",
								children: match.cornersFor
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted",
								children: [" / ", match.cornersAgainst]
							})]
						})
					]
				}, match.eventId))
			})
		]
	});
}
function MatchReport({ analysis }) {
	const { home, away, projection } = analysis;
	const band = projection.band.from === projection.band.to ? `${projection.band.from}` : `${projection.band.from} a ${projection.band.to}`;
	const visible = projection.distribution.filter((row) => row.total >= 4 && row.total <= 16);
	const peak = Math.max(...visible.map((row) => row.probability), .01);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rise grid gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-line bg-panel p-4 md:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 flex items-center justify-between gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamCrest, { id: home.team.id }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted uppercase",
										children: "Local"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate font-medium",
										children: home.team.name
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-xl text-muted",
								children: "VS"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 items-center justify-end gap-2 text-right",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted uppercase",
										children: "Visitante"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate font-medium",
										children: away.team.name
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamCrest, { id: away.team.id })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-wide text-muted uppercase",
						children: "Córners esperados"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-7xl leading-none text-flag tabular-nums",
						children: one.format(projection.expectedTotal)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 max-w-xl text-pretty text-ink",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-3xl text-flag tabular-nums",
								children: pct.format(projection.headlineProbability)
							}),
							" ",
							"de chances de que haya ",
							projection.headlineAtLeast,
							" o más. La franja más probable es",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "font-medium",
								children: band
							}),
							" (",
							pct.format(projection.band.probability),
							")."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl bg-panel-2 p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs tracking-wide text-muted uppercase",
									children: [home.team.name, " a favor"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-4xl leading-none tabular-nums",
									children: one.format(projection.expectedHome)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-sm text-pretty text-muted",
									children: [
										"Saca ",
										one.format(projection.home.attackAvg),
										" ",
										projection.home.attackSpecific ? "de local" : "de media",
										".",
										" ",
										away.team.name,
										" concede ",
										one.format(projection.home.concedeAvg),
										" ",
										projection.home.concedeSpecific ? "de visitante" : "de media",
										"."
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: sideNote(projection.home)
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl bg-panel-2 p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs tracking-wide text-muted uppercase",
									children: [away.team.name, " a favor"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-4xl leading-none tabular-nums",
									children: one.format(projection.expectedAway)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-sm text-pretty text-muted",
									children: [
										"Saca ",
										one.format(projection.away.attackAvg),
										" ",
										projection.away.attackSpecific ? "de visitante" : "de media",
										".",
										" ",
										home.team.name,
										" concede ",
										one.format(projection.away.concedeAvg),
										" ",
										projection.away.concedeSpecific ? "de local" : "de media",
										"."
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: sideNote(projection.away)
								})
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-[1.1fr_0.9fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-line bg-panel p-4 md:p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl tracking-wide uppercase",
						children: "Cuántos es probable que haya"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 grid gap-3",
						children: projection.atLeast.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-sm",
									children: [row.atLeast, " o más"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "h-2 overflow-hidden rounded-full bg-panel-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block h-full rounded-full bg-flag",
										style: { width: `${Math.round(row.probability * 100)}%` }
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-right text-sm tabular-nums",
									children: pct.format(row.probability)
								})
							]
						}, row.atLeast))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-line bg-panel p-4 md:p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl tracking-wide uppercase",
							children: "Total exacto"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 flex h-36 items-end gap-1",
							children: visible.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex h-full flex-1 flex-col justify-end gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-sm bg-flag",
									style: { height: `${Math.max(4, row.probability / peak * 100)}%` },
									title: `${row.total}: ${pct.format(row.probability)}`
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-center text-xs text-muted tabular-nums",
									children: row.total
								})]
							}, row.total))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-sm text-pretty text-muted",
							children: "Cada barra es la chance de ese número justo de córners. El modelo es una Poisson: los córners se tratan como conteos independientes alrededor del promedio."
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-hidden rounded-2xl border border-line bg-panel",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-b border-line px-4 py-4 md:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl tracking-wide uppercase",
						children: "Líneas de más / menos"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Más de 8,5 quiere decir 9 córners o más."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[20rem] text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-xs tracking-wide text-muted uppercase",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 font-medium md:px-6",
									children: "Línea"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 font-medium",
									children: "Más"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 font-medium md:px-6",
									children: "Menos"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: projection.lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-line",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 tabular-nums md:px-6",
									children: one.format(line.line)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-flag tabular-nums",
									children: pct.format(line.over)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 tabular-nums md:px-6",
									children: pct.format(line.under)
								})
							]
						}, line.line)) })]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamDossier, { sample: home }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamDossier, { sample: away })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-pretty text-muted",
				children: "Lectura con los últimos partidos que FotMob publica, el mismo peso para cada uno. No es una recomendación de apuesta: un partido puede salir del promedio por el rival, el marcador o el árbitro."
			})
		]
	});
}
function ResultReport({ analysis }) {
	const { home, away, cards } = analysis;
	const result = readResult(home, away, cards.meetings);
	if (!result.enough) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "rounded-2xl border border-line bg-panel p-4 text-sm text-pretty text-muted",
		children: "No hay suficientes resultados recientes para estimar este cruce."
	});
	const favorite = result.call === "home" ? home.team.name : result.call === "away" ? away.team.name : "el empate";
	const favoriteChance = result.call === "home" ? result.homeWin : result.call === "away" ? result.awayWin : result.draw;
	const rows = [
		{
			key: "home",
			label: home.team.name,
			chance: result.homeWin
		},
		{
			key: "draw",
			label: "Empate",
			chance: result.draw
		},
		{
			key: "away",
			label: away.team.name,
			chance: result.awayWin
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rise grid gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-line bg-panel p-4 md:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 flex items-center justify-between gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamCrest, { id: home.team.id }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted uppercase",
										children: "Local"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate font-medium",
										children: home.team.name
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-xl text-muted",
								children: "VS"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 items-center justify-end gap-2 text-right",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted uppercase",
										children: "Visitante"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate font-medium",
										children: away.team.name
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamCrest, { id: away.team.id })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-wide text-muted uppercase",
						children: "Resultado más probable"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-display text-5xl leading-none tracking-wide uppercase md:text-6xl",
						children: result.call === "draw" ? "Empate" : favorite
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 max-w-xl text-pretty text-ink",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-3xl text-flag tabular-nums",
								children: pct.format(favoriteChance)
							}),
							" de chances para ",
							favorite,
							".",
							result.call === "draw" ? ` El local tiene ${pct.format(result.homeWin)} y el visitante ${pct.format(result.awayWin)}.` : ` El empate tiene ${pct.format(result.draw)}.`
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-6 grid gap-3",
						children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "grid gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-baseline justify-between gap-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "truncate",
									children: row.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tabular-nums",
									children: pct.format(row.chance)
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "h-2 overflow-hidden rounded-full bg-panel-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `block h-full rounded-full ${row.key === result.call ? "bg-flag" : "bg-ink/40"}`,
									style: { width: `${Math.max(4, Math.round(row.chance * 100))}%` }
								})
							})]
						}, row.key))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 text-sm text-pretty text-muted",
						children: [
							"Goles esperados: ",
							one.format(result.expectedHome),
							" para ",
							home.team.name,
							" y",
							" ",
							one.format(result.expectedAway),
							" para ",
							away.team.name,
							". Sale de lo que marca cada uno y de lo que le hacen al rival",
							result.home.venue && result.away.venue ? ", de local y de visitante" : "",
							"."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormCard, {
					name: home.team.name,
					form: result.home,
					place: "local"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormCard, {
					name: away.team.name,
					form: result.away,
					place: "visitante"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-line bg-panel p-4 md:p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl tracking-wide uppercase",
					children: "Entre ellos"
				}), result.meetings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-pretty text-muted",
					children: "No hay cruces recientes publicados. La lectura usa solo los últimos partidos de cada equipo."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-sm text-pretty text-muted",
					children: [
						"En ",
						result.meetings.length,
						" ",
						result.meetings.length === 1 ? "cruce" : "cruces",
						", el marcador está puesto como lo vería hoy ",
						home.team.name,
						"."
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 divide-y divide-line",
					children: result.meetings.map((meeting) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between gap-3 py-2 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "capitalize text-muted",
								children: formatDay(meeting.date)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums",
								children: meeting.score
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-right",
								children: meeting.outcome === "draw" ? "Empate" : `Ganó ${meeting.outcome === "home" ? home.team.name : away.team.name}`
							})
						]
					}, meeting.id))
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-pretty text-muted",
				children: "Mezcla los últimos resultados, los goles de esa muestra y los encuentros entre ellos. No es una recomendación de apuesta: un partido se puede ir por un gol, una expulsión o el arco."
			})
		]
	});
}
function FormCard({ name, form, place }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-line bg-panel p-4 md:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "truncate font-display text-2xl tracking-wide uppercase",
				children: name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: form.venue ? `Últimos ${form.sample} de ${place}` : `Últimos ${form.sample}, sin separar localía`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 font-display text-4xl leading-none tabular-nums",
				children: [
					form.wins,
					"G ",
					form.draws,
					"E ",
					form.losses,
					"P"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted",
				children: [
					one.format(form.goalsFor),
					" a favor y ",
					one.format(form.goalsAgainst),
					" en contra."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 divide-y divide-line",
				children: form.recent.map((match) => {
					const mark = match.for > match.against ? "G" : match.for === match.against ? "E" : "P";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3 py-2 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `w-6 font-medium ${mark === "G" ? "text-flag" : "text-muted"}`,
								children: mark
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1 truncate",
								children: [
									match.home ? "vs" : "en",
									" ",
									match.opponent
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular-nums",
								children: [
									match.for,
									"–",
									match.against
								]
							})
						]
					}, match.id);
				})
			})
		]
	});
}
function CardReport({ analysis }) {
	const { cards, home, away } = analysis;
	if (!cards.enough) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "rounded-2xl border border-line bg-panel p-4 text-sm text-pretty text-muted",
		children: "No hay suficientes partidos con tarjetas publicadas para estimar este cruce."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rise grid gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-line bg-panel p-4 md:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-wide text-muted uppercase",
						children: "Tarjetas esperadas"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-7xl leading-none text-flag tabular-nums",
						children: one.format(cards.expectedTotal)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 max-w-xl text-pretty text-ink",
						children: [
							one.format(cards.expectedHome),
							" para ",
							home.team.name,
							" y ",
							one.format(cards.expectedAway),
							" para",
							" ",
							away.team.name,
							". Sale de lo que comete cada uno y de lo que le hacen al rival, en los últimos 10."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 grid gap-3 sm:grid-cols-2",
						children: [[home.team.name, cards.home], [away.team.name, cards.away]].map(([name, side]) => {
							const row = side;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl bg-panel-2 p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-xs tracking-wide text-muted uppercase",
										children: String(name)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm text-muted",
										children: "Comete"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-display text-4xl leading-none tabular-nums",
										children: one.format(row.commitAvg)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-2 text-sm text-muted",
										children: [
											one.format(row.yellowAvg),
											" amarillas · ",
											one.format(row.redAvg),
											" rojas"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-sm text-muted",
										children: "Concede"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-display text-4xl leading-none tabular-nums",
										children: one.format(row.concedeAvg)
									})
								]
							}, String(name));
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-line bg-panel p-4 md:p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl tracking-wide uppercase",
					children: "Últimos 3 enfrentamientos"
				}), cards.meetings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "No encontré cruces recientes entre estos equipos."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 divide-y divide-line",
					children: cards.meetings.map((meeting) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 py-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted capitalize",
								children: formatDay(meeting.date)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "block truncate",
									children: [
										meeting.home,
										" ",
										meeting.score,
										" ",
										meeting.away
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-right tabular-nums",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-flag",
									children: meeting.homeCards + meeting.awayCards
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted",
									children: [
										" ",
										"(",
										meeting.homeCards,
										"-",
										meeting.awayCards,
										")"
									]
								})]
							})
						]
					}, meeting.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-line bg-panel p-4 md:p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl tracking-wide uppercase",
					children: "Árbitro"
				}), cards.referee ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-pretty text-ink",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "font-medium",
						children: cards.referee.name
					}), cards.referee.matches > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						" ",
						"promedia ",
						one.format(cards.referee.yellowPerMatch),
						" amarillas por partido y mostró",
						" ",
						cards.referee.reds,
						" rojas en ",
						cards.referee.matches,
						" partidos."
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: " está designado, pero todavía no hay un promedio de tarjetas." })]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "El árbitro de este partido todavía no está designado."
				})]
			})
		]
	});
}
function avgOf(values) {
	const usable = values.filter((value) => value >= 0);
	if (usable.length === 0) return null;
	return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}
function VolumePanel({ title, tone, unitFor, unitAgainst, total, homeName, awayName, homeExpected, awayExpected, homeFor, homeAgainst, awayFor, awayAgainst, homeSample, awaySample, homeNote, awayNote, homeRows, awayRows, meetings }) {
	const meetingHome = avgOf(meetings.map((meeting) => meeting.home));
	const meetingAway = avgOf(meetings.map((meeting) => meeting.away));
	const ink = tone === "corners" ? "text-flag" : "text-[#9ad0ff]";
	const frame = tone === "corners" ? "border-flag" : "border-[#9ad0ff]";
	const banner = tone === "corners" ? "bg-flag text-flag-ink" : "bg-[#9ad0ff] text-[#071018]";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: `overflow-hidden rounded-3xl border-2 ${frame}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: `px-4 py-4 ${banner}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-4xl leading-none tracking-wide uppercase",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm",
					children: [
						"Este bloque es solo ",
						title.toLowerCase(),
						"."
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 p-3 md:p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-line bg-panel p-4 md:p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs tracking-wide text-muted uppercase",
								children: [title, " en este partido"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `font-display text-6xl leading-none tabular-nums ${ink}`,
								children: total == null ? "–" : one.format(total)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: "Se esperan entre los dos equipos."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 grid gap-3 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl bg-panel-2 p-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs tracking-wide text-muted uppercase",
											children: homeName
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-display text-4xl leading-none tabular-nums",
											children: homeExpected == null ? "–" : one.format(homeExpected)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm text-muted",
											children: "Se esperan de él"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl bg-panel-2 p-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs tracking-wide text-muted uppercase",
											children: awayName
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-display text-4xl leading-none tabular-nums",
											children: awayExpected == null ? "–" : one.format(awayExpected)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm text-muted",
											children: "Se esperan de él"
										})
									]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 lg:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-2xl border border-line bg-panel p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "truncate font-display text-2xl tracking-wide uppercase",
									children: homeName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted",
									children: ["Promedio de los últimos ", homeSample]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl bg-panel-2 px-3 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs tracking-wide text-muted uppercase",
											children: unitFor
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: `font-display text-4xl leading-none tabular-nums ${ink}`,
											children: one.format(homeFor)
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl bg-panel-2 px-3 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs tracking-wide text-muted uppercase",
											children: unitAgainst
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-display text-4xl leading-none tabular-nums",
											children: one.format(homeAgainst)
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm text-pretty text-muted",
									children: homeNote
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-3 divide-y divide-line",
									children: homeRows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 py-2 text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted capitalize",
												children: formatDay(row.date)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "block truncate",
													children: row.label
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-xs text-muted",
													children: row.score
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-right tabular-nums",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: ink,
													children: row.own
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-muted",
													children: [" / ", row.other]
												})]
											})
										]
									}, row.id))
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-2xl border border-line bg-panel p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "truncate font-display text-2xl tracking-wide uppercase",
									children: awayName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted",
									children: ["Promedio de los últimos ", awaySample]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl bg-panel-2 px-3 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs tracking-wide text-muted uppercase",
											children: unitFor
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: `font-display text-4xl leading-none tabular-nums ${ink}`,
											children: one.format(awayFor)
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl bg-panel-2 px-3 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs tracking-wide text-muted uppercase",
											children: unitAgainst
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-display text-4xl leading-none tabular-nums",
											children: one.format(awayAgainst)
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm text-pretty text-muted",
									children: awayNote
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-3 divide-y divide-line",
									children: awayRows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 py-2 text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted capitalize",
												children: formatDay(row.date)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "block truncate",
													children: row.label
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-xs text-muted",
													children: row.score
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-right tabular-nums",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: ink,
													children: row.own
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-muted",
													children: [" / ", row.other]
												})]
											})
										]
									}, row.id))
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-line bg-panel p-4 md:p-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "font-display text-2xl tracking-wide uppercase",
							children: ["Mano a mano · ", title]
						}), meetings.length === 0 || meetingHome == null || meetingAway == null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-muted",
							children: "No hay cruces recientes con este dato."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-pretty text-muted",
							children: [
								"En ",
								meetings.length,
								" ",
								meetings.length === 1 ? "cruce" : "cruces",
								", el local promedió",
								" ",
								one.format(meetingHome),
								" y el visitante ",
								one.format(meetingAway),
								"."
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2 divide-y divide-line",
							children: meetings.map((meeting) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between gap-3 py-2 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "min-w-0 truncate",
										children: meeting.label
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 text-muted capitalize",
										children: formatDay(meeting.date)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "shrink-0 tabular-nums",
										children: [
											meeting.home < 0 ? "–" : meeting.home,
											"-",
											meeting.away < 0 ? "–" : meeting.away
										]
									})
								]
							}, meeting.id))
						})] })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: `border-t px-4 py-3 text-center text-xs tracking-wide uppercase ${frame} ${ink}`,
				children: ["Termina ", title.toLowerCase()]
			})
		]
	});
}
function DeepReport({ analysis }) {
	const { home, away, projection, cards } = analysis;
	const shots = readShots(home.matches, away.matches);
	const cornerRows = (sample) => sample.matches.map((match) => ({
		id: match.eventId,
		date: match.date,
		label: `${match.home ? "vs" : "en"} ${match.opponent}`,
		score: `${match.scoreFor}–${match.scoreAgainst}`,
		own: match.cornersFor,
		other: match.cornersAgainst
	}));
	const shotRows = (sample) => sample.matches.filter((match) => match.shotsFor >= 0).map((match) => ({
		id: match.eventId,
		date: match.date,
		label: `${match.home ? "vs" : "en"} ${match.opponent}`,
		score: `${match.scoreFor}–${match.scoreAgainst}`,
		own: match.shotsFor,
		other: match.shotsAgainst
	}));
	const cornerMeetings = cards.meetings.map((meeting) => ({
		id: meeting.id,
		date: meeting.date,
		label: `${meeting.home} ${meeting.score} ${meeting.away}`,
		home: meeting.homeCorners,
		away: meeting.awayCorners
	}));
	const shotMeetings = cards.meetings.map((meeting) => ({
		id: meeting.id,
		date: meeting.date,
		label: `${meeting.home} ${meeting.score} ${meeting.away}`,
		home: meeting.homeShots,
		away: meeting.awayShots
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rise grid gap-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumePanel, {
				title: "Córners",
				tone: "corners",
				unitFor: "A favor",
				unitAgainst: "En contra",
				total: projection.expectedTotal,
				homeName: home.team.name,
				awayName: away.team.name,
				homeExpected: projection.expectedHome,
				awayExpected: projection.expectedAway,
				homeFor: home.forAvg,
				homeAgainst: home.againstAvg,
				awayFor: away.forAvg,
				awayAgainst: away.againstAvg,
				homeSample: home.matches.length,
				awaySample: away.matches.length,
				homeNote: `Saca ${one.format(projection.home.attackAvg)} ${projection.home.attackSpecific ? "de local" : "de media"}. ${away.team.name} concede ${one.format(projection.home.concedeAvg)} ${projection.home.concedeSpecific ? "de visitante" : "de media"}.`,
				awayNote: `Saca ${one.format(projection.away.attackAvg)} ${projection.away.attackSpecific ? "de visitante" : "de media"}. ${home.team.name} concede ${one.format(projection.away.concedeAvg)} ${projection.away.concedeSpecific ? "de local" : "de media"}.`,
				homeRows: cornerRows(home),
				awayRows: cornerRows(away),
				meetings: cornerMeetings
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumePanel, {
				title: "Remates",
				tone: "shots",
				unitFor: "Que hace",
				unitAgainst: "Que le hacen",
				total: shots.enough ? shots.expectedTotal : null,
				homeName: home.team.name,
				awayName: away.team.name,
				homeExpected: shots.enough ? shots.expectedHome : null,
				awayExpected: shots.enough ? shots.expectedAway : null,
				homeFor: shots.home.forAvg,
				homeAgainst: shots.home.againstAvg,
				awayFor: shots.away.forAvg,
				awayAgainst: shots.away.againstAvg,
				homeSample: shots.home.sample,
				awaySample: shots.away.sample,
				homeNote: shots.enough ? `Hace ${one.format(shots.homeRole.attackAvg)} ${shots.homeRole.attackSpecific ? "de local" : "de media"}. ${away.team.name} recibe ${one.format(shots.homeRole.concedeAvg)} ${shots.homeRole.concedeSpecific ? "de visitante" : "de media"}.` : "No hay suficientes remates publicados en los últimos partidos.",
				awayNote: shots.enough ? `Hace ${one.format(shots.awayRole.attackAvg)} ${shots.awayRole.attackSpecific ? "de visitante" : "de media"}. ${home.team.name} recibe ${one.format(shots.awayRole.concedeAvg)} ${shots.awayRole.concedeSpecific ? "de local" : "de media"}.` : "No hay suficientes remates publicados en los últimos partidos.",
				homeRows: shotRows(home),
				awayRows: shotRows(away),
				meetings: shotMeetings
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-line bg-panel p-4 md:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl tracking-wide uppercase",
						children: "Tarjetas"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-display text-5xl leading-none text-flag tabular-nums",
						children: cards.enough ? one.format(cards.expectedTotal) : "–"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "Se esperan en este partido."
					}),
					cards.enough ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-pretty",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: home.team.name
								}),
								" promedia ",
								one.format(cards.home.commitAvg),
								" que comete y ",
								one.format(cards.home.concedeAvg),
								" que concede. Se esperan ",
								one.format(cards.expectedHome),
								"."
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-pretty",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: away.team.name
								}),
								" promedia ",
								one.format(cards.away.commitAvg),
								" que comete y ",
								one.format(cards.away.concedeAvg),
								" que concede. Se esperan ",
								one.format(cards.expectedAway),
								"."
							]
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: "No hay suficientes tarjetas en los últimos partidos."
					}),
					cards.referee ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 text-sm text-pretty",
						children: [
							"Árbitro: ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "font-medium",
								children: cards.referee.name
							}),
							cards.referee.matches > 0 ? ` promedia ${one.format(cards.referee.yellowPerMatch)} amarillas por partido.` : " está designado, sin promedio todavía."
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-sm text-muted",
						children: "El árbitro todavía no está designado."
					})
				]
			})
		]
	});
}
var STORAGE_KEY = "esquina-picks-fotmob";
function errorText(error) {
	if (error instanceof Error && error.message) return error.message;
	return "No se pudo leer el partido. Probá de nuevo en un momento.";
}
var kickTime = new Intl.DateTimeFormat("es-AR", {
	timeZone: "America/Argentina/Buenos_Aires",
	hour: "2-digit",
	minute: "2-digit",
	hourCycle: "h23"
});
var kickDay = new Intl.DateTimeFormat("es-AR", {
	timeZone: "America/Argentina/Buenos_Aires",
	weekday: "short",
	day: "numeric",
	month: "short"
});
function crestUrl(id) {
	return `https://images.fotmob.com/image_resources/logo/teamlogo/${id}_xsmall.png`;
}
function Crest({ id }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: crestUrl(id),
		alt: "",
		width: 22,
		height: 22,
		loading: "lazy",
		className: "size-5 shrink-0 object-contain"
	});
}
function MatchFace({ fixture }) {
	const when = new Date(fixture.date);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex min-w-0 items-center justify-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate text-sm font-medium",
					children: fixture.home.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crest, { id: fixture.home.id })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "px-1 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-[10px] tracking-wide text-muted capitalize",
					children: kickDay.format(when)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-base font-semibold tabular-nums",
					children: kickTime.format(when)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex min-w-0 items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crest, { id: fixture.away.id }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate text-sm font-medium",
					children: fixture.away.name
				})]
			})
		]
	});
}
function FixtureStack({ title, hint, fixtures, open, onToggle, onPick, homeId, awayId }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-hidden rounded-2xl border border-line bg-[#182117]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "flex w-full items-center gap-3 px-4 py-3 text-left",
			"aria-expanded": open,
			onClick: onToggle,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block truncate font-medium",
						children: title
					}), hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-0.5 block text-xs text-muted",
						children: hint
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-auto rounded-md bg-white/10 px-2 py-0.5 text-sm tabular-nums",
					children: fixtures.length
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `size-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}` })
			]
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "border-t border-line",
			children: fixtures.map((fixture) => {
				const selected = homeId === fixture.home.id && awayId === fixture.away.id;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-pressed": selected,
					className: `flex w-full border-t border-line px-3 py-3 text-left first:border-t-0 hover:bg-white/5 ${selected ? "bg-white/5" : ""}`,
					onClick: () => onPick(fixture),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MatchFace, { fixture })
				}, fixture.id);
			})
		}) : null]
	});
}
function CornerApp() {
	const [home, setHome] = (0, import_react.useState)(null);
	const [away, setAway] = (0, import_react.useState)(null);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [analysis, setAnalysis] = (0, import_react.useState)(null);
	const [view, setView] = (0, import_react.useState)("corners");
	const [matchId, setMatchId] = (0, import_react.useState)("");
	const [agendaOpen, setAgendaOpen] = (0, import_react.useState)(false);
	const [fixtures, setFixtures] = (0, import_react.useState)([]);
	const [boards, setBoards] = (0, import_react.useState)([]);
	const [openBoard, setOpenBoard] = (0, import_react.useState)("");
	const [fixturesReady, setFixturesReady] = (0, import_react.useState)(false);
	const [agendaError, setAgendaError] = (0, import_react.useState)("");
	const reportRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const saved = JSON.parse(raw);
				if (saved.home?.id) setHome(saved.home);
				if (saved.away?.id) setAway(saved.away);
			}
		} catch {}
		setReady(true);
		loadAgenda();
	}, []);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify({
			home,
			away
		}));
	}, [
		home,
		away,
		ready
	]);
	(0, import_react.useEffect)(() => {
		if (!analysis) return;
		reportRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "nearest"
		});
	}, [analysis]);
	async function loadAgenda() {
		setAgendaError("");
		setFixturesReady(false);
		try {
			const [rows, extra] = await Promise.all([listFixtures({ data: {} }), listCompetitions({ data: {} }).catch(() => [])]);
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
			const result = await analyzeMatch({ data: {
				home: nextHome,
				away: nextAway,
				matchId
			} });
			setAnalysis(result);
		} catch (caught) {
			setAnalysis(null);
			setError(errorText(caught));
		} finally {
			setLoading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 md:py-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-end justify-between gap-x-4 gap-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-11 shrink-0 place-items-center rounded-lg bg-flag text-flag-ink",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
							className: "size-5",
							"aria-hidden": "true"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "on-wallpaper font-display text-4xl leading-none tracking-wide uppercase md:text-5xl",
						children: "Córners turbo sacados"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "on-wallpaper text-sm text-ink",
					children: "Últimos 10 de cada lado"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "on-wallpaper max-w-3xl font-display text-5xl leading-none tracking-wide uppercase md:text-7xl",
					children: "Cuántos córners puede tener el partido"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "on-wallpaper max-w-2xl text-pretty text-ink",
					children: "Mirá los últimos partidos de cada equipo, cuántos córners sacan y cuántos conceden, y estimá el total del cruce que elijas."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "grid gap-4 rounded-2xl border border-white/20 bg-[#182117]/40 p-4 backdrop-blur-md md:p-6",
				onSubmit: (event) => {
					event.preventDefault();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-end",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-full",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamField, {
									label: "Local",
									hint: "Boca, River, Arsenal…",
									value: home,
									ready: fixturesReady,
									glass: true,
									onChange: (team) => {
										setHome(team);
										setMatchId("");
										setAnalysis(null);
									}
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "grid size-12 place-items-center self-center rounded-full border border-line text-muted hover:border-flag hover:text-ink",
								"aria-label": "Invertir local y visitante",
								onClick: () => {
									setHome(away);
									setAway(home);
									setAnalysis(null);
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeftRight, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-full",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamField, {
									label: "Visitante",
									hint: "El que juega de visitante",
									value: away,
									ready: fixturesReady,
									glass: true,
									onChange: (team) => {
										setAway(team);
										setMatchId("");
										setAnalysis(null);
									}
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
						children: [
							["corners", "Córners"],
							["cards", "Tarjetas"],
							["result", "Resultado"],
							["deep", "Análisis profundo"]
						].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: !fixturesReady || !home || !away || loading,
							className: `h-12 rounded-full px-2 text-sm font-medium disabled:opacity-40 ${view === id ? "bg-flag text-flag-ink" : "border border-line bg-transparent text-ink"}`,
							onClick: () => {
								setView(id);
								if (!analysis) run();
							},
							children: loading && view === id ? "Leyendo…" : label
						}, id))
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-xl border border-line bg-panel-2 px-3 py-3 text-sm text-pretty",
						role: "alert",
						children: error
					}) : null
				]
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "bg-[#10140f]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8",
			children: [
				analysis && view === "corners" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					ref: reportRef,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MatchReport, { analysis })
				}) : null,
				analysis && view === "cards" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					ref: reportRef,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardReport, { analysis })
				}) : null,
				analysis && view === "result" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					ref: reportRef,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultReport, { analysis })
				}) : null,
				analysis && view === "deep" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					ref: reportRef,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeepReport, { analysis })
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "grid gap-3",
					children: [!fixturesReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-muted",
						children: "La agenda se está cargando…"
					}) : agendaError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "rounded-2xl border border-line bg-panel px-4 py-3 text-left text-sm hover:border-flag",
						onClick: () => void loadAgenda(),
						children: agendaError
					}) : fixtures.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-muted",
						children: "No hay partidos de Liga o Copa Argentina en los próximos 5 días."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FixtureStack, {
						title: "Agenda",
						hint: "Próximos 5 días.",
						fixtures,
						open: agendaOpen,
						onToggle: () => setAgendaOpen((open) => !open),
						homeId: home?.id,
						awayId: away?.id,
						onPick: (fixture) => {
							setHome(fixture.home);
							setAway(fixture.away);
							setMatchId(fixture.id);
							setAnalysis(null);
						}
					}), boards.map((board) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FixtureStack, {
						title: board.title,
						hint: board.title.toLowerCase().includes("nations league") ? "Hoy y mañana." : void 0,
						fixtures: board.fixtures,
						open: openBoard === board.title,
						onToggle: () => setOpenBoard((current) => current === board.title ? "" : board.title),
						homeId: home?.id,
						awayId: away?.id,
						onPick: (fixture) => {
							setHome(fixture.home);
							setAway(fixture.away);
							setMatchId(fixture.id);
							setAnalysis(null);
						}
					}, board.title))]
				}),
				!analysis && !loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "grid gap-3 sm:grid-cols-3",
					children: [
						[
							"01",
							"Elegís el cruce",
							"Local y visitante, o un partido que está por jugarse."
						],
						[
							"02",
							"Mirá los últimos 10",
							"Córners a favor y en contra de cada equipo."
						],
						[
							"03",
							"Leé el porcentaje",
							"Cuántos córners es más probable que haya, y las líneas de más y menos."
						]
					].map(([step, title, copy]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-2xl border border-line bg-panel p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-3xl text-flag",
								children: step
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-2 font-medium",
								children: title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-pretty text-muted",
								children: copy
							})
						]
					}, step))
				}) : null
			]
		})
	})] });
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CornerApp, {});
}
//#endregion
export { Home as component };

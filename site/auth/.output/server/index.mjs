globalThis.__nitro_main__ = import.meta.url;
import { a as toEventHandler, c as FastResponse, i as defineLazyEventHandler, l as serve, n as HTTPError, r as defineHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { i as withoutTrailingSlash, n as joinURL, r as withLeadingSlash, t as decodePath } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs").then((n) => n.o)) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/assets/admin-CcxKdzFU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e6d-lfD5fcbehRnbipdQQDhRPiEDbUk\"",
		"mtime": "2026-05-29T15:51:04.233Z",
		"size": 3693,
		"path": "../public/assets/admin-CcxKdzFU.js"
	},
	"/assets/callback-DktGUCwI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5e-dx15AYMuIhN5DNZtzsfeJGBKBRU\"",
		"mtime": "2026-05-29T15:51:04.233Z",
		"size": 94,
		"path": "../public/assets/callback-DktGUCwI.js"
	},
	"/assets/onboarding-D0GegpQj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c45-D7q47LYbPxIWiZed/HQN+0sOd0A\"",
		"mtime": "2026-05-29T15:51:04.233Z",
		"size": 3141,
		"path": "../public/assets/onboarding-D0GegpQj.js"
	},
	"/assets/profile-jI1moMHa.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5f3-/AWhv6G9oZoLWaqpAiEcZmJGmXE\"",
		"mtime": "2026-05-29T15:51:04.233Z",
		"size": 1523,
		"path": "../public/assets/profile-jI1moMHa.js"
	},
	"/assets/constants-CO21CSIR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11b-IP1tXiSbn3iAlIFbLPQT1GTiALI\"",
		"mtime": "2026-05-29T15:51:04.233Z",
		"size": 283,
		"path": "../public/assets/constants-CO21CSIR.js"
	},
	"/assets/pairing-BRS7qB3m.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9bd-yFxKdT0t6MGSkMp7xRy1VjQ2ztU\"",
		"mtime": "2026-05-29T15:51:04.233Z",
		"size": 2493,
		"path": "../public/assets/pairing-BRS7qB3m.js"
	},
	"/assets/new-B6ahQjl6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a99-CVBK0bctgvOI2kKK6Xf18/XHw28\"",
		"mtime": "2026-05-29T15:51:04.233Z",
		"size": 2713,
		"path": "../public/assets/new-B6ahQjl6.js"
	},
	"/assets/theme-toggle-BOh0Qnz4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"afbe-kYXBYCAg/PBGCPAZVVygERUAElk\"",
		"mtime": "2026-05-29T15:51:04.233Z",
		"size": 44990,
		"path": "../public/assets/theme-toggle-BOh0Qnz4.js"
	},
	"/assets/login-CwHxNfop.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"484-aA3KX5qI7UbpvkIMQdqxslpSXYQ\"",
		"mtime": "2026-05-29T15:51:04.233Z",
		"size": 1156,
		"path": "../public/assets/login-CwHxNfop.js"
	},
	"/assets/styles-ti9cf6Ss.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"2507e-4eSEmcXhaSK9+kB9Fdk8dHeqZ74\"",
		"mtime": "2026-05-29T15:51:04.233Z",
		"size": 151678,
		"path": "../public/assets/styles-ti9cf6Ss.css"
	},
	"/assets/routes-DaiVefHY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5a9-1KSoUwxcTo+W5PwJp8aqfgqp0vM\"",
		"mtime": "2026-05-29T15:51:04.233Z",
		"size": 1449,
		"path": "../public/assets/routes-DaiVefHY.js"
	},
	"/assets/_requestId-By_9hsJv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"aee-N/5SySIRNNsz0zLJBx9i09c0LMQ\"",
		"mtime": "2026-05-29T15:51:04.232Z",
		"size": 2798,
		"path": "../public/assets/_requestId-By_9hsJv.js"
	},
	"/assets/index-DiOlYUF_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"64848-XX+qtWQE+tqMV+cbvLDydDJMmGQ\"",
		"mtime": "2026-05-29T15:51:04.232Z",
		"size": 411720,
		"path": "../public/assets/index-DiOlYUF_.js"
	}
};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/static.mjs
var METHODS = new Set(["HEAD", "GET"]);
var EncodingMap = {
	gzip: ".gz",
	br: ".br",
	zstd: ".zst"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy__9PR8s = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy__9PR8s
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
var globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~middleware"].push(...globalMiddleware);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		middleware.push(...h3App["~middleware"]);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
//#endregion
//#region #nitro/virtual/tracing
var tracingSrvxPlugins = [];
//#endregion
//#region node_modules/nitro/dist/presets/bun/runtime/bun.mjs
var _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
var port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
var host = process.env.NITRO_HOST || process.env.HOST;
var cert = process.env.NITRO_SSL_CERT;
var key = process.env.NITRO_SSL_KEY;
var _fetch = useNitroApp().fetch;
serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: _fetch,
	bun: { websocket: void 0 },
	plugins: [...tracingSrvxPlugins]
});
trapUnhandledErrors();
var bun_default = {};
//#endregion
export { bun_default as default };

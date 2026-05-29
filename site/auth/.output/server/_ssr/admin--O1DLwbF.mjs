import { r as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { u as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Route } from "./admin-DH-Sf87g.mjs";
import { a as Button, c as CardDescription, l as CardHeader, n as AlertDescription, o as Card, r as AlertTitle, s as CardContent, t as Alert, u as CardTitle } from "./src-DexVnyi_.mjs";
import { t as ThemeToggle } from "./theme-toggle-BENAOEYN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin--O1DLwbF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminPage() {
	const { session, hubBase } = Route.useLoaderData();
	const [message, setMessage] = (0, import_react.useState)(null);
	async function refreshStatus() {
		const body = await (await fetch("/api/v1/admin/status")).json();
		setMessage(JSON.stringify(body, null, 2));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-wrap py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "auth-topbar",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "island-kicker hover:underline",
				children: "Beskid Auth"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-2xl space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold",
					children: "Administration"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-muted-foreground mt-1 text-sm",
					children: ["Signed in as @", session.login]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Alert, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertTitle, { children: "OAuth hub" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDescription, { children: [
					"GitHub OAuth callback:",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("code", {
						className: "text-xs",
						children: [hubBase, "/callback"]
					})
				] })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "API" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardDescription, { children: [
					"OpenAPI v1 at",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/api/v1/openapi.json",
						className: "underline",
						children: "/api/v1/openapi.json"
					})
				] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/admin/pairing",
							className: "inline-flex h-9 items-center justify-center rounded-4xl border px-4 text-sm font-medium",
							children: "Service pairing"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							onClick: refreshStatus,
							children: "Refresh admin status"
						}),
						message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
							className: "overflow-x-auto rounded-lg bg-muted p-3 text-xs",
							children: message
						}) : null
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Consumer apps" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Re-run onboarding to update GitHub OAuth credentials and app URLs." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/onboarding",
						children: "Open onboarding"
					})
				}) })] })
			]
		})]
	});
}
//#endregion
export { AdminPage as component };

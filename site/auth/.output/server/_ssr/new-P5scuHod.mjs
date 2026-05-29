import { r as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { u as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Button, c as CardDescription, d as Input, f as Label$1, l as CardHeader, o as Card, s as CardContent, u as CardTitle } from "./src-DexVnyi_.mjs";
import { t as ThemeToggle } from "./theme-toggle-BENAOEYN.mjs";
import { t as AUTH_APP_META } from "./pairing-C0O8oKd7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/new-P5scuHod.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var APP_IDS = [
	"tracker",
	"nexus",
	"pckg"
];
function NewPairingPage() {
	const [appId, setAppId] = (0, import_react.useState)("tracker");
	const [publicUrl, setPublicUrl] = (0, import_react.useState)("");
	const [result, setResult] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function onSubmit(event) {
		event.preventDefault();
		setBusy(true);
		setError(null);
		const res = await fetch("/api/v1/pairing/requests", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				appId,
				publicUrl: publicUrl.trim()
			})
		});
		setBusy(false);
		if (!res.ok) {
			setError((await res.json()).error ?? "Failed to create pairing request");
			return;
		}
		setResult(await res.json());
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-wrap py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "auth-topbar",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/admin/pairing",
				className: "island-kicker hover:underline",
				children: "← Pairing"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-lg space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold",
					children: "New pairing request"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Consumer app" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Enter the app public URL only. Share the pairing code with the app owner." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "space-y-4",
					onSubmit,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, {
								htmlFor: "appId",
								children: "App"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								id: "appId",
								className: "w-full rounded-md border px-3 py-2 text-sm",
								value: appId,
								onChange: (e) => setAppId(e.target.value),
								children: APP_IDS.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: id,
									children: AUTH_APP_META[id].label
								}, id))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, {
								htmlFor: "publicUrl",
								children: "Public URL"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "publicUrl",
								type: "url",
								required: true,
								value: publicUrl,
								onChange: (e) => setPublicUrl(e.target.value),
								placeholder: "https://tracker.beskid-lang.org"
							})]
						}),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-destructive text-sm",
							children: error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: busy,
							children: busy ? "Creating…" : "Create pairing request"
						})
					]
				}) })] }),
				result ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Share with app owner" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardDescription, { children: [
					"Code shown once. Expires ",
					result.expiresAt,
					"."
				] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Code:" }),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "rounded bg-muted px-2 py-1",
							children: result.pairingCode
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Approve link:" }),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "break-all underline",
							href: result.approveUrlTemplate,
							children: result.approveUrlTemplate
						})
					] })]
				})] }) : null
			]
		})]
	});
}
//#endregion
export { NewPairingPage as component };

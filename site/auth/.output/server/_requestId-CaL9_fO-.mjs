import { o as __toESM } from "./_runtime.mjs";
import { t as AUTH_APP_META } from "./_ssr/pairing-D6IQx9Rj.mjs";
import { c as require_jsx_runtime, l as require_react } from "./_libs/@radix-ui/react-avatar+[...].mjs";
import { d as useRouter, u as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { t as cancelPairingRequestFn } from "./_ssr/app-server.functions-BU51zfHg.mjs";
import { t as Route } from "./_requestId-CNShhdfb.mjs";
import { a as Button, c as CardDescription, h as ThemeToggle, l as CardHeader, o as Card, s as CardContent, u as CardTitle } from "./_ssr/theme-toggle-DB_ErBO4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_requestId-CaL9_fO-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PairingDetailPage() {
	const { request, audit } = Route.useLoaderData();
	const router = useRouter();
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const expired = request.status === "pending" && new Date(request.expires_at).getTime() < Date.now();
	const canCancel = request.status === "pending" && !expired;
	async function onCancel() {
		if (!canCancel) return;
		setBusy(true);
		setError(null);
		try {
			await cancelPairingRequestFn({ data: { requestId: request.id } });
			await router.invalidate();
			await router.navigate({ to: "/admin/pairing" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to cancel request");
		} finally {
			setBusy(false);
		}
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
			className: "mx-auto max-w-2xl space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-2xl font-bold",
						children: "Pairing request"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground text-sm",
						children: AUTH_APP_META[request.app_id]?.label ?? request.app_id
					})] }), canCancel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "destructive",
						disabled: busy,
						onClick: onCancel,
						children: busy ? "Cancelling…" : "Cancel request"
					}) : null]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-destructive text-sm",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Details" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardDescription, { children: ["Request id ", request.id] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-2 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Status:" }),
							" ",
							request.status,
							expired ? " (expired)" : ""
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Public URL:" }),
							" ",
							request.public_url
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Created by:" }),
							" ",
							request.created_by_login
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Created:" }),
							" ",
							request.created_at
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Expires:" }),
							" ",
							request.expires_at
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground",
							children: "Pairing codes are shown once when the request is created. Share a new request if the code was lost."
						})
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Audit trail" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "space-y-2 text-sm",
					children: audit.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground",
						children: "No audit events yet."
					}) : audit.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: row.event
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-muted-foreground text-xs",
							children: [row.created_at, row.actor_login ? ` — ${row.actor_login}` : ""]
						})]
					}, row.id))
				})] })
			]
		})]
	});
}
//#endregion
export { PairingDetailPage as component };

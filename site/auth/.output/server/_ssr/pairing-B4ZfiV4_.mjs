import { o as __toESM } from "../_runtime.mjs";
import { t as AUTH_APP_META } from "./pairing-D6IQx9Rj.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { d as useRouter, u as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as cancelPairingRequestFn } from "./app-server.functions-BU51zfHg.mjs";
import { a as Button, h as ThemeToggle, l as CardHeader, o as Card, s as CardContent, u as CardTitle } from "./theme-toggle-DB_ErBO4.mjs";
import { t as Route } from "./pairing-BRsMDuf7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pairing-B4ZfiV4_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PairingListPage() {
	const { requests } = Route.useLoaderData();
	const router = useRouter();
	const [busyId, setBusyId] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	async function onCancel(requestId) {
		setBusyId(requestId);
		setError(null);
		try {
			await cancelPairingRequestFn({ data: { requestId } });
			await router.invalidate();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to cancel request");
		} finally {
			setBusyId(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-wrap py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "auth-topbar",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/admin",
				className: "island-kicker hover:underline",
				children: "← Admin"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-2xl space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-2xl font-bold",
						children: "Service pairing"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/admin/pairing/new",
						className: "inline-flex h-9 items-center justify-center rounded-4xl bg-primary px-4 text-sm font-medium text-primary-foreground",
						children: "New pairing"
					})]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-destructive text-sm",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Recent requests" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "space-y-3",
					children: requests.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground text-sm",
						children: "No pairing requests yet."
					}) : requests.map((row) => {
						const expired = row.status === "pending" && new Date(row.expires_at).getTime() < Date.now();
						const canCancel = row.status === "pending" && !expired;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-lg border p-3 text-sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-medium",
										children: [
											AUTH_APP_META[row.app_id]?.label ?? row.app_id,
											" — ",
											row.status,
											expired ? " (expired)" : ""
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-muted-foreground",
										children: row.public_url
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-muted-foreground text-xs",
										children: ["Expires ", row.expires_at]
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/admin/pairing/$requestId",
										params: { requestId: row.id },
										className: "inline-flex h-8 items-center justify-center rounded-4xl border px-3 text-xs font-medium",
										children: "Details"
									}), canCancel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "outline",
										size: "sm",
										disabled: busyId === row.id,
										onClick: () => onCancel(row.id),
										children: busyId === row.id ? "Cancelling…" : "Cancel"
									}) : null]
								})]
							})
						}, row.id);
					})
				})] })
			]
		})]
	});
}
//#endregion
export { PairingListPage as component };

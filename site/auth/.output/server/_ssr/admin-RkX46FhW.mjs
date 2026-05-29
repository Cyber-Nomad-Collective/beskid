import { r as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { u as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Route } from "./admin-CJ-arQiO.mjs";
import { a as Button, c as CardDescription, d as Input, f as Label$1, l as CardHeader, n as AlertDescription, o as Card, r as AlertTitle, s as CardContent, t as Alert, u as CardTitle } from "./src-DexVnyi_.mjs";
import { t as ThemeToggle } from "./theme-toggle-BENAOEYN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-RkX46FhW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminPage() {
	const { session, hubBase, admins: initialAdmins } = Route.useLoaderData();
	const [admins, setAdmins] = (0, import_react.useState)(initialAdmins);
	const [newLogin, setNewLogin] = (0, import_react.useState)("");
	const [adminError, setAdminError] = (0, import_react.useState)(null);
	const [adminBusy, setAdminBusy] = (0, import_react.useState)(false);
	const [message, setMessage] = (0, import_react.useState)(null);
	async function refreshStatus() {
		const body = await (await fetch("/api/v1/admin/status")).json();
		setMessage(JSON.stringify(body, null, 2));
	}
	async function addAdmin(event) {
		event.preventDefault();
		setAdminBusy(true);
		setAdminError(null);
		const res = await fetch("/api/v1/admin/admins", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ login: newLogin.trim() })
		});
		setAdminBusy(false);
		if (!res.ok) {
			setAdminError((await res.json()).error ?? "Failed to add admin");
			return;
		}
		setAdmins((await res.json()).admins);
		setNewLogin("");
	}
	async function removeAdmin(login) {
		setAdminBusy(true);
		setAdminError(null);
		const res = await fetch(`/api/v1/admin/admins?login=${encodeURIComponent(login)}`, { method: "DELETE" });
		setAdminBusy(false);
		if (!res.ok) {
			setAdminError((await res.json()).error ?? "Failed to remove admin");
			return;
		}
		setAdmins((await res.json()).admins);
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
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Hub admins" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "GitHub logins with access to pairing and hub settings." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-4",
					children: [
						adminError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-destructive text-sm",
							role: "alert",
							children: adminError
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-2",
							children: admins.map((login) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between rounded-lg border px-3 py-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["@", login] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									size: "sm",
									disabled: adminBusy,
									onClick: () => removeAdmin(login),
									children: "Remove"
								})]
							}, login))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: addAdmin,
							className: "flex flex-col gap-2 sm:flex-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, {
									htmlFor: "newAdminLogin",
									className: "sr-only",
									children: "GitHub login"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "newAdminLogin",
									value: newLogin,
									onChange: (event) => setNewLogin(event.target.value),
									placeholder: "github-username",
									disabled: adminBusy
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: adminBusy || !newLogin.trim(),
								children: "Add admin"
							})]
						})
					]
				})] }),
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

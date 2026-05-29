import { r as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { u as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Button, c as CardDescription, d as Input, f as Label$1, l as CardHeader, o as Card, s as CardContent, u as CardTitle } from "./src-DexVnyi_.mjs";
import { t as ThemeToggle } from "./theme-toggle-BENAOEYN.mjs";
import { t as Route } from "./onboarding-C6tbS9Pc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboarding-Gldidt_1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OnboardingPage() {
	const { defaultCallback } = Route.useLoaderData();
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function onSubmit(event) {
		event.preventDefault();
		setBusy(true);
		setError(null);
		const form = new FormData(event.currentTarget);
		const payload = {
			setupToken: String(form.get("setupToken") ?? "").trim() || void 0,
			githubClientId: String(form.get("githubClientId") ?? "").trim(),
			githubClientSecret: String(form.get("githubClientSecret") ?? "").trim(),
			githubOAuthCallbackUrl: String(form.get("githubOAuthCallbackUrl") ?? defaultCallback).trim(),
			adminGitHubLogins: String(form.get("adminGitHubLogins") ?? "").split(",").map((s) => s.trim()).filter(Boolean)
		};
		const res = await fetch("/api/v1/admin/setup", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload)
		});
		setBusy(false);
		if (!res.ok) {
			setError((await res.json()).error ?? "Setup failed");
			return;
		}
		window.location.href = "/admin";
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
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit,
			className: "mx-auto max-w-xl space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold",
					children: "Hub onboarding"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground mt-1 text-sm",
					children: "Configure the shared GitHub OAuth app. Pair tracker, nexus, and pckg later from Admin → Pairing."
				})] }),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-destructive text-sm",
					role: "alert",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "GitHub OAuth App" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Create one OAuth app with callback URL below." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, {
								htmlFor: "setupToken",
								children: "Setup token (if configured)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "setupToken",
								name: "setupToken",
								type: "password"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, {
								htmlFor: "githubClientId",
								children: "Client ID"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "githubClientId",
								name: "githubClientId",
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, {
								htmlFor: "githubClientSecret",
								children: "Client secret"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "githubClientSecret",
								name: "githubClientSecret",
								type: "password",
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, {
								htmlFor: "githubOAuthCallbackUrl",
								children: "Callback URL"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "githubOAuthCallbackUrl",
								name: "githubOAuthCallbackUrl",
								defaultValue: defaultCallback,
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, {
								htmlFor: "adminGitHubLogins",
								children: "Admin GitHub logins"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "adminGitHubLogins",
								name: "adminGitHubLogins",
								placeholder: "login1, login2",
								required: true
							})]
						})
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					disabled: busy,
					className: "w-full",
					children: busy ? "Saving…" : "Complete setup"
				})
			]
		})]
	});
}
//#endregion
export { OnboardingPage as component };

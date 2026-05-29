import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { u as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Button, p as ProfileCard } from "./src-DexVnyi_.mjs";
import { t as ThemeToggle } from "./theme-toggle-BENAOEYN.mjs";
import { t as Route } from "./profile-C6UWY7WB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-4Gh4awUr.js
var import_jsx_runtime = require_jsx_runtime();
function ProfilePage() {
	const { session, apps, isAdmin } = Route.useLoaderData();
	const { github_login: linkedLogin } = Route.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-wrap py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "auth-topbar",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "island-kicker hover:underline",
				children: "Beskid Auth"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [
					isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "sm",
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/admin",
							children: "Administration"
						})
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "sm",
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/account",
							children: "Account"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-lg space-y-6",
			children: [linkedLogin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-muted-foreground text-sm",
				role: "status",
				children: [
					"GitHub identity verified for pckg as @",
					linkedLogin,
					"."
				]
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ProfileCard, {
				user: session,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground text-sm",
						children: "Signed in via GitHub. Continue to a Beskid app below or sign out."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 space-y-2",
						children: apps.map((app) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: app.loginUrl,
							className: "text-primary text-sm underline-offset-4 hover:underline",
							children: ["Open ", app.label]
						}) }, app.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
						action: "/api/auth/logout",
						method: "post",
						className: "mt-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							variant: "outline",
							children: "Sign out"
						})
					})
				]
			})]
		})]
	});
}
//#endregion
export { ProfilePage as component };

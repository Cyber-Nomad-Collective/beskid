import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { u as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Button, m as ServicePicker } from "./src-DexVnyi_.mjs";
import { t as ThemeToggle } from "./theme-toggle-BENAOEYN.mjs";
import { t as Route } from "./routes-D83SRqm-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-mOMXIyDT.js
var import_jsx_runtime = require_jsx_runtime();
function HomePage() {
	const { apps, session, hubBase } = Route.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-wrap",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "auth-topbar",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "island-kicker",
				children: "Beskid"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [session ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/profile",
						children: "Profile"
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: `${hubBase}/login?app=hub`,
						children: "Sign in"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "py-10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-lg space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "display-title text-3xl font-bold tracking-tight",
							children: "Sign in with GitHub"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground mt-3 text-sm",
							children: "One OAuth app for Tracker, Nexus, and the package registry."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServicePicker, { services: apps.map((app) => ({
						id: app.id,
						label: app.label,
						description: app.description,
						href: app.loginUrl
					})) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground text-center text-xs",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "https://beskid-lang.org/platform-spec/",
							className: "underline-offset-4 hover:underline",
							children: "Platform specification"
						})
					})
				]
			})
		})]
	});
}
//#endregion
export { HomePage as component };

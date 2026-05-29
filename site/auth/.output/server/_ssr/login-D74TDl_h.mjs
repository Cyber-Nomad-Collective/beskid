import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { u as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Button, h as ThemeToggle, i as AuthPageShell } from "./theme-toggle-DB_ErBO4.mjs";
import { t as Route } from "./login-DQWvq9Pa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-D74TDl_h.js
var import_jsx_runtime = require_jsx_runtime();
function errorMessage(code) {
	switch (code) {
		case "oauth_state": return "Sign-in expired or was interrupted. Try again.";
		case "oauth_failed": return "GitHub sign-in failed. Check OAuth app settings.";
		default: return null;
	}
}
function LoginPage() {
	const { error } = Route.useSearch();
	const { hubBase } = Route.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-wrap relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute top-4 right-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthPageShell, {
			title: "Account",
			description: "Sign in to manage your Beskid profile on the auth hub.",
			error: errorMessage(error) ?? void 0,
			footer: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "https://beskid-lang.org/platform-spec/",
				className: "underline-offset-4 hover:underline",
				children: "Platform specification"
			}),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "lg",
				asChild: true,
				className: "w-full",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: `${hubBase}/login?app=hub`,
					children: "Sign in with GitHub"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted-foreground text-center text-xs",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "underline-offset-4 hover:underline",
					children: "Back to services"
				})
			})]
		})]
	});
}
//#endregion
export { LoginPage as component };

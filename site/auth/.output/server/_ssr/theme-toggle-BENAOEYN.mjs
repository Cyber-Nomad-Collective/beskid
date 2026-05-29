import { r as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { n as Moon, t as Sun } from "../_libs/lucide-react.mjs";
import { a as Button } from "./src-DexVnyi_.mjs";
import { n as z } from "../_libs/next-themes.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/theme-toggle-BENAOEYN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ThemeToggle() {
	const { resolvedTheme, setTheme } = z();
	const [mounted, setMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setMounted(true), []);
	if (!mounted) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		variant: "ghost",
		size: "icon-sm",
		"aria-label": "Theme",
		disabled: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-4" })
	});
	const isDark = resolvedTheme === "dark";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		type: "button",
		variant: "ghost",
		size: "icon-sm",
		"aria-label": isDark ? "Switch to light theme" : "Switch to dark theme",
		onClick: () => setTheme(isDark ? "light" : "dark"),
		children: isDark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-4" })
	});
}
//#endregion
export { ThemeToggle as t };

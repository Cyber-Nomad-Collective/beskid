import { c as createFileRoute, s as lazyRouteComponent, w as redirect } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as fetchOnboardingGate } from "./app-server.functions-C9vF87JV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboarding-aNwjY9k4.js
var $$splitComponentImporter = () => import("./onboarding-DtZblGF3.mjs");
var Route = createFileRoute("/onboarding")({
	loader: async () => {
		const { onboarded, defaultCallback } = await fetchOnboardingGate();
		if (onboarded) throw redirect({ to: "/admin" });
		return { defaultCallback };
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

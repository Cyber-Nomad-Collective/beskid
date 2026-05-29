import { T as redirect, c as createFileRoute, s as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as fetchOnboardingGate } from "./app-server.functions-BU51zfHg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboarding-Bl0S_iO1.js
var $$splitComponentImporter = () => import("./onboarding-CHeG8mqY.mjs");
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

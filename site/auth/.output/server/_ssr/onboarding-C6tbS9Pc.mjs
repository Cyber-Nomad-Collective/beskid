import { c as createFileRoute, s as lazyRouteComponent, w as redirect } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as fetchOnboardingGate } from "./app-server.functions-CFnCfhxX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboarding-C6tbS9Pc.js
var $$splitComponentImporter = () => import("./onboarding-Gldidt_1.mjs");
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

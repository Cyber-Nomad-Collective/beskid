import { T as redirect, c as createFileRoute, s as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as fetchPairingRequests } from "./app-server.functions-BU51zfHg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pairing-BRsMDuf7.js
var $$splitComponentImporter = () => import("./pairing-B4ZfiV4_.mjs");
var Route = createFileRoute("/admin/pairing/")({
	loader: async () => {
		const access = await fetchPairingRequests();
		if (access.kind === "onboarding") throw redirect({ to: "/onboarding" });
		if (access.kind === "login") throw redirect({
			to: "/login",
			search: { app: "hub" }
		});
		if (access.kind === "profile") throw redirect({ to: "/profile" });
		return { requests: access.requests };
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

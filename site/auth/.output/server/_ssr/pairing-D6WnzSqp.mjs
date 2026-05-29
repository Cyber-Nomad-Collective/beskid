import { c as createFileRoute, s as lazyRouteComponent, w as redirect } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as fetchPairingRequests } from "./app-server.functions-C9vF87JV.mjs";
import "./src-DexVnyi_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pairing-D6WnzSqp.js
var $$splitComponentImporter = () => import("./pairing-BKiB5Ho1.mjs");
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

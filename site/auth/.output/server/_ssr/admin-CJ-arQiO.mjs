import { c as createFileRoute, s as lazyRouteComponent, w as redirect } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as fetchAdminDashboard } from "./app-server.functions-C9vF87JV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-CJ-arQiO.js
var $$splitComponentImporter = () => import("./admin-RkX46FhW.mjs");
var Route = createFileRoute("/admin/")({
	loader: async () => {
		const access = await fetchAdminDashboard();
		if (access.kind === "onboarding") throw redirect({ to: "/onboarding" });
		if (access.kind === "login") throw redirect({
			to: "/login",
			search: { app: "hub" }
		});
		if (access.kind === "profile") throw redirect({ to: "/profile" });
		return access;
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

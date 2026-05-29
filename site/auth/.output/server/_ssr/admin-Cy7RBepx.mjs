import { T as redirect, c as createFileRoute, s as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as fetchAdminDashboard } from "./app-server.functions-BU51zfHg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-Cy7RBepx.js
var $$splitComponentImporter = () => import("./admin-BV1SYEfT.mjs");
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

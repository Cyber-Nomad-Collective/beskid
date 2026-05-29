import { c as createFileRoute, s as lazyRouteComponent, w as redirect } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as fetchAdminAccess } from "./app-server.functions-CFnCfhxX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-DH-Sf87g.js
var $$splitComponentImporter = () => import("./admin--O1DLwbF.mjs");
var Route = createFileRoute("/admin/")({
	loader: async () => {
		const access = await fetchAdminAccess();
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

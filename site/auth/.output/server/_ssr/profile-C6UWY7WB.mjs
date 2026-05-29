import { c as createFileRoute, s as lazyRouteComponent, w as redirect } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as fetchProfileData } from "./app-server.functions-C9vF87JV.mjs";
import { a as string, i as object } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-C6UWY7WB.js
var $$splitComponentImporter = () => import("./profile-4Gh4awUr.mjs");
var profileSearchSchema = object({ github_login: string().optional() });
var Route = createFileRoute("/profile")({
	validateSearch: profileSearchSchema,
	loader: async () => {
		const data = await fetchProfileData();
		if (!data) throw redirect({ to: "/login" });
		return data;
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

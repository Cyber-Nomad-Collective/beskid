import { c as createFileRoute, s as lazyRouteComponent, w as redirect } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as fetchProfileData } from "./app-server.functions-CFnCfhxX.mjs";
import { a as string, i as object } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-CpHInzxx.js
var $$splitComponentImporter = () => import("./profile-DUHOHsNe.mjs");
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

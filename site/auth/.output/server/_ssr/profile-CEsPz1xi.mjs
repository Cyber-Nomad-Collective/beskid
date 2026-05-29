import { a as string, i as object } from "../_libs/zod.mjs";
import { T as redirect, c as createFileRoute, s as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as fetchProfileData } from "./app-server.functions-BU51zfHg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-CEsPz1xi.js
var $$splitComponentImporter = () => import("./profile-CCoUQCpP.mjs");
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

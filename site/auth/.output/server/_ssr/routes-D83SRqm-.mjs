import { c as createFileRoute, s as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as fetchHomeData } from "./app-server.functions-CFnCfhxX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D83SRqm-.js
var $$splitComponentImporter = () => import("./routes-mOMXIyDT.mjs");
var Route = createFileRoute("/")({
	loader: () => fetchHomeData(),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

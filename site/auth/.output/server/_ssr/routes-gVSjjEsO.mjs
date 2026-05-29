import { c as createFileRoute, s as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as fetchHomeData } from "./app-server.functions-BU51zfHg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-gVSjjEsO.js
var $$splitComponentImporter = () => import("./routes-C9M-Q9-y.mjs");
var Route = createFileRoute("/")({
	loader: () => fetchHomeData(),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

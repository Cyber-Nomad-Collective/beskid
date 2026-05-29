import { c as createFileRoute, s as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as fetchHomeData } from "./app-server.functions-C9vF87JV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-LeyG4ety.js
var $$splitComponentImporter = () => import("./routes-DxZHPXm0.mjs");
var Route = createFileRoute("/")({
	loader: () => fetchHomeData(),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

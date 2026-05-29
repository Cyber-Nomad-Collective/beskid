import { T as redirect, c as createFileRoute, s as lazyRouteComponent } from "./_libs/@tanstack/react-router+[...].mjs";
import { s as fetchPairingRequestDetail } from "./_ssr/app-server.functions-BU51zfHg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_requestId-CNShhdfb.js
var $$splitComponentImporter = () => import("./_requestId-CaL9_fO-.mjs");
var Route = createFileRoute("/admin/pairing/$requestId")({
	loader: async ({ params }) => {
		const access = await fetchPairingRequestDetail({ data: { requestId: params.requestId } });
		if (access.kind === "onboarding") throw redirect({ to: "/onboarding" });
		if (access.kind === "login") throw redirect({
			to: "/login",
			search: { app: "hub" }
		});
		if (access.kind === "profile") throw redirect({ to: "/profile" });
		if (access.kind === "not_found") throw redirect({ to: "/admin/pairing" });
		return {
			request: access.request,
			audit: access.audit
		};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

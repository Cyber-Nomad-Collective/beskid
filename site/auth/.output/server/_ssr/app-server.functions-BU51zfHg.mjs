import { a as getServerFnById, r as createServerFn, t as TSS_SERVER_FUNCTION } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-server.functions-BU51zfHg.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var fetchHomeData = createServerFn({ method: "GET" }).handler(createSsrRpc("482db671a8f1342fa7d317ac478d599c2eab3fc826d2f63984e558cbbaffe7db"));
var fetchLoginPageContext = createServerFn({ method: "GET" }).handler(createSsrRpc("ec2b72241cd565806da76157f819a7646738d3420993cb997508f53de607c76f"));
var fetchProfileData = createServerFn({ method: "GET" }).handler(createSsrRpc("cbaebcbcd4bbc47663e9affc5ed7611451ef23e8dc1273807b7747de8090da98"));
var fetchAdminAccess = createServerFn({ method: "GET" }).handler(createSsrRpc("0a89ee1416973a2d25600020f4bf156615779811249f14f5f93214502a5ab0ef"));
var fetchAdminDashboard = createServerFn({ method: "GET" }).handler(createSsrRpc("b01ac6cfa8c45b77f270c51e9b76970ec2b519c3089f503864f33322f1d61ae3"));
var fetchOnboardingGate = createServerFn({ method: "GET" }).handler(createSsrRpc("a3f632bac40d5c74206e7d883a8ee04016f5c13d63973121bcdff9eaf1c51a84"));
var fetchPairingRequests = createServerFn({ method: "GET" }).handler(createSsrRpc("c170a1a18b98f1d9a48c33d84f070c42185b0b50923b3a51f2846e74187f1acd"));
var fetchPairingRequestDetail = createServerFn({ method: "GET" }).inputValidator((data) => data).handler(createSsrRpc("a740e8996b5993cca3aee6e1c828eb74339c4aebfee393a8660c7db34778a286"));
var cancelPairingRequestFn = createServerFn({ method: "POST" }).inputValidator((data) => data).handler(createSsrRpc("0d11da4c1efd2d83a03143f5e08737e9fb022e422a7420fedb93ff5f4b52a8e3"));
//#endregion
export { fetchLoginPageContext as a, fetchPairingRequests as c, fetchHomeData as i, fetchProfileData as l, fetchAdminAccess as n, fetchOnboardingGate as o, fetchAdminDashboard as r, fetchPairingRequestDetail as s, cancelPairingRequestFn as t };

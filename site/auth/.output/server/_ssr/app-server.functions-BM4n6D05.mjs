import { C as listPairingAudit, S as listEnabledApps, _ as getSessionFromRequest, d as getAdminLogins, h as getPairingRequest, u as env, w as listPairingRequests, x as isOnboarded, y as isAdminLogin } from "./pairing-D6IQx9Rj.mjs";
import { i as getRequest, r as createServerFn, t as TSS_SERVER_FUNCTION } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-server.functions-BM4n6D05.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function hubPublicBase() {
	return env.AUTH_HUB_PUBLIC_URL.replace(/\/$/, "");
}
function hubOAuthCallbackUrl() {
	return `${hubPublicBase()}/callback`;
}
async function resolveAdminAccess() {
	if (!await isOnboarded()) return { kind: "onboarding" };
	const session = await getSessionFromRequest(getRequest());
	if (!session) return { kind: "login" };
	if (!await isAdminLogin(session.login)) return { kind: "profile" };
	return {
		kind: "ok",
		session,
		hubBase: hubPublicBase()
	};
}
async function loadHomeData() {
	const request = getRequest();
	const [apps, session] = await Promise.all([listEnabledApps(), getSessionFromRequest(request)]);
	return {
		apps,
		session,
		hubBase: hubPublicBase()
	};
}
async function loadLoginPageContext() {
	return { hubBase: hubPublicBase() };
}
async function loadProfileData() {
	const session = await getSessionFromRequest(getRequest());
	if (!session) return null;
	const [apps, isAdmin] = await Promise.all([listEnabledApps(), isAdminLogin(session.login)]);
	return {
		session,
		apps,
		isAdmin
	};
}
async function loadAdminDashboard() {
	const access = await resolveAdminAccess();
	if (access.kind !== "ok") return access;
	return {
		kind: "ok",
		session: access.session,
		hubBase: access.hubBase,
		admins: getAdminLogins()
	};
}
async function loadOnboardingGate() {
	return {
		onboarded: await isOnboarded(),
		defaultCallback: hubOAuthCallbackUrl()
	};
}
async function loadPairingRequests() {
	const access = await resolveAdminAccess();
	if (access.kind !== "ok") return access;
	return {
		kind: "ok",
		requests: listPairingRequests()
	};
}
async function loadPairingRequestDetail(requestId) {
	const access = await resolveAdminAccess();
	if (access.kind !== "ok") return access;
	const request = getPairingRequest(requestId);
	if (!request) return { kind: "not_found" };
	return {
		kind: "ok",
		request,
		audit: listPairingAudit(requestId)
	};
}
var fetchHomeData_createServerFn_handler = createServerRpc({
	id: "482db671a8f1342fa7d317ac478d599c2eab3fc826d2f63984e558cbbaffe7db",
	name: "fetchHomeData",
	filename: "src/server/app-server.functions.ts"
}, (opts) => fetchHomeData.__executeServer(opts));
var fetchHomeData = createServerFn({ method: "GET" }).handler(fetchHomeData_createServerFn_handler, async () => loadHomeData());
var fetchLoginPageContext_createServerFn_handler = createServerRpc({
	id: "ec2b72241cd565806da76157f819a7646738d3420993cb997508f53de607c76f",
	name: "fetchLoginPageContext",
	filename: "src/server/app-server.functions.ts"
}, (opts) => fetchLoginPageContext.__executeServer(opts));
var fetchLoginPageContext = createServerFn({ method: "GET" }).handler(fetchLoginPageContext_createServerFn_handler, async () => loadLoginPageContext());
var fetchProfileData_createServerFn_handler = createServerRpc({
	id: "cbaebcbcd4bbc47663e9affc5ed7611451ef23e8dc1273807b7747de8090da98",
	name: "fetchProfileData",
	filename: "src/server/app-server.functions.ts"
}, (opts) => fetchProfileData.__executeServer(opts));
var fetchProfileData = createServerFn({ method: "GET" }).handler(fetchProfileData_createServerFn_handler, async () => loadProfileData());
var fetchAdminAccess_createServerFn_handler = createServerRpc({
	id: "0a89ee1416973a2d25600020f4bf156615779811249f14f5f93214502a5ab0ef",
	name: "fetchAdminAccess",
	filename: "src/server/app-server.functions.ts"
}, (opts) => fetchAdminAccess.__executeServer(opts));
var fetchAdminAccess = createServerFn({ method: "GET" }).handler(fetchAdminAccess_createServerFn_handler, async () => resolveAdminAccess());
var fetchAdminDashboard_createServerFn_handler = createServerRpc({
	id: "b01ac6cfa8c45b77f270c51e9b76970ec2b519c3089f503864f33322f1d61ae3",
	name: "fetchAdminDashboard",
	filename: "src/server/app-server.functions.ts"
}, (opts) => fetchAdminDashboard.__executeServer(opts));
var fetchAdminDashboard = createServerFn({ method: "GET" }).handler(fetchAdminDashboard_createServerFn_handler, async () => loadAdminDashboard());
var fetchOnboardingGate_createServerFn_handler = createServerRpc({
	id: "a3f632bac40d5c74206e7d883a8ee04016f5c13d63973121bcdff9eaf1c51a84",
	name: "fetchOnboardingGate",
	filename: "src/server/app-server.functions.ts"
}, (opts) => fetchOnboardingGate.__executeServer(opts));
var fetchOnboardingGate = createServerFn({ method: "GET" }).handler(fetchOnboardingGate_createServerFn_handler, async () => loadOnboardingGate());
var fetchPairingRequests_createServerFn_handler = createServerRpc({
	id: "c170a1a18b98f1d9a48c33d84f070c42185b0b50923b3a51f2846e74187f1acd",
	name: "fetchPairingRequests",
	filename: "src/server/app-server.functions.ts"
}, (opts) => fetchPairingRequests.__executeServer(opts));
var fetchPairingRequests = createServerFn({ method: "GET" }).handler(fetchPairingRequests_createServerFn_handler, async () => loadPairingRequests());
var fetchPairingRequestDetail_createServerFn_handler = createServerRpc({
	id: "a740e8996b5993cca3aee6e1c828eb74339c4aebfee393a8660c7db34778a286",
	name: "fetchPairingRequestDetail",
	filename: "src/server/app-server.functions.ts"
}, (opts) => fetchPairingRequestDetail.__executeServer(opts));
var fetchPairingRequestDetail = createServerFn({ method: "GET" }).inputValidator((data) => data).handler(fetchPairingRequestDetail_createServerFn_handler, async ({ data }) => loadPairingRequestDetail(data.requestId));
var cancelPairingRequestFn_createServerFn_handler = createServerRpc({
	id: "0d11da4c1efd2d83a03143f5e08737e9fb022e422a7420fedb93ff5f4b52a8e3",
	name: "cancelPairingRequestFn",
	filename: "src/server/app-server.functions.ts"
}, (opts) => cancelPairingRequestFn.__executeServer(opts));
var cancelPairingRequestFn = createServerFn({ method: "POST" }).inputValidator((data) => data).handler(cancelPairingRequestFn_createServerFn_handler, async ({ data }) => {
	const access = await resolveAdminAccess();
	if (access.kind !== "ok") throw new Error("Hub admin required");
	const { cancelPairingRequest } = await import("./pairing-D6IQx9Rj.mjs").then((n) => n.T).then((n) => n.s);
	const result = cancelPairingRequest(data.requestId, access.session.login);
	if ("error" in result) throw new Error(result.error);
	return { ok: true };
});
//#endregion
export { cancelPairingRequestFn_createServerFn_handler, fetchAdminAccess_createServerFn_handler, fetchAdminDashboard_createServerFn_handler, fetchHomeData_createServerFn_handler, fetchLoginPageContext_createServerFn_handler, fetchOnboardingGate_createServerFn_handler, fetchPairingRequestDetail_createServerFn_handler, fetchPairingRequests_createServerFn_handler, fetchProfileData_createServerFn_handler };

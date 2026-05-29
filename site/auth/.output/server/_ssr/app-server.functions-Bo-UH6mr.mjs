import { n as createServerFn, r as getRequest, t as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { _ as isAdminLogin, b as listEnabledApps, h as getSessionFromRequest, l as env, u as getAdminLogins, x as listPairingRequests, y as isOnboarded } from "./pairing-C0O8oKd7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-server.functions-Bo-UH6mr.js
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
//#endregion
export { fetchAdminAccess_createServerFn_handler, fetchAdminDashboard_createServerFn_handler, fetchHomeData_createServerFn_handler, fetchLoginPageContext_createServerFn_handler, fetchOnboardingGate_createServerFn_handler, fetchPairingRequests_createServerFn_handler, fetchProfileData_createServerFn_handler };

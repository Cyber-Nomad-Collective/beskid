import { isAdminLogin } from "#/server/config-store";
import {
	type AuthSessionPayload,
	getSessionFromRequest,
} from "#/server/session";

export async function requireHubAdmin(
	request: Request,
): Promise<AuthSessionPayload | null> {
	const session = await getSessionFromRequest(request);
	if (!session) return null;
	const isAdmin = await isAdminLogin(session.login);
	if (!isAdmin) return null;
	return session;
}

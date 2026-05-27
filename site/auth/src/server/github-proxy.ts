import { jwtVerify } from "jose";

import { AUTH_HUB_ISSUER, type AuthAppId } from "@beskid/auth-client";

import { getServiceTokenForApp } from "#/server/repositories/paired-apps";
import { getGithubTokenForSession } from "#/server/repositories/user-sessions";

const GITHUB_API = "https://api.github.com";
const BLOCKED_REQUEST_HEADERS = new Set([
	"host",
	"connection",
	"content-length",
	"authorization",
	"cookie",
	"transfer-encoding",
]);
const BLOCKED_RESPONSE_HEADERS = new Set([
	"transfer-encoding",
	"connection",
	"content-encoding",
]);

function serviceKey(secret: string): Uint8Array {
	return new TextEncoder().encode(secret);
}

async function resolveHubUserSession(
	hubUserToken: string,
): Promise<{ appId: AuthAppId; sessionId: string } | null> {
	let appId: string | undefined;
	let sessionId: string | undefined;

	try {
		const unverified = JSON.parse(
			Buffer.from(hubUserToken.split(".")[1] ?? "", "base64url").toString(
				"utf8",
			),
		) as { app?: string; sid?: string };
		appId = unverified.app;
		sessionId = unverified.sid;
	} catch {
		return null;
	}

	if (!appId || !sessionId) return null;
	const serviceToken = getServiceTokenForApp(appId);
	if (!serviceToken) return null;

	try {
		const { payload } = await jwtVerify(hubUserToken, serviceKey(serviceToken), {
			issuer: AUTH_HUB_ISSUER,
			algorithms: ["HS256"],
		});
		if (typeof payload.app !== "string" || typeof payload.sid !== "string") {
			return null;
		}
		return { appId: payload.app as AuthAppId, sessionId: payload.sid };
	} catch {
		return null;
	}
}

export async function proxyGitHubApi(
	incoming: Request,
	githubPath: string,
): Promise<Response> {
	const authHeader = incoming.headers.get("authorization") ?? "";
	const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
	if (!match) {
		return Response.json({ error: "Missing hub user token" }, { status: 401 });
	}

	const resolved = await resolveHubUserSession(match[1]!);
	if (!resolved) {
		return Response.json({ error: "Invalid hub user token" }, { status: 401 });
	}

	const githubToken = getGithubTokenForSession(resolved.sessionId);
	if (!githubToken) {
		return Response.json({ error: "Session expired" }, { status: 401 });
	}

	const path = githubPath.replace(/^\//, "");
	const target = new URL(path, `${GITHUB_API}/`);
	const incomingUrl = new URL(incoming.url);
	incomingUrl.searchParams.forEach((value, key) => {
		target.searchParams.set(key, value);
	});

	const forwardHeaders = new Headers();
	for (const [key, value] of incoming.headers) {
		const lower = key.toLowerCase();
		if (BLOCKED_REQUEST_HEADERS.has(lower)) continue;
		forwardHeaders.append(key, value);
	}
	forwardHeaders.set("Authorization", `Bearer ${githubToken}`);
	forwardHeaders.set("Accept", forwardHeaders.get("Accept") ?? "application/vnd.github+json");
	forwardHeaders.set("X-GitHub-Api-Version", "2022-11-28");
	forwardHeaders.set("User-Agent", "beskid-auth-hub-github-proxy");

	const body =
		incoming.method === "GET" || incoming.method === "HEAD"
			? undefined
			: await incoming.arrayBuffer();

	const githubResponse = await fetch(target.toString(), {
		method: incoming.method,
		headers: forwardHeaders,
		body,
		redirect: "manual",
	});

	const outHeaders = new Headers();
	for (const [key, value] of githubResponse.headers) {
		if (BLOCKED_RESPONSE_HEADERS.has(key.toLowerCase())) continue;
		outHeaders.append(key, value);
	}

	return new Response(githubResponse.body, {
		status: githubResponse.status,
		statusText: githubResponse.statusText,
		headers: outHeaders,
	});
}

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface SpecAuthCredentials {
	provider: "github";
	login: string;
	token: string;
	scopes: string[];
	createdAt: string;
}

const CONFIG_DIR = path.join(os.homedir(), ".config", "beskid", "spec");
const CREDENTIALS_FILE = path.join(CONFIG_DIR, "credentials.json");

export function credentialsPath(): string {
	return CREDENTIALS_FILE;
}

export function loadCredentials(): SpecAuthCredentials | null {
	if (!fs.existsSync(CREDENTIALS_FILE)) return null;
	try {
		return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf8")) as SpecAuthCredentials;
	} catch {
		return null;
	}
}

export function saveCredentials(credentials: SpecAuthCredentials): void {
	fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
	fs.writeFileSync(
		CREDENTIALS_FILE,
		`${JSON.stringify(credentials, null, 2)}\n`,
		{ mode: 0o600 },
	);
}

export function clearCredentials(): void {
	if (fs.existsSync(CREDENTIALS_FILE)) {
		fs.unlinkSync(CREDENTIALS_FILE);
	}
}

export async function loginWithToken(token: string): Promise<SpecAuthCredentials> {
	const response = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github+json",
			"User-Agent": "beskid-spec-cli",
		},
	});
	if (!response.ok) {
		throw new Error(`GitHub authentication failed (${response.status})`);
	}
	const user = (await response.json()) as { login?: string };
	if (!user.login) {
		throw new Error("GitHub response missing login");
	}

	const credentials: SpecAuthCredentials = {
		provider: "github",
		login: user.login,
		token,
		scopes: ["repo"],
		createdAt: new Date().toISOString(),
	};
	saveCredentials(credentials);
	return credentials;
}

export async function loginWithDeviceFlow(): Promise<SpecAuthCredentials> {
	const clientId = process.env.SPEC_GITHUB_OAUTH_CLIENT_ID;
	if (!clientId) {
		throw new Error(
			"Set SPEC_GITHUB_OAUTH_CLIENT_ID or run: spec auth login --token <ghp_...>",
		);
	}

	const deviceResponse = await fetch(
		"https://github.com/login/device/code",
		{
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				client_id: clientId,
				scope: "repo",
			}),
		},
	);
	if (!deviceResponse.ok) {
		throw new Error(`Device flow init failed (${deviceResponse.status})`);
	}
	const device = (await deviceResponse.json()) as {
		device_code: string;
		user_code: string;
		verification_uri: string;
		interval?: number;
	};

	console.log(`Open ${device.verification_uri} and enter code ${device.user_code}`);

	const intervalMs = (device.interval ?? 5) * 1000;
	while (true) {
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
		const tokenResponse = await fetch(
			"https://github.com/login/oauth/access_token",
			{
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					client_id: clientId,
					device_code: device.device_code,
					grant_type: "urn:ietf:params:oauth:grant-type:device_code",
				}),
			},
		);
		const tokenPayload = (await tokenResponse.json()) as {
			error?: string;
			access_token?: string;
		};
		if (tokenPayload.error === "authorization_pending") continue;
		if (tokenPayload.error) {
			throw new Error(`Device flow failed: ${tokenPayload.error}`);
		}
		if (!tokenPayload.access_token) {
			throw new Error("Device flow did not return access_token");
		}
		return loginWithToken(tokenPayload.access_token);
	}
}

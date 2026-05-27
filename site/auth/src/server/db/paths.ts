import path from "node:path";

import { env } from "#/env";

export function authDataDir(): string {
	return env.AUTH_DATA_DIR?.trim() || path.join(process.cwd(), "data/runtime");
}

export function authDbPath(): string {
	return path.join(authDataDir(), "auth.sqlite");
}

export function legacyConfigPath(): string {
	return path.join(authDataDir(), "auth-config.json");
}

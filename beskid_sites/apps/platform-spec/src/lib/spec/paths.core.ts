// Pure path helpers shared by the server runtime and the standalone seed
// scripts. This module must stay free of `@tanstack/react-start/server-only`
// (and any server-only import) so it can run under the Node seed runner.

import path from "node:path";

const DEFAULT_DATA_DIR = "data/runtime";
const DEFAULT_SEED_DIR = "seed";

export function resolvePlatformSpecDataDir(
	env: NodeJS.ProcessEnv = process.env,
): string {
	const configured = env.PLATFORM_SPEC_DATA_DIR?.trim();
	const base = configured || DEFAULT_DATA_DIR;
	return path.isAbsolute(base) ? base : path.resolve(process.cwd(), base);
}

export function settingsDbPathIn(dataDir: string): string {
	return path.join(dataDir, "platform-spec.sqlite");
}

export function resolveSeedDir(env: NodeJS.ProcessEnv = process.env): string {
	const configured = env.PLATFORM_SPEC_SEED_DIR?.trim();
	const base = configured || DEFAULT_SEED_DIR;
	return path.isAbsolute(base) ? base : path.resolve(process.cwd(), base);
}

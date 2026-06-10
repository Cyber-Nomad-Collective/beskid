import "@tanstack/react-start/server-only";

import fs from "node:fs";
import path from "node:path";

const DEFAULT_DATA_DIR = "data/runtime";

export function platformSpecDataDir(): string {
	const configured = process.env.PLATFORM_SPEC_DATA_DIR?.trim();
	const base = configured || DEFAULT_DATA_DIR;
	return path.isAbsolute(base) ? base : path.resolve(process.cwd(), base);
}

export function settingsDbPath(): string {
	return path.join(platformSpecDataDir(), "platform-spec.sqlite");
}

export function ensurePlatformSpecDataDir(): void {
	fs.mkdirSync(platformSpecDataDir(), { recursive: true });
}

export function localContentRoot(): string {
	const localWorkspace = process.env.SPEC_LOCAL_WORKSPACE?.trim();
	if (localWorkspace) {
		return path.isAbsolute(localWorkspace)
			? localWorkspace
			: path.resolve(process.cwd(), localWorkspace);
	}
	return path.resolve(process.cwd(), "content/docs/platform-spec");
}

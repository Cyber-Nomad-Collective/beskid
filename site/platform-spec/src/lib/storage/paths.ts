import "@tanstack/react-start/server-only";

import fs from "node:fs";

import {
	resolvePlatformSpecDataDir,
	settingsDbPathIn,
} from "#/lib/spec/paths.core";

export function platformSpecDataDir(): string {
	return resolvePlatformSpecDataDir();
}

export function settingsDbPath(): string {
	return settingsDbPathIn(platformSpecDataDir());
}

export function ensurePlatformSpecDataDir(): void {
	fs.mkdirSync(platformSpecDataDir(), { recursive: true });
}

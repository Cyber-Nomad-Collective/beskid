import "@tanstack/react-start/server-only";

import fs from "node:fs";
import path from "node:path";

const DEFAULT_DATA_DIR = "data/runtime";

export function trackerDataDir(): string {
	const configured = process.env.TRACKER_DATA_DIR?.trim();
	const base = configured || DEFAULT_DATA_DIR;
	return path.isAbsolute(base) ? base : path.resolve(process.cwd(), base);
}

export function issuesDbPath(): string {
	return path.join(trackerDataDir(), "issues.sqlite");
}

export function ensureTrackerDataDir(): void {
	fs.mkdirSync(trackerDataDir(), { recursive: true });
}

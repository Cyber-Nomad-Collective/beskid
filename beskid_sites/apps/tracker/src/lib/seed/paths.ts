import "@tanstack/react-start/server-only";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../..",
);

export const SEED_DATA_ROOT = path.join(packageRoot, "data");

export function seedVersionDir(versionId: string): string {
	return path.join(SEED_DATA_ROOT, versionId);
}

export function listSeedVersionIds(): string[] {
	if (!fs.existsSync(SEED_DATA_ROOT)) return [];
	return fs
		.readdirSync(SEED_DATA_ROOT, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && /^v\d+\.\d+$/.test(entry.name))
		.map((entry) => entry.name)
		.sort();
}

export function readJsonFile<T>(filePath: string): T {
	const raw = fs.readFileSync(filePath, "utf8");
	return JSON.parse(raw) as T;
}

export function listEntityJsonFiles(
	versionId: string,
	entityDir: string,
): string[] {
	const dir = path.join(seedVersionDir(versionId), entityDir);
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.filter((name) => name.endsWith(".json"))
		.map((name) => path.join(dir, name))
		.sort();
}

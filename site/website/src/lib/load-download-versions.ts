import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { fetchLatestDelivery, type LatestDelivery } from "./tracker-delivery";

export interface VersionPayload {
	version: string;
	source: string;
}

export interface CliVersionPayload extends VersionPayload {
	downloadTag?: string;
	latestTag?: string;
	releasePageUrl?: string;
	latestReleasePageUrl?: string;
}

export interface VscodeExtensionVersionPayload extends VersionPayload {
	installTarget?: string;
}

/** Astro/Vite may bundle this module; `import.meta.url` then no longer sits under `site/website`. */
function resolveWebsiteRoot(): string {
	const env = process.env.BESKID_WEBSITE_ROOT?.trim();
	if (env) {
		return join(env);
	}
	const cwd = process.cwd();
	const cwdPkg = join(cwd, "package.json");
	if (existsSync(cwdPkg)) {
		try {
			const pkg = JSON.parse(readFileSync(cwdPkg, "utf8")) as { name?: string };
			if (pkg.name === "beskid-website") {
				return cwd;
			}
		} catch {
			/* fall through */
		}
	}
	return join(fileURLToPath(new URL(".", import.meta.url)), "../..");
}

const websiteRoot = resolveWebsiteRoot();
const dataDir = join(websiteRoot, "src", "data");
const vscodePkgPath = join(
	websiteRoot,
	"..",
	"..",
	"beskid_vscode",
	"package.json",
);
const cliCargoPath = join(
	websiteRoot,
	"..",
	"..",
	"compiler",
	"crates",
	"beskid_cli",
	"Cargo.toml",
);

const GITHUB_REPO = "Cyber-Nomad-Collective/beskid_compiler";
const DEFAULT_LATEST_TAG = "cli-latest";

function readJsonVersion<T extends VersionPayload>(fileName: string): T | null {
	const path = join(dataDir, fileName);
	if (!existsSync(path)) {
		return null;
	}
	try {
		return JSON.parse(readFileSync(path, "utf8")) as T;
	} catch {
		return null;
	}
}

function readVscodePackageVersion(): VersionPayload | null {
	if (!existsSync(vscodePkgPath)) {
		return null;
	}
	try {
		const data = JSON.parse(readFileSync(vscodePkgPath, "utf8")) as {
			version?: unknown;
		};
		const version = typeof data.version === "string" ? data.version.trim() : "";
		if (!version) {
			return null;
		}
		return { version, source: "local" };
	} catch {
		return null;
	}
}

function readCliCargoVersion(): CliVersionPayload | null {
	if (!existsSync(cliCargoPath)) {
		return null;
	}
	try {
		const text = readFileSync(cliCargoPath, "utf8");
		const match = text.match(/^version\s*=\s*"([^"]+)"/m);
		if (!match?.[1]) {
			return null;
		}
		const version = match[1].trim();
		return {
			version,
			source: "local",
			downloadTag: `cli-v${version}`,
			latestTag: DEFAULT_LATEST_TAG,
			releasePageUrl: `https://github.com/${GITHUB_REPO}/releases/tag/cli-v${version}`,
			latestReleasePageUrl: `https://github.com/${GITHUB_REPO}/releases/tag/${DEFAULT_LATEST_TAG}`,
		};
	} catch {
		return null;
	}
}

export function loadCliVersion(): CliVersionPayload {
	return (
		readJsonVersion<CliVersionPayload>("cli-version.json") ??
		readCliCargoVersion() ?? {
			version: "latest",
			source: "fallback",
			downloadTag: DEFAULT_LATEST_TAG,
			latestTag: DEFAULT_LATEST_TAG,
			releasePageUrl: `https://github.com/${GITHUB_REPO}/releases/tag/${DEFAULT_LATEST_TAG}`,
			latestReleasePageUrl: `https://github.com/${GITHUB_REPO}/releases/tag/${DEFAULT_LATEST_TAG}`,
		}
	);
}

/**
 * The Tracker is authoritative for the public delivery label, while compiler
 * release metadata remains authoritative for binary asset URLs.
 */
export async function loadTrackerDelivery(): Promise<LatestDelivery | null> {
	if (!process.env.BESKID_TRACKER_API_URL?.trim()) return null;
	return fetchLatestDelivery().catch(() => null);
}

export function cliDownloadBase(cli: CliVersionPayload): string {
	const tag =
		cli.downloadTag?.trim() || cli.latestTag?.trim() || DEFAULT_LATEST_TAG;
	return `https://github.com/${GITHUB_REPO}/releases/download/${tag}`;
}

export function cliPackageUrls(cli: CliVersionPayload): Record<string, string> {
	const base = cliDownloadBase(cli);
	const version = cli.version;
	return {
		"linux-amd64-deb": `${base}/beskid-${version}-amd64.deb`,
		"windows-amd64-msi": `${base}/beskid-${version}-windows-amd64.msi`,
		"windows-amd64-exe": `${base}/beskid-${version}-windows-amd64.exe`,
		"macos-arm64-dmg": `${base}/beskid-${version}-macos-arm64.dmg`,
		"linux-amd64": `${base}/beskid-linux-amd64`,
		"darwin-arm64": `${base}/beskid-darwin-arm64`,
		"windows-amd64": `${base}/beskid-windows-amd64.exe`,
	};
}

export function loadVscodeExtensionVersion(): VscodeExtensionVersionPayload {
	return (
		readJsonVersion<VscodeExtensionVersionPayload>("vscode-extension.json") ??
		readVscodePackageVersion() ?? { version: "latest", source: "fallback" }
	);
}

export function vscodeInstallCommand(
	vscode: VscodeExtensionVersionPayload,
): string {
	const target = vscode.installTarget?.trim() || vscode.version.trim();
	if (!target || target === "latest") {
		return "code --install-extension beskid.beskid-vscode";
	}
	return `code --install-extension beskid.beskid-vscode@${target}`;
}

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

const websiteRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const dataDir = join(websiteRoot, 'src', 'data');
const vscodePkgPath = join(websiteRoot, '..', '..', 'beskid_vscode', 'package.json');
const cliCargoPath = join(websiteRoot, '..', '..', 'compiler', 'crates', 'beskid_cli', 'Cargo.toml');

const GITHUB_REPO = 'Cyber-Nomad-Collective/beskid_compiler';
const DEFAULT_LATEST_TAG = 'cli-latest';

function readJsonVersion<T extends VersionPayload>(fileName: string): T | null {
	const path = join(dataDir, fileName);
	if (!existsSync(path)) {
		return null;
	}
	try {
		return JSON.parse(readFileSync(path, 'utf8')) as T;
	} catch {
		return null;
	}
}

function readVscodePackageVersion(): VersionPayload | null {
	if (!existsSync(vscodePkgPath)) {
		return null;
	}
	try {
		const data = JSON.parse(readFileSync(vscodePkgPath, 'utf8')) as { version?: unknown };
		const version = typeof data.version === 'string' ? data.version.trim() : '';
		if (!version) {
			return null;
		}
		return { version, source: 'local' };
	} catch {
		return null;
	}
}

function readCliCargoVersion(): CliVersionPayload | null {
	if (!existsSync(cliCargoPath)) {
		return null;
	}
	try {
		const text = readFileSync(cliCargoPath, 'utf8');
		const match = text.match(/^version\s*=\s*"([^"]+)"/m);
		if (!match?.[1]) {
			return null;
		}
		const version = match[1].trim();
		return {
			version,
			source: 'local',
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
		readJsonVersion<CliVersionPayload>('cli-version.json') ??
		readCliCargoVersion() ?? {
			version: 'latest',
			source: 'fallback',
			downloadTag: DEFAULT_LATEST_TAG,
			latestTag: DEFAULT_LATEST_TAG,
			releasePageUrl: `https://github.com/${GITHUB_REPO}/releases/tag/${DEFAULT_LATEST_TAG}`,
			latestReleasePageUrl: `https://github.com/${GITHUB_REPO}/releases/tag/${DEFAULT_LATEST_TAG}`,
		}
	);
}

export function cliDownloadBase(cli: CliVersionPayload): string {
	const tag = cli.downloadTag?.trim() || cli.latestTag?.trim() || DEFAULT_LATEST_TAG;
	return `https://github.com/${GITHUB_REPO}/releases/download/${tag}`;
}

export function loadVscodeExtensionVersion(): VscodeExtensionVersionPayload {
	return (
		readJsonVersion<VscodeExtensionVersionPayload>('vscode-extension.json') ??
		readVscodePackageVersion() ?? { version: 'latest', source: 'fallback' }
	);
}

export function vscodeInstallCommand(vscode: VscodeExtensionVersionPayload): string {
	const target = vscode.installTarget?.trim() || vscode.version.trim();
	if (!target || target === 'latest') {
		return 'code --install-extension beskid.beskid-vscode';
	}
	return `code --install-extension beskid.beskid-vscode@${target}`;
}

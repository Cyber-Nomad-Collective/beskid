import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface VersionPayload {
	version: string;
	source: string;
}

const websiteRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const dataDir = join(websiteRoot, 'src', 'data');
const vscodePkgPath = join(websiteRoot, '..', '..', 'beskid_vscode', 'package.json');
const cliCargoPath = join(websiteRoot, '..', '..', 'compiler', 'crates', 'beskid_cli', 'Cargo.toml');

function readJsonVersion(fileName: string): VersionPayload | null {
	const path = join(dataDir, fileName);
	if (!existsSync(path)) {
		return null;
	}
	try {
		const data = JSON.parse(readFileSync(path, 'utf8')) as { version?: unknown; source?: unknown };
		const version = typeof data.version === 'string' ? data.version.trim() : '';
		if (!version) {
			return null;
		}
		const source = typeof data.source === 'string' ? data.source.trim() : 'unknown';
		return { version, source };
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

function readCliCargoVersion(): VersionPayload | null {
	if (!existsSync(cliCargoPath)) {
		return null;
	}
	try {
		const text = readFileSync(cliCargoPath, 'utf8');
		const match = text.match(/^version\s*=\s*"([^"]+)"/m);
		if (!match?.[1]) {
			return null;
		}
		return { version: match[1].trim(), source: 'local' };
	} catch {
		return null;
	}
}

export function loadCliVersion(): VersionPayload {
	return (
		readJsonVersion('cli-version.json') ??
		readCliCargoVersion() ?? { version: 'latest', source: 'fallback' }
	);
}

export function loadVscodeExtensionVersion(): VersionPayload {
	return (
		readJsonVersion('vscode-extension.json') ??
		readVscodePackageVersion() ?? { version: 'latest', source: 'fallback' }
	);
}

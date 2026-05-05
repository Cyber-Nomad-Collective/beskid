import path from 'node:path';
import type { VerifyStep } from './types';

export type VerifyPreset = 'ci' | 'beskid-prebuild';

export type VerifyRoots = {
	pkgRoot: string;
	layoutVerifyTs: string;
	tsxCli: string;
};

function script(pkgRoot: string, name: string): string {
	return path.join(pkgRoot, 'scripts', name);
}

/** Ordered steps for `trudoc verify` presets (cwd = Starlight site root). */
export function stepsForPreset(preset: VerifyPreset, roots: VerifyRoots): VerifyStep[] {
	const ci: VerifyStep[] = [
		{ cmd: process.execPath, args: [script(roots.pkgRoot, 'verify-platform-spec-frontmatter.mjs')] },
		{ cmd: process.execPath, args: [roots.tsxCli, roots.layoutVerifyTs] },
	];

	if (preset === 'ci') return ci;

	return [
		...ci,
		{ cmd: process.execPath, args: [script(roots.pkgRoot, 'verify-graph-frontmatter.mjs')] },
		{ cmd: process.execPath, args: [script(roots.pkgRoot, 'verify-language-meta-related-links.mjs')] },
		{ cmd: process.execPath, args: [script(roots.pkgRoot, 'verify-platform-spec-git-meta.mjs')] },
	];
}

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

/** Platform-spec structure only (frontmatter, layout tree, graph metadata, link conventions). */
const structureSteps = (roots: VerifyRoots): VerifyStep[] => [
	{ cmd: process.execPath, args: [script(roots.pkgRoot, 'verify-platform-spec-frontmatter.mjs')] },
	{ cmd: process.execPath, args: [roots.tsxCli, roots.layoutVerifyTs] },
	{ cmd: process.execPath, args: [script(roots.pkgRoot, 'verify-graph-frontmatter.mjs')] },
	{ cmd: process.execPath, args: [script(roots.pkgRoot, 'verify-language-meta-related-links.mjs')] },
];

/** Content depth gates (warn-only in CI until corpus cleanup). */
const contentStep = (roots: VerifyRoots, warnOnly: boolean): VerifyStep => ({
	cmd: process.execPath,
	args: [script(roots.pkgRoot, 'verify-platform-spec-content.mjs'), ...(warnOnly ? ['--warn-only'] : [])],
});

/** Ordered steps for `trudoc verify` presets (cwd = Starlight site root). */
export function stepsForPreset(preset: VerifyPreset, roots: VerifyRoots): VerifyStep[] {
	if (preset === 'beskid-prebuild') {
		console.warn(
			'trudoc: preset "beskid-prebuild" is deprecated; use "ci" (structure + warn-only content gates).',
		);
	}
	return [...structureSteps(roots), contentStep(roots, true)];
}

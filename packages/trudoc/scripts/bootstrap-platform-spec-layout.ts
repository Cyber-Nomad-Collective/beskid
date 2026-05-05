#!/usr/bin/env node
/**
 * Writes `layout.json` for every platform-spec hub (`index.mdx`) and feature-level defaults for articles.
 * Re-run after adding hubs; then `pnpm verify:platform-spec-layout` must pass.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
	extractBodySignals,
	getPresetBase,
	classifyPlatformSpecRel,
	filePathToDocSlug,
	inferDefaultPreset,
	walkMarkdownFiles,
	type LayoutContractFile,
	type LayoutPresetKey,
	type PathClass,
} from 'trudoc/layout';

import { getWebsiteRoot } from './lib/website-root.ts';

const siteRoot = getWebsiteRoot(import.meta.url);
const docsRoot = path.join(siteRoot, 'src', 'content', 'docs');
const specRoot = path.join(docsRoot, 'platform-spec');

function parseDomainTiles(body: string): { pathPrefix: string; heading: string } | null {
	const pp = body.match(/pathPrefix=["']([^"']+)["']/);
	if (!pp) return null;
	const hd = body.match(/heading=["']([^"']+)["']/);
	return { pathPrefix: pp[1], heading: hd?.[1] ?? 'Explore' };
}

function presetForClass(c: PathClass, body: string, sig: ReturnType<typeof extractBodySignals>): LayoutPresetKey {
	if (c === 'domain-root') return 'root-default';
	if (c === 'domain') return 'domain-default';
	if (c === 'area') return sig.specSectionIds.size >= 2 ? 'area-default' : 'area-sparse';
	if (c === 'feature') return inferDefaultPreset('feature', body);
	return 'feature-hub-default';
}

function minSpecRelax(presetKey: LayoutPresetKey, nBodySections: number): number | undefined {
	const p = getPresetBase(presetKey);
	const want = p.minSpecSections;
	if (want == null) return undefined;
	return Math.min(want, nBodySections);
}

function minMarkdownRelax(presetKey: LayoutPresetKey, nH2: number): number | undefined {
	const p = getPresetBase(presetKey);
	const want = p.minMarkdownHeadings;
	if (want == null) return undefined;
	return Math.min(want, nH2);
}

function writeJson(file: string, data: unknown) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function main() {
	const files = walkMarkdownFiles(specRoot);
	for (const abs of files) {
		const relFromDocs = path.relative(docsRoot, abs).split(path.sep).join('/');
		if (!relFromDocs.startsWith('platform-spec/')) continue;
		if (!/\/index\.mdx$/i.test(relFromDocs)) continue;

		const cls = classifyPlatformSpecRel(relFromDocs.slice('platform-spec/'.length));
		if (cls === 'legacy-or-bridge' || cls === 'component' || cls === 'article') continue;

		const body = fs.readFileSync(abs, 'utf8');
		const slug = filePathToDocSlug(abs, docsRoot);
		const sig = extractBodySignals(body);
		const presetKey = presetForClass(cls, body, sig);
		const tiles = parseDomainTiles(body);

		const layout: LayoutContractFile = {
			version: 1,
			level:
				cls === 'domain-root'
					? 'root'
					: cls === 'domain'
						? 'domain'
						: cls === 'area'
							? 'area'
							: 'feature',
			extends: presetKey,
			pathPrefix: slug,
			minSpecSections: minSpecRelax(presetKey, sig.specSectionIds.size),
			minMarkdownHeadings:
				cls === 'domain-root' ? minMarkdownRelax(presetKey, sig.markdownH2.length) : undefined,
		};

		if (tiles) {
			layout.widgets = [{ type: 'domainTiles', props: { pathPrefix: tiles.pathPrefix, heading: tiles.heading } }];
		}

		if (cls === 'feature') {
			layout.articleDefaults = { extends: 'article-default' };
		}

		const outPath = path.join(path.dirname(abs), 'layout.json');
		writeJson(outPath, layout);
		console.log(`wrote ${path.relative(siteRoot, outPath)}`);
	}
}

main();

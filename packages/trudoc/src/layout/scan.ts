import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LayoutContractFile, LayoutLevel, LayoutPresetKey, LayoutTreeNode } from './schema';
import { effectiveLayoutSchema, parseLayoutContractJson } from './schema';
import { mergeArticleDefaults, mergeLayoutContract, toEffectiveLayout } from './merge';
import { defaultArticleDefaultsForFeature, getPresetBase } from './presets';

const SPEC_SEGMENT = `${path.sep}src${path.sep}content${path.sep}docs${path.sep}platform-spec`;

export type PathClass =
	| 'domain-root'
	| 'domain'
	| 'area'
	| 'feature'
	| 'article'
	| 'component'
	| 'legacy-or-bridge';

export function classifyPlatformSpecRel(relPosix: string): PathClass {
	const segments = relPosix.split('/').filter(Boolean);
	const base = segments.at(-1)?.replace(/\.(md|mdx)$/i, '') ?? '';
	const isIndex = base === 'index';

	if (segments.length === 1 && isIndex) return 'domain-root';
	if (segments.length === 2 && isIndex) return 'domain';
	if (segments.length === 3 && isIndex) return 'area';
	if (segments.length === 4 && isIndex) return 'feature';
	/** Article leaves: any non-`index` page at feature depth (e.g. …/feature/article.mdx). */
	if (segments.length >= 4 && !isIndex) return 'article';
	return 'legacy-or-bridge';
}

export function filePathToDocSlug(absFile: string, docsRoot: string): string {
	const rel = path.relative(docsRoot, absFile).split(path.sep).join('/');
	return rel
		.replace(/\.(md|mdx)$/i, '')
		.replace(/\/index$/, '');
}

function readJsonIfExists(file: string): unknown | null {
	if (!fs.existsSync(file)) return null;
	const raw = fs.readFileSync(file, 'utf8');
	return JSON.parse(raw);
}

function levelForClass(c: PathClass): LayoutLevel {
	switch (c) {
		case 'domain-root':
			return 'root';
		case 'domain':
			return 'domain';
		case 'area':
			return 'area';
		case 'feature':
			return 'feature';
		case 'article':
			return 'article';
		case 'component':
			return 'component';
		default:
			return 'feature';
	}
}

export function inferDefaultPreset(c: PathClass, rawBody: string): LayoutPresetKey {
	if (c === 'domain-root') return 'root-default';
	if (c === 'domain') return 'domain-default';
	if (c === 'area') return 'area-default';
	if (c === 'article') return 'article-default';
	if (c === 'feature') {
		if (rawBody.includes('id="what-this-feature-specifies"') || rawBody.includes("id='what-this-feature-specifies'")) {
			return 'feature-contract-default';
		}
		if (
			rawBody.includes('id="features"') ||
			rawBody.includes("id='features'") ||
			rawBody.includes('id="feature-index"') ||
			rawBody.includes("id='feature-index'")
		) {
			return 'feature-area-hub-default';
		}
		return 'feature-hub-default';
	}
	if (c === 'component') return 'feature-hub-default';
	return 'feature-hub-default';
}

function loadLayoutOrThrow(layoutPath: string): LayoutContractFile {
	const raw = readJsonIfExists(layoutPath);
	if (raw === null) {
		throw new Error(`Missing layout.json: ${layoutPath}`);
	}
	return parseLayoutContractJson(raw, layoutPath);
}

function safeReadFile(p: string): string {
	try {
		return fs.readFileSync(p, 'utf8');
	} catch {
		return '';
	}
}

export function walkMarkdownFiles(dir: string): string[] {
	const out: string[] = [];
	if (!fs.existsSync(dir)) return out;
	for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, name.name);
		if (name.isDirectory()) out.push(...walkMarkdownFiles(p));
		else if (/\.(md|mdx)$/i.test(name.name)) out.push(p);
	}
	return out;
}

/**
 * Build merged layout tree for everything under `platform-spec/`.
 * Expects each structural node to have `layout.json` (and optional `<stem>.layout.json` for articles).
 */
export function buildLayoutTree(siteRoot: string): LayoutTreeNode[] {
	const docsRoot = path.join(siteRoot, 'src', 'content', 'docs');
	const specRoot = path.join(docsRoot, 'platform-spec');
	const files = walkMarkdownFiles(specRoot);
	const nodes: LayoutTreeNode[] = [];

	/** featureDir -> merged feature layout + preset used (needed for article defaults). */
	const featureLayoutCache = new Map<string, { merged: LayoutContractFile; preset: LayoutPresetKey }>();

	for (const abs of files) {
		const relFromDocs = path.relative(docsRoot, abs).split(path.sep).join('/');
		if (!relFromDocs.startsWith('platform-spec/')) continue;

		const cls = classifyPlatformSpecRel(relFromDocs.slice('platform-spec/'.length));
		if (cls === 'legacy-or-bridge' || cls === 'component') continue;

		const slug = filePathToDocSlug(abs, docsRoot);
		const body = safeReadFile(abs);
		const level = levelForClass(cls);

		if (cls === 'article') {
			const dir = path.dirname(abs);
			const stem = path.basename(abs).replace(/\.(md|mdx)$/i, '');
			const featureLayoutPath = path.join(dir, 'layout.json');
			const sidecar = path.join(dir, `${stem}.layout.json`);

			let featureMerged: LayoutContractFile;
			let fpreset: LayoutPresetKey;
			const cached = featureLayoutCache.get(dir);
			if (cached) {
				featureMerged = cached.merged;
				fpreset = cached.preset;
			} else {
				const fl = loadLayoutOrThrow(featureLayoutPath);
				fpreset = fl.extends ?? inferDefaultPreset('feature', safeReadFile(path.join(dir, 'index.mdx')));
				featureMerged = mergeLayoutContract(fl, { presetFromExtends: fpreset });
				featureLayoutCache.set(dir, { merged: featureMerged, preset: fpreset });
			}

			const ad = mergeArticleDefaults(
				defaultArticleDefaultsForFeature(fpreset),
				featureMerged.articleDefaults,
			);

			const adPartial: Partial<LayoutContractFile> = {
				sections: ad.sections,
				minSpecSections: ad.minSpecSections,
				minMarkdownHeadings: ad.minMarkdownHeadings,
				widgets: ad.widgets,
				documentStructure: ad.documentStructure,
			};
			const presetKey = ad.extends ?? 'article-default';
			const baseArticle = mergeLayoutContract(
				{ version: 1, level: 'article', ...adPartial } as LayoutContractFile,
				{ presetFromExtends: presetKey },
			);

			let finalMerged = baseArticle;
			let layoutPath: string | null = null;
			if (fs.existsSync(sidecar)) {
				layoutPath = sidecar;
				const side = loadLayoutOrThrow(sidecar);
				finalMerged = mergeLayoutContract(side, {
					parent: baseArticle,
					presetFromExtends: side.extends,
				});
			}

			const effective = effectiveLayoutSchema.parse(toEffectiveLayout(finalMerged));
			nodes.push({
				slug,
				contentPath: relFromDocs,
				level: 'article',
				layoutPath,
				rawLayout: fs.existsSync(sidecar)
					? parseLayoutContractJson(JSON.parse(fs.readFileSync(sidecar, 'utf8')), sidecar)
					: undefined,
				effective,
			});
			continue;
		}

		const dir = path.dirname(abs);
		const layoutPath = path.join(dir, 'layout.json');
		const rawLayout = loadLayoutOrThrow(layoutPath);
		const inferred = inferDefaultPreset(cls, body);
		const preset = rawLayout.extends ?? inferred;
		const merged = mergeLayoutContract(rawLayout, { presetFromExtends: preset });

		if (cls === 'feature') {
			const fp = rawLayout.extends ?? inferDefaultPreset(cls, body);
			featureLayoutCache.set(dir, { merged, preset: fp });
		}

		const effective = effectiveLayoutSchema.parse(toEffectiveLayout(merged));
		nodes.push({
			slug,
			contentPath: relFromDocs,
			level,
			layoutPath,
			rawLayout,
			effective,
		});
	}

	return nodes.sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Resolve Starlight / docs `siteRoot` (directory containing `src/content`).
 * - If `BESKID_WEBSITE_ROOT` is set → that absolute path (highest priority).
 * - Site scripts under `…/scripts/` → parent of `scripts` (e.g. `site/website`).
 * - Trudoc CLI under `…/trudoc/…/cli/` → `process.cwd()` (run CLI with cwd = site root, or use `--site-root`).
 */
export function resolveSiteRoot(fromImportMetaUrl: string): string {
	const env = process.env.BESKID_WEBSITE_ROOT?.trim();
	if (env) return path.resolve(env);
	const scriptDir = path.dirname(fileURLToPath(fromImportMetaUrl));
	const base = path.basename(scriptDir);
	if (base === 'scripts') {
		return path.dirname(scriptDir);
	}
	if (base === 'cli') {
		return process.cwd();
	}
	return process.cwd();
}

import type { AstroIntegration } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDocAreaHtmlAttrsDevPlugin } from './integration/html-data-attrs-dev';

export type { TrudocHtmlDataAttrsOptions } from './integration/html-data-attrs-options';
import type { TrudocHtmlDataAttrsOptions } from './integration/html-data-attrs-options';

export type TrudocIntegrationOptions = {
	/** Extra remark plugins appended after any already configured on the site. */
	remarkPlugins?: unknown[];
	/** Post-build HTML augmentation for `<html>` data attributes (set `false` to disable). */
	htmlDataAttrs?: TrudocHtmlDataAttrsOptions | TrudocHtmlDataAttrsOptions[] | false;
};

function normalizeHtmlDataAttrs(
	cfg: TrudocHtmlDataAttrsOptions | TrudocHtmlDataAttrsOptions[] | false | undefined,
): TrudocHtmlDataAttrsOptions[] {
	if (cfg === false || cfg == null) return [];
	return Array.isArray(cfg) ? cfg : [cfg];
}

async function tagBuiltHtml(root: string, cfg: TrudocHtmlDataAttrsOptions) {
	const segmentRoot = path.join(root, cfg.htmlSubdir);
	try {
		await fs.access(segmentRoot);
	} catch {
		return;
	}

	const mapRel = cfg.mapIndexHtmlRel ?? `${cfg.htmlSubdir}/index.html`;

	const walk = async (d: string) => {
		for (const name of await fs.readdir(d)) {
			const full = path.join(d, name);
			const st = await fs.stat(full);
			if (st.isDirectory()) await walk(full);
			else if (name.endsWith('.html')) {
				let html = await fs.readFile(full, 'utf8');
				const rel = path.relative(root, full).replace(/\\/g, '/');
				const isMapIndex = Boolean(cfg.mapAttr && rel === mapRel);
				const htmlOpen = html.match(/<html[^>]*>/)?.[0] ?? '';

				if (!htmlOpen.includes(cfg.docAttr) && html.includes('<html')) {
					html = html.replace('<html', `<html ${cfg.docAttr}`);
				}
				if (isMapIndex && cfg.mapAttr) {
					const openAfter = html.match(/<html[^>]*>/)?.[0] ?? '';
					if (!openAfter.includes(cfg.mapAttr) && html.includes('<html')) {
						html = html.replace('<html', `<html ${cfg.mapAttr}`);
					}
				}
				await fs.writeFile(full, html, 'utf8');
			}
		}
	};

	await walk(segmentRoot);
}

/**
 * Astro integration: optional remark plugin merge + post-build HTML `data-*` tagging
 * (workaround when Starlight ignores overridden `Page.astro`).
 */
export default function trudoc(options: TrudocIntegrationOptions = {}): AstroIntegration {
	const htmlConfigs = normalizeHtmlDataAttrs(options.htmlDataAttrs);

	return {
		name: 'trudoc',
		hooks: {
			'astro:config:setup': ({ updateConfig, config }) => {
				const extra = options.remarkPlugins;
				const vitePlugins = htmlConfigs.map((c) => createDocAreaHtmlAttrsDevPlugin(c));
				const md = (config.markdown ?? {}) as { remarkPlugins?: object[] };
				if (!vitePlugins.length && !extra?.length) return;
				updateConfig({
					...(vitePlugins.length ? { vite: { plugins: vitePlugins as never[] } } : {}),
					...(extra?.length
						? {
								markdown: {
									remarkPlugins: [...(md.remarkPlugins ?? []), ...(extra as object[])],
								},
							}
						: {}),
				});
			},
			'astro:build:done': async ({ dir }) => {
				if (!htmlConfigs.length) return;
				const root = fileURLToPath(dir);
				for (const cfg of htmlConfigs) {
					await tagBuiltHtml(root, cfg);
				}
			},
		},
	};
}

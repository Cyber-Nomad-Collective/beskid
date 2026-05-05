import type { AstroIntegration } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type TrudocHtmlDataAttrsOptions = {
	/** Subdirectory under the build output (e.g. `platform-spec`). */
	htmlSubdir: string;
	/** Attribute injected on `<html>` for all pages under `htmlSubdir` (e.g. `data-platform-spec`). */
	docAttr: string;
	/** Optional: built HTML path relative to output root for the “map” index page. */
	mapIndexHtmlRel?: string;
	/** Optional: second attribute for the map index (e.g. `data-platform-spec-map`). */
	mapAttr?: string;
};

export type TrudocIntegrationOptions = {
	/** Extra remark plugins appended after any already configured on the site. */
	remarkPlugins?: unknown[];
	/** Post-build HTML augmentation for `<html>` data attributes (set `false` to disable). */
	htmlDataAttrs?: TrudocHtmlDataAttrsOptions | false;
};

/**
 * Astro integration: optional remark plugin merge + post-build HTML `data-*` tagging
 * (workaround when Starlight ignores overridden `Page.astro`).
 */
export default function trudoc(options: TrudocIntegrationOptions = {}): AstroIntegration {
	return {
		name: 'trudoc',
		hooks: {
			'astro:config:setup': ({ updateConfig, config }) => {
				const extra = options.remarkPlugins;
				if (!extra?.length) return;
				const md = (config.markdown ?? {}) as { remarkPlugins?: object[] };
				updateConfig({
					markdown: {
						remarkPlugins: [...(md.remarkPlugins ?? []), ...(extra as object[])],
					},
				});
			},
			'astro:build:done': async ({ dir }) => {
				const cfg = options.htmlDataAttrs;
				if (cfg === false || cfg == null) return;

				const root = fileURLToPath(dir);
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
							/** Only inspect the opening `<html …>` tag — body may mention the same string. */
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
			},
		},
	};
}

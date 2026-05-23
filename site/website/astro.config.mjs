// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import embeds from 'astro-embed/integration';
import mermaid from 'astro-mermaid';
import { docsShellCustomCss } from '@beskid/docs-ui/shell-css';
import trudoc from 'trudoc/integration';
import { createRemarkArchCodeFence } from 'trudoc/scripts/remark-arch-code-fence.mjs';
import { remarkInlineRepoPaths } from 'trudoc/scripts/remark-inline-repo-paths.mjs';
import { remarkRepoLinkFence } from 'trudoc/scripts/remark-repo-link-fence.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const docsUiRoot = path.resolve(__dirname, '../../packages/beskid-docs-ui');
const docsRoot = path.resolve(__dirname, 'src/content/docs');
const legacyBridgeRoot = path.resolve(__dirname, 'src/legacy-bridge');

/** Old language-meta URLs used a `v0-1` segment; features now live directly under each area. */
function platformSpecV0Redirects() {
	const areas = {
		composition: ['dependency-injection'],
		conformance: ['glossary-and-conformance'],
		'contracts-and-effects': ['contracts', 'error-handling', 'testing'],
		evaluation: ['control-flow', 'events', 'lambdas-and-closures'],
		interop: ['ffi-and-extern'],
		'memory-model': ['memory-and-references'],
		metaprogramming: ['metaprogramming'],
		'program-structure': ['modules-and-visibility', 'name-resolution'],
		'surface-syntax': ['documentation-comments', 'lexical-and-syntax'],
		'type-system': ['enums-and-match', 'method-dispatch', 'type-inference', 'types'],
	};
	/** @type {Record<string, string>} */
	const out = {};
	for (const [area, feats] of Object.entries(areas)) {
		const base = `/platform-spec/language-meta/${area}`;
		const oldTrack = `${base}/v0-1`;
		out[redirectKey(oldTrack)] = redirectKey(base);
		for (const f of feats) {
			out[redirectKey(`${oldTrack}/${f}`)] = redirectKey(`${base}/${f}`);
		}
	}
	return out;
}

/** Compiler Mods area and Mod host bridge feature were renamed from metaprogramming-mod-sdk / meta-block-host-bridge. */
function compilerModsRedirects() {
	const oldArea = '/platform-spec/compiler/metaprogramming-mod-sdk';
	const newArea = '/platform-spec/compiler/compiler-mods';
	const contentRoot = path.resolve(__dirname, 'src/content/docs/platform-spec/compiler/compiler-mods');
	/** @type {Record<string, string>} */
	const out = {
		[redirectKey(oldArea)]: redirectKey(newArea),
		[redirectKey(`${oldArea}/meta-block-host-bridge`)]: redirectKey(`${newArea}/mod-host-bridge`),
		[redirectKey(`${newArea}/meta-block-host-bridge`)]: redirectKey(`${newArea}/mod-host-bridge`),
	};

	/** @param {string} fromPrefix @param {string} toPrefix @param {string} dir */
	function addPageRedirects(fromPrefix, toPrefix, dir) {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const segment = `${fromPrefix}/${entry.name}`;
			const targetSegment = `${toPrefix}/${entry.name}`;
			if (entry.isDirectory()) {
				out[redirectKey(segment)] = redirectKey(targetSegment);
				addPageRedirects(segment, targetSegment, path.join(dir, entry.name));
				continue;
			}

			if (!entry.name.endsWith('.mdx') || entry.name === 'index.mdx') {
				continue;
			}

			const page = entry.name.replace(/\.mdx$/, '');
			out[redirectKey(`${segment}/${page}`)] = redirectKey(`${targetSegment}/${page}`);
		}
	}

	for (const entry of fs.readdirSync(contentRoot, { withFileTypes: true })) {
		if (!entry.isDirectory()) {
			continue;
		}

		const feature = entry.name;
		const featureDir = path.join(contentRoot, feature);
		out[redirectKey(`${oldArea}/${feature}`)] = redirectKey(`${newArea}/${feature}`);
		addPageRedirects(`${oldArea}/${feature}`, `${newArea}/${feature}`, featureDir);
		if (feature === 'mod-host-bridge') {
			out[redirectKey(`${oldArea}/meta-block-host-bridge`)] = redirectKey(`${newArea}/mod-host-bridge`);
			addPageRedirects(`${oldArea}/meta-block-host-bridge`, `${newArea}/mod-host-bridge`, featureDir);
		}
	}

	return out;
}

/** One redirect key per route (trailingSlash: 'always' — no `/path` and `/path/` pairs). */
function redirectKey(routePrefix) {
	return routePrefix.endsWith('/') ? routePrefix : `${routePrefix}/`;
}

/** @param {string} dir @param {string} fromPrefix @param {string} toPrefix */
function addMarkdownRedirects(dir, fromPrefix, toPrefix) {
	/** @type {Record<string, string>} */
	const out = {};
	if (!fs.existsSync(dir)) return out;

	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			Object.assign(out, addMarkdownRedirects(full, `${fromPrefix}/${entry.name}`, `${toPrefix}/${entry.name}`));
			continue;
		}
		if (!/\.(md|mdx)$/i.test(entry.name)) continue;
		const base = entry.name.replace(/\.(md|mdx)$/i, '');
		if (base === 'index' || base.toLowerCase() === 'readme') {
			out[redirectKey(fromPrefix)] = redirectKey(toPrefix);
			continue;
		}
		out[redirectKey(`${fromPrefix}/${base}`)] = redirectKey(`${toPrefix}/${base}`);
	}
	return out;
}

function siteRedirects() {
	/** @type {Record<string, string>} */
	const out = {
		[redirectKey('/overview')]: redirectKey('/'),
		[redirectKey('/guides')]: redirectKey('/book/reference/cli'),
	};

	const refRoot = path.join(docsRoot, 'book', 'reference');
	Object.assign(out, addMarkdownRedirects(refRoot, '/guides', '/book/reference'));

	const legacyTarget = redirectKey('/platform-spec/legacy-spec-mapping');
	for (const legacy of ['execution', 'corelib', 'packages', 'api']) {
		const legacyDir = path.join(legacyBridgeRoot, legacy);
		if (!fs.existsSync(legacyDir)) continue;
		Object.assign(
			out,
			addMarkdownRedirects(legacyDir, `/${legacy}`, legacyTarget),
		);
		out[redirectKey(`/${legacy}`)] = legacyTarget;
	}

	return out;
}

// https://astro.build/config
export default defineConfig({
	site: 'https://beskid-lang.org',
	trailingSlash: 'always',
	vite: {
		server: {
			fs: {
				allow: [repoRoot, docsUiRoot],
			},
		},
		ssr: {
			noExternal: ['@beskid/docs-ui', 'trudoc'],
		},
	},
	redirects: {
		...platformSpecV0Redirects(),
		...compilerModsRedirects(),
		...siteRedirects(),
	},
	markdown: {
		remarkPlugins: [
			createRemarkArchCodeFence(),
			remarkRepoLinkFence({ repo: 'Cyber-Nomad-Collective/beskid' }),
			remarkInlineRepoPaths({ repo: 'Cyber-Nomad-Collective/beskid' }),
		],
		shikiConfig: {
			langAlias: {
				beskid: 'rust',
				Beskid: 'rust',
			},
		},
	},
	integrations: [
		mermaid({
			autoTheme: true,
		}),
		embeds({
			services: {
				LinkPreview: false,
			},
		}),
		trudoc({
			htmlDataAttrs: [
				{
					htmlSubdir: 'platform-spec',
					docAttr: 'data-platform-spec',
				},
				{
					htmlSubdir: 'book',
					docAttr: 'data-book',
				},
			],
		}),
		starlight({
			title: 'Beskid',
			description: 'Beskid language docs and specification.',
			editLink: {
				baseUrl: 'https://github.com/Cyber-Nomad-Collective/beskid/edit/main/site/website/',
			},
			components: {
				Head: '@beskid/docs-ui/starlight/Head.astro',
				Header: '@beskid/docs-ui/starlight/Header.astro',
				Footer: '@beskid/docs-ui/starlight/Footer.astro',
				ThemeSelect: '@beskid/docs-ui/starlight/ThemeSelect.astro',
				Sidebar: '@beskid/docs-ui/starlight/Sidebar.astro',
				Banner: '@beskid/docs-ui/starlight/Banner.astro',
				Page: '@beskid/docs-ui/starlight/Page.astro',
			},
			customCss: docsShellCustomCss,
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Cyber-Nomad-Collective/beskid' }],
			sidebar: [],
		}),
	],
});

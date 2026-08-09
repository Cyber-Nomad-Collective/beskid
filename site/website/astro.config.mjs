// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import embeds from 'astro-embed/integration';
import mermaid from 'astro-mermaid';
import { docsShellCustomCss } from '@beskid/beskid-ui/shell-css';
import trudoc from 'trudoc/integration';
import { createRemarkArchCodeFence } from 'trudoc/scripts/remark-arch-code-fence.mjs';
import { remarkInlineRepoPaths } from 'trudoc/scripts/remark-inline-repo-paths.mjs';
import { remarkRepoLinkFence } from 'trudoc/scripts/remark-repo-link-fence.mjs';
import { loadBeskidGrammar } from 'trudoc/grammars/load-beskid-grammar.mjs';
import { beskidUiRoot } from './src/lib/beskid-ui-root.mjs';
import { remarkBeskidDirectives } from './src/lib/remark-beskid-directives.mjs';

const beskidGrammar = loadBeskidGrammar();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const docsRoot = path.resolve(__dirname, 'src/content/docs');

/** One redirect key per route (trailingSlash: 'always' — no `/path` and `/path/` pairs). */
/** @param {string} routePrefix */
function redirectKey(routePrefix) {
	return routePrefix.endsWith('/') ? routePrefix : `${routePrefix}/`;
}

const PLATFORM_SPEC_ORIGIN = 'https://spec.beskid-lang.org';

/**
 * Static catch-all redirect: every /platform-spec/* URL (including book
 * internal links to /platform-spec/...) 301s to the React app at
 * spec.beskid-lang.org. The Astro site no longer hosts platform-spec content.
 * Previously this walked the MDX tree; now it's a single wildcard.
 */
/** @type {import('astro').AstroUserConfig['redirects']} */
  const platformSpecRedirects = {
  	[redirectKey('/platform-spec')]: {
		status: /** @type {const} */ (301),
  		destination: `${PLATFORM_SPEC_ORIGIN}/platform-spec/`,
  	},
};

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
		const base = entry.name.replace(/\.(mdx|md)$/i, '');
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

	/**
	 * Legacy bridge URLs (/execution, /corelib, /api, /packages) and common
	 * lowercase aliases — static 301s to the legacy spec mapping hub.
	 * The legacy-bridge content tree is deleted; these redirects preserve
	 * old bookmarks at zero file-dependency cost.
	 */
	const legacyTarget =
		'https://spec.beskid-lang.org/platform-spec/legacy-spec-mapping/';
	for (const legacy of ['execution', 'corelib', 'packages', 'api']) {
		out[redirectKey(`/${legacy}`)] = legacyTarget;
	}

	const legacyAliases = [
		['/corelib/system/error', legacyTarget],
		['/corelib/system/input', legacyTarget],
		['/corelib/system/output', legacyTarget],
		['/corelib/core/results', legacyTarget],
		['/corelib/core/error-handling', legacyTarget],
	];
	for (const [from, to] of legacyAliases) {
		out[redirectKey(from)] = to;
	}

	return out;
}

// https://astro.build/config
export default defineConfig({
	site: 'https://beskid-lang.org',
	trailingSlash: 'always',
	vite: {
		resolve: {
			dedupe: ['react', 'react-dom'],
		},
		esbuild: {
			jsx: 'automatic',
			jsxImportSource: 'react',
		},
		server: {
			fs: {
				allow: [repoRoot, beskidUiRoot],
			},
		},
		ssr: {
			noExternal: ['@beskid/beskid-ui', '@beskid/ui-react', 'trudoc'],
		},
	},
	redirects: {
		...platformSpecRedirects,
		...siteRedirects(),
	},
	markdown: {
		remarkPlugins: [
			remarkBeskidDirectives,
			createRemarkArchCodeFence(),
			remarkRepoLinkFence({ repo: 'Cyber-Nomad-Collective/beskid' }),
			remarkInlineRepoPaths({ repo: 'Cyber-Nomad-Collective/beskid' }),
		],
		shikiConfig: {
			langs: /** @type {any} */ ([beskidGrammar]),
			langAlias: {
				beskid: 'beskid',
				Beskid: 'beskid',
				bd: 'beskid',
			},
		},
	},
	integrations: [
		react(),
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
					htmlSubdir: 'book',
					docAttr: 'data-book',
				},
			],
		}),
		starlight({
			expressiveCode: {
				shiki: {
					langs: /** @type {any} */ (beskidGrammar),
					langAlias: {
						bd: 'beskid',
					},
				},
			},
			title: 'Beskid',
			description: 'Beskid language docs and specification.',
			editLink: {
				baseUrl: 'https://github.com/Cyber-Nomad-Collective/beskid/edit/main/site/website/',
			},
			components: {
				PageTitle: './src/components/starlight/BlogAwarePageTitle.astro',
				Head: '@beskid/beskid-ui/starlight/Head.astro',
				Header: '@beskid/beskid-ui/starlight/Header.astro',
				Footer: '@beskid/beskid-ui/starlight/Footer.astro',
				ThemeSelect: '@beskid/beskid-ui/starlight/ThemeSelect.astro',
				Sidebar: '@beskid/beskid-ui/starlight/Sidebar.astro',
				Banner: '@beskid/beskid-ui/starlight/Banner.astro',
  			},
			customCss: docsShellCustomCss,
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Cyber-Nomad-Collective/beskid' }],
			sidebar: [],
		}),
	],
});

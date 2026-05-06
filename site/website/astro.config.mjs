// @ts-check
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { docsShellCustomCss } from '@beskid/docs-ui/shell-css';
import trudoc from 'trudoc/integration';
import { createRemarkArchCodeFence } from 'trudoc/scripts/remark-arch-code-fence.mjs';
import { remarkRepoLinkFence } from 'trudoc/scripts/remark-repo-link-fence.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const docsUiRoot = path.resolve(__dirname, '../../packages/beskid-docs-ui');

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
		out[oldTrack] = `${base}/`;
		for (const f of feats) {
			out[`${oldTrack}/${f}`] = `${base}/${f}/`;
		}
	}
	return out;
}

// https://astro.build/config
export default defineConfig({
	site: 'https://beskid-lang.org',
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
	},
	markdown: {
		remarkPlugins: [createRemarkArchCodeFence(), remarkRepoLinkFence({ repo: 'Cyber-Nomad-Collective/beskid' })],
		shikiConfig: {
			langAlias: {
				beskid: 'rust',
				Beskid: 'rust',
			},
		},
	},
	integrations: [
		trudoc({
			htmlDataAttrs: {
				htmlSubdir: 'platform-spec',
				docAttr: 'data-platform-spec',
				mapIndexHtmlRel: 'platform-spec/index.html',
				mapAttr: 'data-platform-spec-map',
			},
		}),
		starlight({
			title: 'Beskid',
			description: 'Beskid language docs and specification.',
			components: {
				Header: '@beskid/docs-ui/starlight/Header.astro',
				Footer: '@beskid/docs-ui/starlight/Footer.astro',
				ThemeSelect: '@beskid/docs-ui/starlight/ThemeSelect.astro',
			},
			customCss: docsShellCustomCss,
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Cyber-Nomad-Collective/beskid' }],
			sidebar: [
				{
					label: 'The Beskid Book',
					items: [
						{ label: 'Introduction', link: 'book' },
						{ label: '01. Tooling and Editors', link: 'book/01-tooling-and-editors' },
						{ label: '02. Projects and Targets', link: 'book/02-projects-and-targets' },
						{ label: '03. Modules and Files', link: 'book/03-modules-and-files' },
						{ label: '04. Imports and Names', link: 'book/04-imports-and-names' },
						{ label: '05. Workspaces and Monorepos', link: 'book/05-workspaces-and-monorepos' },
						{ label: '06. Public API Idioms', link: 'book/06-public-api-idioms' },
						{ label: '07. Documentation comments', link: 'book/07-documentation-comments' },
						{ label: 'Appendix: Spec Map', link: 'book/appendix-spec-map' },
					],
				},
				{
					label: 'Platform specification',
					autogenerate: { directory: 'platform-spec' },
				},
				{
					label: 'Execution',
					autogenerate: { directory: 'execution' },
				},
				{
					label: 'Corelib',
					autogenerate: { directory: 'corelib' },
				},
				{
					label: 'Packages',
					autogenerate: { directory: 'packages' },
				},
				{
					label: 'API Reference',
					autogenerate: { directory: 'api' },
				},
				{
					label: 'Guides',
					autogenerate: { directory: 'guides' },
				},
			],
		}),
	],
});

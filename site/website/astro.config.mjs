// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://beskid-lang.org',
	markdown: {
		shikiConfig: {
			langAlias: {
				beskid: 'rust',
				Beskid: 'rust',
			},
		},
	},
	integrations: [
		starlight({
			title: 'Beskid',
			description: 'Beskid language docs and specification.',
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
						{ label: 'Appendix: Spec Map', link: 'book/appendix-spec-map' },
					],
				},
				{
					label: 'Language Spec',
					autogenerate: { directory: 'spec' },
				},
				{
					label: 'Execution',
					autogenerate: { directory: 'execution' },
				},
				{
					label: 'Standard Library',
					autogenerate: { directory: 'standard-library' },
				},
				{
					label: 'Packages',
					autogenerate: { directory: 'packages' },
				},
				{
					label: 'Guides',
					autogenerate: { directory: 'guides' },
				},
			],
		}),
	],
});

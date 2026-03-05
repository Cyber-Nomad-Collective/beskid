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
					label: 'Guides',
					autogenerate: { directory: 'guides' },
				},
			],
		}),
	],
});

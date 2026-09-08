import type { DocsNavigationGroup } from '@beskid/beskid-ui/docs/docs-navigation';

export const docsNavigation: DocsNavigationGroup[] = [
	{
		label: 'Beskid Docs',
		items: [
			{ label: 'Overview', link: '/docs/' },
			{
				label: 'Start',
				items: [
					{ label: 'Overview', link: '/docs/getting-started/' },
					{ label: 'Install Beskid', link: '/docs/getting-started/install/' },
					{ label: 'Write and check a program', link: '/docs/getting-started/first-program/' },
				],
			},
			{
				label: 'Develop',
				items: [
					{ label: 'Tooling', link: '/docs/tooling/' },
					{ label: 'Projects', link: '/docs/projects/' },
				],
			},
			{
				label: 'Publish',
				items: [
					{ label: 'Packages', link: '/docs/packages/' },
				],
			},
			{
				label: 'Contribute',
				items: [
					{ label: 'Write Beskid documentation', link: '/docs/contributing/documentation/' },
					{ label: 'Use ASD-STE100', link: '/docs/contributing/ste-100/' },
				],
			},
			{
				label: 'Reference',
				items: [
					{ label: 'Beskid Standard', link: '/docs/standard/' },
					{ label: 'The Beskid Book', link: '/book/' },
				],
			},
		],
	},
];

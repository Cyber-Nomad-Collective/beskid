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
					{ label: 'Write and run a program', link: '/docs/getting-started/first-program/' },
					{ label: 'Connect VS Code', link: '/docs/getting-started/editor/' },
					{ label: 'Troubleshoot the first day', link: '/docs/getting-started/troubleshooting/' },
				],
			},
			{
				label: 'Develop',
				items: [
					{ label: 'Tooling', link: '/docs/tooling/' },
					{ label: 'Build, run, and test', link: '/docs/tooling/build-run-test/' },
					{ label: 'Run Beskid in CI', link: '/docs/tooling/ci/' },
					{ label: 'Language basics', link: '/docs/language-basics/' },
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

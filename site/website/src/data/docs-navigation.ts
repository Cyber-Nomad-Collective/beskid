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
					{ label: 'Create a project', link: '/docs/projects/create/' },
					{ label: 'Use a workspace', link: '/docs/projects/workspaces/' },
					{ label: 'Dependencies and locks', link: '/docs/projects/dependencies-and-locks/' },
				],
			},
			{
				label: 'Publish',
				items: [
					{ label: 'Packages', link: '/docs/packages/' },
					{ label: 'Publish a package', link: '/docs/packages/publish/' },
					{ label: 'Consume a package', link: '/docs/packages/consume/' },
					{ label: 'Credentials and recovery', link: '/docs/packages/credentials-and-recovery/' },
				],
			},
			{
				label: 'Operate',
				items: [
					{ label: 'Services', link: '/docs/services/' },
					{ label: 'Authentication', link: '/docs/services/authentication/' },
					{ label: 'Learn', link: '/docs/services/learn/' },
					{ label: 'pckg', link: '/docs/services/pckg/' },
					{ label: 'Tracker', link: '/docs/services/tracker/' },
					{ label: 'Nexus', link: '/docs/services/nexus/' },
					{ label: 'Operations', link: '/docs/operations/' },
					{ label: 'Containers', link: '/docs/operations/containers/' },
					{ label: 'Deploy and roll back', link: '/docs/operations/deployment/' },
					{ label: 'Health and monitoring', link: '/docs/operations/health-and-monitoring/' },
				],
			},
			{
				label: 'Contribute',
				items: [
					{ label: 'Contribution paths', link: '/docs/contributing/' },
					{ label: 'Set up the repository', link: '/docs/contributing/repository/' },
					{ label: 'Change the Standard', link: '/docs/contributing/standard-changes/' },
					{ label: 'Write Beskid documentation', link: '/docs/contributing/documentation/' },
					{ label: 'Use ASD-STE100', link: '/docs/contributing/ste-100/' },
				],
			},
			{
				label: 'Reference',
				items: [
					{ label: 'Reference map', link: '/docs/reference/' },
					{ label: 'Licensing', link: '/docs/reference/licensing/' },
					{ label: 'Beskid Standard', link: '/docs/standard/' },
					{ label: 'The Beskid Book', link: '/book/' },
				],
			},
		],
	},
];

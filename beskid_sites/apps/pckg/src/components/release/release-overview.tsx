import {
	Badge,
	buttonVariants,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@cyber-nomad-collective/beskid-ui-react";
import { Link } from "@tanstack/react-router";
import {
	ArrowRight,
	BookOpen,
	ExternalLink,
	KeyRound,
	Package,
	Tags,
} from "lucide-react";
import type { ReactNode } from "react";
import { ReleaseOverviewSkeleton } from "#/components/loading-skeletons";
import { pckgApi } from "#/lib/api";
import { formatDateTime } from "#/lib/format";
import { CopyButton } from "./copy-button";
import {
	CodeBlock,
	PUBLISH_GUIDE_URL,
	REGISTRY_ORIGIN,
	type ReleaseCenterApi,
	ReleaseErrorState,
	ReleasePage,
	ReleasePageHeader,
} from "./release-page";
import { useMyReleases } from "./use-my-releases";

const RECENT_LIMIT = 6;

/**
 * The CLI release recipe (`beskid pckg` in `beskid_pckg/src/cli/arguments.rs`;
 * the public guide is {@link PUBLISH_GUIDE_URL}). The registry has no
 * browser upload: artifacts always go through `pack` and `upload`.
 */
const PUBLISH_STEPS: Array<{
	title: string;
	detail: ReactNode;
	command: string;
}> = [
	{
		title: "Save a publish-scoped key",
		detail: (
			<>
				Create one under{" "}
				<Link to="/dashboard/release/keys" className="underline">
					API keys
				</Link>
				. The CLI reads it from{" "}
				<code className="font-mono text-xs">.beskid/pckg/repositories.json</code>.
				In CI, export it as{" "}
				<code className="font-mono text-xs">BESKID_PCKG_API_KEY</code> instead.
			</>
		),
		command: "beskid pckg configure --api-key <your key>",
	},
	{
		title: "Check who the registry sees",
		detail: "Confirms the key without printing it.",
		command: "beskid pckg whoami",
	},
	{
		title: "Pack the artifact",
		detail: (
			<>
				Builds the <code className="font-mono text-xs">.bpk</code> and, for
				libraries, generates the API docs that pckg renders. Omit{" "}
				<code className="font-mono text-xs">--version</code> to take the next patch.
			</>
		),
		command:
			"beskid pckg pack --package <Name> --version <x.y.z> --source . --output ./dist/<Name>-<x.y.z>.bpk",
	},
	{
		title: "Upload the release",
		detail:
			"The version comes from the packed package.json. Package and version coordinates are immutable; publish a new version instead of replacing bytes.",
		command: "beskid pckg upload <Name> --artifact ./dist/<Name>-<x.y.z>.bpk",
	},
];

const QUICK_LINKS = [
	{
		to: "/dashboard/release/keys",
		icon: KeyRound,
		title: "API keys",
		description: "Create, inspect and revoke CLI credentials.",
	},
	{
		to: "/dashboard/release/versions",
		icon: Tags,
		title: "Releases",
		description: "Every published version; yank or unyank.",
	},
	{
		to: "/dashboard/my-packages",
		icon: Package,
		title: "My packages",
		description: "Packages you own and their public pages.",
	},
] as const;

/** Release center landing: publish workflow, recent releases and quick links. */
export function ReleaseOverview({ api = pckgApi }: { api?: ReleaseCenterApi }) {
	const { releases, isPending, error, refetch } = useMyReleases(api);
	const recent = releases.slice(0, RECENT_LIMIT);

	return (
		<ReleasePage>
			<ReleasePageHeader
				title="Overview"
				description={`Releases go through the beskid CLI against ${REGISTRY_ORIGIN}; the browser manages credentials and release status and never uploads artifacts.`}
				actions={
					<a
						href={PUBLISH_GUIDE_URL}
						target="_blank"
						rel="noreferrer"
						className={buttonVariants({ variant: "outline" })}
					>
						<BookOpen data-icon="inline-start" />
						Publishing guide
						<ExternalLink data-icon="inline-end" />
					</a>
				}
			/>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
				<Card>
					<CardHeader>
						<CardTitle>Publish a release</CardTitle>
						<CardDescription>
							From the package directory, with the beskid CLI installed. A first
							release also needs the package record; the guide shows the{" "}
							<code className="font-mono text-xs">POST /api/packages</code> call.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ol className="space-y-5">
							{PUBLISH_STEPS.map((step, index) => (
								<li key={step.title} className="flex gap-3">
									<span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs">
										{index + 1}
									</span>
									<div className="min-w-0 flex-1 space-y-2">
										<p className="font-medium">{step.title}</p>
										<p className="text-sm text-muted-foreground">{step.detail}</p>
										<div className="flex flex-wrap items-start gap-2">
											<CodeBlock className="min-w-0 flex-1">{step.command}</CodeBlock>
											<CopyButton value={step.command} label="Copy" className="shrink-0" />
										</div>
									</div>
								</li>
							))}
						</ol>
					</CardContent>
				</Card>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Recent releases</CardTitle>
							<CardDescription>Latest versions across your packages.</CardDescription>
						</CardHeader>
						<CardContent>
							{isPending ? (
								<ReleaseOverviewSkeleton rows={3} />
							) : error ? (
								<ReleaseErrorState
									title="Could not load recent releases"
									error={error}
									onRetry={refetch}
								/>
							) : recent.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No releases yet. Your first upload appears here.
								</p>
							) : (
								<ul className="divide-y divide-border">
									{recent.map((release) => (
										<li
											key={release.id}
											className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
										>
											<span className="min-w-0">
												<Link
													to="/packages/$name"
													params={{ name: release.packageName }}
													className="font-medium hover:underline"
												>
													{release.packageName}
												</Link>{" "}
												<code className="font-mono text-xs">{release.version}</code>
											</span>
											<span className="flex items-center gap-2 text-xs text-muted-foreground">
												<time dateTime={release.publishedAtUtc}>
													{formatDateTime(release.publishedAtUtc)}
												</time>
												{release.isYanked ? (
													<Badge variant="secondary">Yanked</Badge>
												) : null}
											</span>
										</li>
									))}
								</ul>
							)}
							<Link
								to="/dashboard/release/versions"
								className="mt-3 inline-flex items-center gap-1 text-sm underline"
							>
								All releases
								<ArrowRight className="size-3.5" />
							</Link>
						</CardContent>
					</Card>

					<nav aria-label="Release center sections" className="grid gap-3">
						{QUICK_LINKS.map((link) => {
							const Icon = link.icon;
							return (
								<Link
									key={link.to}
									to={link.to}
									className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted"
								>
									<Icon className="size-5 shrink-0 text-muted-foreground" />
									<span className="min-w-0 flex-1">
										<span className="block font-medium">{link.title}</span>
										<span className="block text-xs text-muted-foreground">
											{link.description}
										</span>
									</span>
									<ArrowRight className="size-4 shrink-0 text-muted-foreground" />
								</Link>
							);
						})}
					</nav>
				</div>
			</div>
		</ReleasePage>
	);
}

import { Link } from "@tanstack/react-router";
import { CircleDot } from "lucide-react";

import { GitHubRateLimitAlert } from "#/components/github-rate-limit-alert";
import { MarkdownContent } from "#/components/markdown-content";
import {
	Timeline,
	TimelineDot,
	TimelineItem,
} from "#/components/reui/timeline";
import { RoadmapStatWidgets } from "#/components/roadmap-stat-widgets";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import type { AuthUser } from "#/lib/github/types";
import type { RoadmapCatalog } from "#/lib/roadmap/types";
import {
	versionStatusBadgeVariant,
	versionStatusLabel,
} from "#/lib/roadmap/version-status";
import type { PublicBugStatsPayload } from "#/server/public-bugs";

interface RoadmapTimelineHomeProps {
	catalog: RoadmapCatalog;
	bugStats: PublicBugStatsPayload;
	user: AuthUser | null;
}

export function RoadmapTimelineHome({
	catalog,
	bugStats,
	user,
}: RoadmapTimelineHomeProps) {
	return (
		<main className="page-wrap roadmap-timeline dashboard-layout py-8">
			<header className="roadmap-timeline__hero mb-10">
				<p className="island-kicker">Delivery roadmap</p>
				<h1 className="display-title mt-2 text-2xl font-bold md:text-3xl">
					Beskid delivery roadmap
				</h1>
				<p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
					Public view of delivery versions, deliverables, and workstreams from the
					planning catalog. Sign in to open the kanban board and manage roadmap
					tasks.
				</p>
				<div className="mt-6 flex flex-wrap gap-2">
					<Button variant="outline" size="sm" asChild>
						<Link to="/bugs">Open bug tracker</Link>
					</Button>
					{user ? (
						<Button size="sm" asChild>
							<Link
								to="/v/$version"
								params={{ version: catalog.activeVersionId }}
								className="text-primary-foreground"
							>
								Open kanban board
							</Link>
						</Button>
					) : (
						<Button size="sm" asChild>
							<Link to="/login" className="text-primary-foreground">
								Sign in to manage roadmap
							</Link>
						</Button>
					)}
				</div>
			</header>

			<GitHubRateLimitAlert
				message={bugStats.rateLimited ? bugStats.message : undefined}
			/>

			<section className="dashboard-section mb-10">
				<h2 className="dashboard-section__title mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
					Program totals
				</h2>
				<RoadmapStatWidgets
					stats={catalog.totals}
					bugStats={
						bugStats.rateLimited
							? undefined
							: { open: bugStats.open, closed: bugStats.closed }
					}
				/>
			</section>

			<section aria-label="Release timeline" className="dashboard-section">
				<h2 className="dashboard-section__title mb-6 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
					Versions
				</h2>
				<Timeline>
					{catalog.versions.map((version) => (
						<TimelineItem key={version.id}>
							<TimelineDot aria-hidden className="text-primary border-primary/40">
								<CircleDot className="size-3.5" />
							</TimelineDot>
							<Card className="dashboard-widget island-shell flex-1">
								<CardHeader className="roadmap-timeline__card-header gap-3 pb-2">
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div>
											<p className="font-mono text-xs text-muted-foreground">
												{version.cutoff.startDate} → {version.cutoff.endDate}
											</p>
											<CardTitle className="mt-1 text-lg">
												<Link
													to="/versions/$version"
													params={{ version: version.id }}
													className="hover:underline"
												>
													{version.id}: {version.title}
												</Link>
											</CardTitle>
										</div>
										<Badge variant={versionStatusBadgeVariant(version.status)}>
											{versionStatusLabel(version.status)}
										</Badge>
									</div>
									<MarkdownContent optional className="text-sm">
										{version.summary}
									</MarkdownContent>
								</CardHeader>
								<CardContent className="space-y-4 pt-0">
									<RoadmapStatWidgets stats={version.stats} compact />
									<div className="flex flex-wrap gap-3 text-sm">
										<Link
											to="/versions/$version"
											params={{ version: version.id }}
											className="text-primary font-medium hover:underline"
										>
											Version dashboard →
										</Link>
										<span className="text-muted-foreground">
											{version.deliverables.length} deliverables ·{" "}
											{version.workstreams.length} workstreams
										</span>
									</div>
								</CardContent>
							</Card>
						</TimelineItem>
					))}
				</Timeline>
			</section>
		</main>
	);
}

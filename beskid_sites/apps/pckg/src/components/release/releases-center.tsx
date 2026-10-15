import { Badge, Button } from "@cyber-nomad-collective/beskid-ui-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@cyber-nomad-collective/beskid-ui-react/ui/alert-dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@cyber-nomad-collective/beskid-ui-react/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@cyber-nomad-collective/beskid-ui-react/ui/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Tags } from "lucide-react";
import { useState } from "react";
import { ReleaseTableSkeleton } from "#/components/loading-skeletons";
import { pckgApi } from "#/lib/api";
import { formatDateTime } from "#/lib/format";
import type { PackageVersionSummary } from "#/lib/pckg-api";
import {
	type ReleaseCenterApi,
	ReleaseErrorState,
	ReleasePage,
	ReleasePageHeader,
} from "./release-page";
import { releaseVersionsQueryKey, useMyReleases } from "./use-my-releases";

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

/**
 * Releases section: every version across the publisher's packages with the
 * yank / unyank lifecycle (the registry's only post-publish mutation).
 */
export function ReleasesCenter({ api = pckgApi }: { api?: ReleaseCenterApi }) {
	const queryClient = useQueryClient();
	const { releases, isPending, error, refetch } = useMyReleases(api);
	const [target, setTarget] = useState<PackageVersionSummary | null>(null);

	return (
		<ReleasePage>
			<ReleasePageHeader
				title="Releases"
				description="Every version you have published, newest first. Yanking hides a version from dependency resolution without deleting its artifact; unyank restores it."
			/>
			{isPending ? (
				<ReleaseTableSkeleton label="Loading releases" />
			) : error ? (
				<ReleaseErrorState
					title="Could not load your releases"
					error={error}
					onRetry={refetch}
				/>
			) : releases.length === 0 ? (
				<Empty className="border border-dashed border-border">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Tags />
						</EmptyMedia>
						<EmptyTitle>No releases yet</EmptyTitle>
						<EmptyDescription>
							Versions you upload with the CLI appear here.
						</EmptyDescription>
					</EmptyHeader>
					<Link to="/dashboard/release" className="text-sm underline">
						How to publish a release
					</Link>
				</Empty>
			) : (
				<ReleaseTable releases={releases} onToggle={setTarget} />
			)}
			<ToggleYankDialog
				target={target}
				onClose={() => setTarget(null)}
				onConfirm={async (release) => {
					if (release.isYanked)
						await api.unyankVersion(release.packageName, release.version);
					else await api.yankVersion(release.packageName, release.version);
					void queryClient.invalidateQueries({
						queryKey: releaseVersionsQueryKey(release.packageName),
					});
					void queryClient.invalidateQueries({ queryKey: ["packages"] });
				}}
			/>
		</ReleasePage>
	);
}

function ReleaseTable({
	releases,
	onToggle,
}: {
	releases: PackageVersionSummary[];
	onToggle: (release: PackageVersionSummary) => void;
}) {
	return (
		<div className="rounded-lg border border-border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Package</TableHead>
						<TableHead>Version</TableHead>
						<TableHead>Published</TableHead>
						<TableHead>Size</TableHead>
						<TableHead>SHA-256</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="text-right">
							<span className="sr-only">Actions</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{releases.map((release) => (
						<TableRow
							key={release.id}
							data-yanked={release.isYanked ? "true" : "false"}
						>
							<TableCell className="font-medium">
								<Link
									to="/packages/$name"
									params={{ name: release.packageName }}
									className="hover:underline"
								>
									{release.packageName}
								</Link>
							</TableCell>
							<TableCell>
								<code className="font-mono text-xs">{release.version}</code>
							</TableCell>
							<TableCell className="whitespace-nowrap text-muted-foreground">
								<time dateTime={release.publishedAtUtc}>
									{formatDateTime(release.publishedAtUtc)}
								</time>
							</TableCell>
							<TableCell className="whitespace-nowrap text-muted-foreground">
								{formatSize(release.sizeBytes)}
							</TableCell>
							<TableCell>
								<code
									className="font-mono text-xs text-muted-foreground"
									title={release.checksumSha256}
								>
									{release.checksumSha256.slice(0, 12)}…
								</code>
							</TableCell>
							<TableCell>
								{release.isYanked ? (
									<Badge variant="secondary">Yanked</Badge>
								) : (
									<Badge>Active</Badge>
								)}
							</TableCell>
							<TableCell className="text-right">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onToggle(release)}
									aria-label={`${release.isYanked ? "Unyank" : "Yank"} ${release.packageName} ${release.version}`}
								>
									{release.isYanked ? "Unyank" : "Yank"}
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

function ToggleYankDialog({
	target,
	onClose,
	onConfirm,
}: {
	target: PackageVersionSummary | null;
	onClose: () => void;
	onConfirm: (release: PackageVersionSummary) => Promise<void>;
}) {
	const toggle = useMutation({
		mutationFn: onConfirm,
		onSuccess: () => onClose(),
	});
	const yanked = target?.isYanked ?? false;
	const coordinate = target ? `${target.packageName} ${target.version}` : "";
	return (
		<AlertDialog
			open={target !== null}
			onOpenChange={(next) => {
				if (!next) {
					toggle.reset();
					onClose();
				}
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{yanked ? "Unyank" : "Yank"} {coordinate}?
					</AlertDialogTitle>
					<AlertDialogDescription>
						{yanked
							? "The version becomes resolvable and downloadable again."
							: "New dependency resolution skips this version and its download link is hidden. Projects that already pinned it keep working; the artifact is not deleted and you can unyank later."}
					</AlertDialogDescription>
				</AlertDialogHeader>
				{toggle.isError ? (
					<p role="alert" className="text-sm text-destructive">
						The registry rejected the change. Reload and try again.
					</p>
				) : null}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={toggle.isPending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant={yanked ? "default" : "destructive"}
						disabled={toggle.isPending}
						onClick={(event) => {
							event.preventDefault();
							if (target) toggle.mutate(target);
						}}
					>
						{toggle.isPending
							? "Working…"
							: yanked
								? "Unyank version"
								: "Yank version"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

import { Badge } from "@cyber-nomad-collective/beskid-ui-react";
import { Link } from "@tanstack/react-router";
import {
	BookOpen,
	FolderTree,
	LayoutTemplate,
	Library,
	Wrench,
} from "lucide-react";
import { formatCount, formatDate } from "#/lib/format";
import { visibleTags } from "#/lib/package-filters";
import type { PackageKind, PackageSummary } from "#/lib/pckg-api";

const KIND = {
	library: { label: "Library", Icon: Library },
	template: { label: "Template", Icon: LayoutTemplate },
	tool: { label: "Tool", Icon: Wrench },
} satisfies Record<PackageKind, { label: string; Icon: typeof Library }>;

/**
 * Compact package rows, registry style (crates.io, NuGet): identity and
 * description on the left, freshness and quick links on the right. Used on
 * `/packages`, publisher profiles and `/dashboard/my-packages`.
 */
export function PackageList({
	items,
	emptyMessage = "No packages match this search.",
	onTagSelect,
}: {
	items: PackageSummary[];
	emptyMessage?: string;
	/** When set, tags become filter buttons instead of plain labels. */
	onTagSelect?: (tag: string) => void;
}) {
	if (items.length === 0) {
		return (
			<p className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
				{emptyMessage}
			</p>
		);
	}
	return (
		<ul className="divide-y divide-border rounded-lg border border-border bg-card">
			{items.map((item) => (
				<PackageRow key={item.id} item={item} onTagSelect={onTagSelect} />
			))}
		</ul>
	);
}

function PackageRow({
	item,
	onTagSelect,
}: {
	item: PackageSummary;
	onTagSelect?: (tag: string) => void;
}) {
	const { label, Icon } = KIND[item.packageKind];
	return (
		<li className="flex flex-wrap gap-x-4 gap-y-2 px-4 py-4 sm:flex-nowrap sm:px-5">
			<span
				aria-hidden="true"
				className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
			>
				<Icon className="size-[18px]" />
			</span>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
					<Link
						to="/packages/$name"
						params={{ name: item.name }}
						className="font-mono text-[15px] font-semibold text-foreground hover:text-primary hover:underline"
					>
						{item.name}
					</Link>
					<Badge variant="secondary">{label}</Badge>
				</div>
				{item.description && (
					<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
						{item.description}
					</p>
				)}
				<div className="mt-2 flex flex-wrap items-center gap-1.5">
					{visibleTags(item).map((tag) =>
						onTagSelect ? (
							<button
								key={tag}
								type="button"
								onClick={() => onTagSelect(tag)}
								className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
							>
								{tag}
							</button>
						) : (
							<span
								key={tag}
								className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
							>
								{tag}
							</span>
						),
					)}
				</div>
			</div>
			{/* Under the text on phones (aligned past the icon), a right column from sm up. */}
			<div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 pl-13 text-xs text-muted-foreground sm:w-auto sm:shrink-0 sm:flex-col sm:flex-nowrap sm:items-end sm:gap-1 sm:pl-0 sm:text-right">
				<span>Updated {formatDate(item.updatedAtUtc)}</span>
				<span className="hidden sm:inline">
					{formatCount(item.totalDownloads)} downloads
				</span>
				<span className="hidden sm:inline">by {item.ownerDisplayName}</span>
				<span className="flex gap-3 text-sm font-medium sm:mt-1">
					{item.packageKind === "library" && (
						<Link
							to="/docs/$package"
							params={{ package: item.name }}
							search={{ version: "", tab: "api", item: "", doc: "" }}
							className="inline-flex items-center gap-1 text-primary hover:underline"
						>
							<BookOpen className="size-3.5" aria-hidden="true" />
							Docs
						</Link>
					)}
					<Link
						to="/packages/$name/files"
						params={{ name: item.name }}
						search={{ version: "", path: "" }}
						className="inline-flex items-center gap-1 text-primary hover:underline"
					>
						<FolderTree className="size-3.5" aria-hidden="true" />
						Files
					</Link>
				</span>
			</div>
		</li>
	);
}

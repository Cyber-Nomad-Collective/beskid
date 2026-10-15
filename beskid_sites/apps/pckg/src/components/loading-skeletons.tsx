import { cn, Skeleton } from "@cyber-nomad-collective/beskid-ui-react";
import type { ReactNode } from "react";

/**
 * Loading placeholders that mirror the layout of each pckg page, so the
 * content swaps in without a jump. Every skeleton is a polite `status`
 * region whose accessible name says what is loading.
 */
function LoadingRegion({
	label,
	className,
	children,
}: {
	label: string;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div role="status" aria-busy="true" aria-label={label} className={className}>
			<span className="sr-only">{label}</span>
			{children}
		</div>
	);
}

const LINE_WIDTHS = ["w-11/12", "w-full", "w-4/5", "w-full", "w-2/3", "w-5/6"];

/** Paragraph-like stack of text lines. */
function TextLines({
	count,
	className,
}: {
	count: number;
	className?: string;
}) {
	return (
		<div className={cn("space-y-2", className)}>
			{Array.from({ length: count }, (_, line) => (
				<Skeleton
					key={line}
					className={cn("h-4 rounded-md", LINE_WIDTHS[line % LINE_WIDTHS.length])}
				/>
			))}
		</div>
	);
}

/** Title block: eyebrow, heading and an optional lead line. */
function HeadingBlock({ lead = true }: { lead?: boolean }) {
	return (
		<div className="space-y-2">
			<Skeleton className="h-4 w-28 rounded-md" />
			<Skeleton className="h-9 w-64 max-w-full rounded-md" />
			{lead && <Skeleton className="h-4 w-96 max-w-full rounded-md" />}
		</div>
	);
}

/** Rows shaped like `PackageList` cards. */
export function PackageListSkeleton({ rows = 4 }: { rows?: number }) {
	return (
		<div className="space-y-2">
			{Array.from({ length: rows }, (_, row) => (
				<Skeleton key={row} className="h-24 w-full" />
			))}
		</div>
	);
}

export function PackageDetailSkeleton() {
	return (
		<LoadingRegion
			label="Loading package"
			className="mx-auto max-w-6xl px-5 py-10"
		>
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-16 rounded-full" />
						<Skeleton className="h-4 w-24 rounded-md" />
					</div>
					<Skeleton className="h-9 w-56 max-w-full rounded-md" />
					<Skeleton className="h-4 w-[28rem] max-w-full rounded-md" />
				</div>
				<div className="flex flex-wrap gap-2">
					<Skeleton className="h-9 w-36 rounded-md" />
					<Skeleton className="h-9 w-32 rounded-md" />
					<Skeleton className="h-9 w-28 rounded-md" />
				</div>
			</div>
			<div className="mt-6 flex flex-wrap gap-2">
				{["w-14", "w-20", "w-16"].map((width) => (
					<Skeleton key={width} className={cn("h-5 rounded-full", width)} />
				))}
			</div>
			<Skeleton className="mt-6 h-28 w-full" />
			<Skeleton className="mt-8 h-6 w-24 rounded-md" />
			<Skeleton className="mt-3 h-48 w-full" />
			<Skeleton className="mt-8 h-6 w-24 rounded-md" />
			<div className="mt-3 space-y-2">
				{[0, 1, 2].map((row) => (
					<Skeleton key={row} className="h-12 w-full rounded-md" />
				))}
			</div>
		</LoadingRegion>
	);
}

/** Body of the docs page below the tab strip. */
export function DocsContentSkeleton() {
	return (
		<LoadingRegion
			label="Loading documentation"
			className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]"
		>
			<div className="space-y-2">
				{[0, 1, 2, 3, 4, 5].map((row) => (
					<Skeleton key={row} className="h-7 w-full rounded-md" />
				))}
			</div>
			<div className="space-y-4 rounded-md border border-border p-6">
				<Skeleton className="h-7 w-48 rounded-md" />
				<TextLines count={6} />
			</div>
		</LoadingRegion>
	);
}

export function DocsPackageSkeleton() {
	return (
		<LoadingRegion
			label="Loading package documentation"
			className="mx-auto max-w-7xl space-y-6 px-5 py-8"
		>
			<div className="flex flex-wrap items-end justify-between gap-4">
				<HeadingBlock />
				<div className="flex items-end gap-3">
					<Skeleton className="h-8 w-28 rounded-md" />
					<Skeleton className="h-10 w-32 rounded-md" />
				</div>
			</div>
			<div className="flex gap-3 border-b border-border pb-2">
				{["w-28", "w-20", "w-20"].map((width) => (
					<Skeleton key={width} className={cn("h-6 rounded-md", width)} />
				))}
			</div>
			<DocsContentSkeleton />
		</LoadingRegion>
	);
}

/** Placeholder for a guide or file body inside a bordered panel. */
export function DocumentBodySkeleton({ label }: { label: string }) {
	return (
		<LoadingRegion label={label} className="space-y-4 p-6">
			<Skeleton className="h-6 w-40 rounded-md" />
			<TextLines count={8} />
		</LoadingRegion>
	);
}

export function PackageFilesSkeleton() {
	return (
		<LoadingRegion
			label="Loading package files"
			className="mx-auto max-w-7xl space-y-4 px-5 py-8"
		>
			<div className="flex flex-wrap items-end justify-between gap-4">
				<HeadingBlock />
				<Skeleton className="h-10 w-32 rounded-md" />
			</div>
			<div className="grid gap-4 lg:grid-cols-[minmax(220px,300px)_1fr]">
				<div className="rounded-md border border-border">
					<div className="flex items-center justify-between border-b border-border px-3 py-2">
						<Skeleton className="h-4 w-28 rounded-md" />
						<Skeleton className="h-7 w-24 rounded-md" />
					</div>
					<div className="space-y-2 p-3">
						{["w-3/4", "w-1/2", "w-2/3", "w-3/5", "w-4/5", "w-1/2"].map(
							(width, row) => (
								<Skeleton key={row} className={cn("h-5 rounded-md", width)} />
							),
						)}
					</div>
				</div>
				<div className="min-w-0 rounded-md border border-border">
					<div className="border-b border-border px-4 py-2">
						<Skeleton className="h-5 w-48 rounded-md" />
					</div>
					<div className="p-6">
						<TextLines count={10} />
					</div>
				</div>
			</div>
		</LoadingRegion>
	);
}

export function PublisherProfileSkeleton() {
	return (
		<LoadingRegion
			label="Loading publisher profile"
			className="mx-auto max-w-6xl px-5 py-10"
		>
			<Skeleton className="h-9 w-56 max-w-full rounded-md" />
			<Skeleton className="mt-3 h-4 w-80 max-w-full rounded-md" />
			<Skeleton className="mt-8 h-6 w-48 rounded-md" />
			<div className="mt-3">
				<PackageListSkeleton rows={3} />
			</div>
		</LoadingRegion>
	);
}

export function MyPackagesSkeleton() {
	return (
		<LoadingRegion
			label="Loading your packages"
			className="mx-auto max-w-6xl space-y-6 px-5 py-10"
		>
			<div className="flex flex-wrap items-end justify-between gap-4">
				<HeadingBlock lead />
				<Skeleton className="h-9 w-40 rounded-md" />
			</div>
			<PackageListSkeleton />
		</LoadingRegion>
	);
}

export function ReleaseCenterSkeleton() {
	return (
		<LoadingRegion
			label="Loading release center"
			className="mx-auto max-w-4xl space-y-6 px-5 py-10"
		>
			<HeadingBlock lead />
			<Skeleton className="h-40 w-full" />
			<Skeleton className="h-56 w-full" />
		</LoadingRegion>
	);
}

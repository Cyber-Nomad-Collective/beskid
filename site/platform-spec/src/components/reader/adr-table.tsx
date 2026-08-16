"use client";

import { useMemo, useState } from "react";

import { Badge } from "#/components/ui-primitives";

export interface AdrLink {
	href: string;
	label: string;
}

export interface AdrEntry {
	href: string;
	title: string;
	status?: string | null;
	decision?: string | null;
	/** Decision date (ISO or free-form). Forward-compatible: empty until the catalog exposes it. */
	date?: string | null;
	/** Related spec/book references for this decision. */
	links?: AdrLink[];
}

export interface AdrTableProps {
	adrs: AdrEntry[];
}

type SortKey = "title" | "status";

type Tone = "success" | "warning" | "danger" | "neutral";

/** Tailwind class bundle for a colored badge, layered on top of the shared `Badge` primitive. */
function badgeToneClasses(tone: Tone): string {
	switch (tone) {
		case "success":
			return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
		case "warning":
			return "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
		case "danger":
			return "border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400";
		default:
			return "border border-border bg-muted/40 text-muted-foreground";
	}
}

/**
 * Map a status/decision value to a tone following the platform-spec color
 * convention: accepted=green, proposed=yellow, rejected=red,
 * superseded/deprecated=gray.
 */
function adrTone(value: string): Tone {
	const normalized = value.trim().toLowerCase();
	if (normalized === "accepted" || normalized === "standard") return "success";
	if (normalized === "proposed" || normalized === "draft") return "warning";
	if (normalized === "rejected") return "danger";
	// superseded, deprecated, and anything else render as neutral (gray).
	return "neutral";
}

function SortToggle({
	value,
	active,
	onClick,
	children,
}: {
	value: SortKey;
	active: SortKey;
	onClick: (key: SortKey) => void;
	children: React.ReactNode;
}) {
	const isActive = value === active;
	return (
		<button
			type="button"
			onClick={() => onClick(value)}
			className={`rounded-md border px-2 py-0.5 text-xs transition-colors ${
				isActive
					? "border-primary/40 bg-primary/10 text-primary"
					: "border-border bg-transparent text-muted-foreground hover:bg-accent/25"
			}`}
			aria-pressed={isActive}
		>
			{children}
		</button>
	);
}

/**
 * Renders the ADR (decision) list for a spec document as a styled table
 * with color-coded status/decision badges, row hover states, and a
 * responsive collapse to cards on small screens. Replaces the plain
 * `<ul>` previously inlined in {@link StructuredDocumentView}.
 */
export function AdrTable({ adrs }: AdrTableProps) {
	const [sortKey, setSortKey] = useState<SortKey>("title");

	const sorted = useMemo(() => {
		const copy = [...adrs];
		copy.sort((a, b) => {
			const av = (sortKey === "title" ? a.title : (a.status ?? "")).toLowerCase();
			const bv = (sortKey === "title" ? b.title : (b.status ?? "")).toLowerCase();
			return av < bv ? -1 : av > bv ? 1 : 0;
		});
		return copy;
	}, [adrs, sortKey]);

	if (adrs.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">No decisions published</p>
		);
	}

	return (
		<div className="spec-adr-table">
			<div className="mb-2 flex items-center gap-1.5">
				<span className="text-xs text-muted-foreground">Sort:</span>
				<SortToggle value="title" active={sortKey} onClick={setSortKey}>
					Title
				</SortToggle>
				<SortToggle value="status" active={sortKey} onClick={setSortKey}>
					Status
				</SortToggle>
			</div>

			{/* Table view (md+). */}
			<table className="hidden w-full border-collapse text-sm md:table">
				<thead>
					<tr className="border-b border-border text-left text-xs text-muted-foreground">
						<th className="py-1.5 pr-3 font-medium">Title</th>
						<th className="py-1.5 pr-3 font-medium">Decision</th>
						<th className="py-1.5 pr-3 font-medium">Status</th>
						<th className="py-1.5 pr-3 font-medium">Date</th>
						<th className="py-1.5 font-medium">Links</th>
					</tr>
				</thead>
				<tbody>
					{sorted.map((item) => (
						<tr
							key={item.href}
							className="border-b border-border/60 transition-colors hover:bg-accent/25"
						>
							<td className="py-1.5 pr-3">
								<a
									href={item.href}
									className="font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
								>
									{item.title}
								</a>
							</td>
							<td className="py-1.5 pr-3">
								{item.decision ? (
									<Badge className={badgeToneClasses(adrTone(item.decision))}>
										{item.decision}
									</Badge>
								) : (
									<span className="text-muted-foreground/50">—</span>
								)}
							</td>
							<td className="py-1.5 pr-3">
								{item.status ? (
									<Badge className={badgeToneClasses(adrTone(item.status))}>
										{item.status}
									</Badge>
								) : (
									<span className="text-muted-foreground/50">—</span>
								)}
							</td>
							<td className="py-1.5 pr-3 text-muted-foreground">
								{item.date ? (
									<time dateTime={item.date}>{item.date}</time>
								) : (
									<span className="text-muted-foreground/50">—</span>
								)}
							</td>
							<td className="py-1.5">
								{item.links && item.links.length > 0 ? (
									<ul className="flex flex-col gap-0.5">
										{item.links.map((link) => (
											<li key={link.href}>
												<a
													href={link.href}
													className="text-primary underline-offset-2 hover:underline"
												>
													{link.label}
												</a>
											</li>
										))}
									</ul>
								) : (
									<span className="text-muted-foreground/50">—</span>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{/* Card view (small screens). */}
			<ul className="flex flex-col gap-2 md:hidden">
				{sorted.map((item) => (
					<li
						key={item.href}
						className="rounded-md border border-border/60 p-2.5 transition-colors hover:border-border hover:bg-accent/25"
					>
						<a href={item.href} className="block">
							<span className="block text-sm font-medium text-foreground">
								{item.title}
							</span>
							<span className="mt-1.5 flex flex-wrap items-center gap-1.5">
								{item.decision ? (
									<Badge className={badgeToneClasses(adrTone(item.decision))}>
										{item.decision}
									</Badge>
								) : null}
								{item.status ? (
									<Badge className={badgeToneClasses(adrTone(item.status))}>
										{item.status}
									</Badge>
								) : null}
								{item.date ? (
									<span className="text-xs text-muted-foreground">{item.date}</span>
								) : null}
							</span>
							{item.links && item.links.length > 0 ? (
								<span className="mt-1.5 flex flex-wrap gap-2 text-xs">
									{item.links.map((link) => (
										<a
											key={link.href}
											href={link.href}
											className="text-primary underline-offset-2 hover:underline"
											onClick={(e) => e.stopPropagation()}
										>
											{link.label}
										</a>
									))}
								</span>
							) : null}
						</a>
					</li>
				))}
			</ul>
		</div>
	);
}

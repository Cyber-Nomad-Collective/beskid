"use client";

import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import type { RoadmapColumnId } from "#/lib/github/roadmap-labels";
import type { RoadmapPriority } from "#/lib/github/types";
import {
	activeMetaFilterChips,
	formatMetaQueryHint,
	parseMetaQuery,
	removeTokenFromQuery,
} from "#/lib/roadmap/meta-search";

const ALL = "__all__";

export interface MetaSearchBarProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	resultCount?: number;
	totalCount?: number;
	/** Structured filter options (board). */
	workstreams?: string[];
	domains?: string[];
	areas?: string[];
	features?: string[];
	showStructuredFilters?: boolean;
	className?: string;
}

export function RoadmapMetaSearchBar({
	value,
	onChange,
	placeholder = "Meta search — text, workstream:slug, status:done, #42…",
	resultCount,
	totalCount,
	workstreams = [],
	domains = [],
	areas = [],
	features = [],
	showStructuredFilters = true,
	className,
}: MetaSearchBarProps) {
	const [filtersOpen, setFiltersOpen] = useState(false);
	const parsed = useMemo(() => parseMetaQuery(value), [value]);
	const chips = useMemo(() => activeMetaFilterChips(value), [value]);

	const appendToken = (prefix: string, tokenValue: string | undefined) => {
		let next = value.replace(new RegExp(`\\b${prefix}:\\S+`, "gi"), "").trim();
		if (tokenValue && tokenValue !== ALL) {
			next = `${next} ${prefix}:${tokenValue}`.trim();
		}
		onChange(next);
	};

	const setStatus = (status: RoadmapColumnId | undefined) => {
		let next = value
			.replace(/\bstatus:\S+/gi, "")
			.replace(/\s+/g, " ")
			.trim();
		if (status) next = `${next} status:${status}`.trim();
		onChange(next);
	};

	const setPriority = (priority: RoadmapPriority | undefined) => {
		let next = value
			.replace(/\bpriority:\S+/gi, "")
			.replace(/\s+/g, " ")
			.trim();
		if (priority) next = `${next} priority:${priority}`.trim();
		onChange(next);
	};

	const setSpec = (linked: "linked" | "none" | undefined) => {
		let next = value
			.replace(/\bspec:\S+/gi, "")
			.replace(/\s+/g, " ")
			.trim();
		if (linked) next = `${next} spec:${linked}`.trim();
		onChange(next);
	};

	return (
		<div className={className ?? "roadmap-meta-search space-y-3"}>
			<div className="roadmap-meta-search__row flex flex-wrap items-center gap-2">
				<div className="relative min-w-[12rem] flex-1">
					<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
					<Input
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder={placeholder}
						className="roadmap-meta-search__input h-10 pr-9 pl-9 font-mono text-sm"
						aria-label="Meta search"
					/>
					{value ? (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
							onClick={() => onChange("")}
							aria-label="Clear search"
						>
							<X className="size-4" />
						</Button>
					) : null}
				</div>

				{showStructuredFilters ? (
					<Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
						<PopoverTrigger asChild>
							<Button type="button" variant="outline" size="sm" className="gap-1.5">
								<SlidersHorizontal className="size-3.5" />
								Filters
							</Button>
						</PopoverTrigger>
						<PopoverContent
							className="roadmap-meta-search__panel w-[min(24rem,calc(100vw-2rem))] p-4"
							align="end"
						>
							<p className="text-muted-foreground mb-3 text-xs leading-relaxed">
								{formatMetaQueryHint()}
							</p>
							<div className="grid gap-3 sm:grid-cols-2">
								<FilterSelect
									label="Workstream"
									value={parsed.workstream ?? ALL}
									options={workstreams}
									onChange={(v) => appendToken("workstream", v === ALL ? undefined : v)}
								/>
								<FilterSelect
									label="Domain"
									value={parsed.domain ?? ALL}
									options={domains}
									onChange={(v) => appendToken("domain", v === ALL ? undefined : v)}
								/>
								<FilterSelect
									label="Area"
									value={parsed.area ?? ALL}
									options={areas}
									onChange={(v) => appendToken("area", v === ALL ? undefined : v)}
								/>
								<FilterSelect
									label="Feature"
									value={parsed.feature ?? ALL}
									options={features}
									onChange={(v) => appendToken("feature", v === ALL ? undefined : v)}
								/>
								<FilterSelect
									label="Status"
									value={parsed.status ?? ALL}
									options={["Backlog", "In Progress", "Done"]}
									onChange={(v) =>
										setStatus(v === ALL ? undefined : (v as RoadmapColumnId))
									}
								/>
								<FilterSelect
									label="Priority"
									value={parsed.priority ?? ALL}
									options={["high", "medium", "low"]}
									onChange={(v) =>
										setPriority(v === ALL ? undefined : (v as RoadmapPriority))
									}
								/>
								<FilterSelect
									label="Spec linkage"
									value={
										parsed.specLinked === true
											? "linked"
											: parsed.specLinked === false
												? "none"
												: ALL
									}
									options={["linked", "none"]}
									onChange={(v) =>
										setSpec(v === ALL ? undefined : (v as "linked" | "none"))
									}
								/>
							</div>
						</PopoverContent>
					</Popover>
				) : null}

				{resultCount !== undefined && totalCount !== undefined ? (
					<span className="text-muted-foreground flex items-center gap-1.5 text-xs whitespace-nowrap">
						<Filter className="size-3.5 opacity-70" />
						{resultCount === totalCount
							? `${totalCount} items`
							: `${resultCount} of ${totalCount}`}
					</span>
				) : null}
			</div>

			{chips.length > 0 ? (
				<div className="roadmap-meta-search__chips flex flex-wrap gap-1.5">
					{chips.map((chip) => (
						<Badge
							key={chip.key}
							variant="secondary"
							className="gap-1 pr-1 font-normal"
						>
							{chip.label}
							<button
								type="button"
								className="hover:bg-muted rounded-sm p-0.5"
								onClick={() => onChange(removeTokenFromQuery(value, chip.removeToken))}
								aria-label={`Remove ${chip.label}`}
							>
								<X className="size-3" />
							</button>
						</Badge>
					))}
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-6 px-2 text-xs"
						onClick={() => onChange("")}
					>
						Clear all
					</Button>
				</div>
			) : null}
		</div>
	);
}

function FilterSelect({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: string;
	options: string[];
	onChange: (value: string) => void;
}) {
	return (
		<div className="space-y-1.5">
			<span className="text-muted-foreground text-xs font-medium">{label}</span>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className="w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>All</SelectItem>
					{options.map((opt) => (
						<SelectItem key={opt} value={opt}>
							{opt}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

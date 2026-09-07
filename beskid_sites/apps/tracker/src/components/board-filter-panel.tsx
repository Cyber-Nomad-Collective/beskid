"use client";

import { FilterBuilder, Willow, WillowDark } from "@svar-ui/react-filter";
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	BOARD_FILTER_PRESETS,
	isPresetActive,
} from "#/lib/roadmap/board-filter-presets";
import {
	buildQueryFromFilterValue,
	buildRoadmapFilterFields,
	type FilterSetValue,
	type RoadmapFilterFieldOptions,
} from "#/lib/roadmap/filter-query-bridge";
import { activeMetaFilterChips } from "#/lib/roadmap/meta-search";

export interface BoardFilterPanelProps extends RoadmapFilterFieldOptions {
	query: string;
	onQueryChange: (query: string) => void;
	resultCount?: number;
	totalCount?: number;
}

function SvarThemeWrapper({ children }: { children: ReactNode }) {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	if (!mounted) {
		return (
			<div className="beskid-svar-filter beskid-svar-filter--vertical">
				{children}
			</div>
		);
	}

	const Theme = resolvedTheme === "dark" ? WillowDark : Willow;
	return (
		<Theme fonts={false}>
			<div className="beskid-svar-filter beskid-svar-filter--vertical">
				{children}
			</div>
		</Theme>
	);
}

export function BoardFilterPanel({
	query,
	onQueryChange,
	resultCount,
	totalCount,
	workstreams = [],
	domains = [],
	areas = [],
	features = [],
}: BoardFilterPanelProps) {
	const [expanded, setExpanded] = useState(false);
	const fields = useMemo(
		() =>
			buildRoadmapFilterFields({ workstreams, domains, areas, features }, true),
		[workstreams, domains, areas, features],
	);
	const chips = useMemo(() => activeMetaFilterChips(query), [query]);
	const hasActiveFilters = query.trim().length > 0;

	return (
		<aside
			className="board-filter-panel"
			data-expanded={expanded ? "true" : "false"}
			aria-label="Board filters"
		>
			<div className="board-filter-panel__rail">
				<Button
					type="button"
					variant={expanded ? "secondary" : "outline"}
					size="icon"
					className="board-filter-panel__toggle size-9 shrink-0"
					onClick={() => setExpanded((open) => !open)}
					aria-expanded={expanded}
					aria-controls="board-filter-panel-content"
					title={expanded ? "Hide filters" : "Show filters"}
				>
					{expanded ? (
						<ChevronRight className="size-4" aria-hidden />
					) : (
						<Filter className="size-4" aria-hidden />
					)}
				</Button>
				{!expanded && hasActiveFilters ? (
					<Badge
						variant="default"
						className="board-filter-panel__badge absolute -top-1 -right-1 size-5 justify-center rounded-full p-0 text-[10px]"
					>
						{chips.length || "·"}
					</Badge>
				) : null}
			</div>

			<div
				id="board-filter-panel-content"
				className="board-filter-panel__drawer"
				hidden={!expanded}
			>
				<header className="board-filter-panel__header">
					<div>
						<h2 className="text-sm font-semibold">Filters</h2>
						{resultCount !== undefined && totalCount !== undefined ? (
							<p className="text-muted-foreground mt-0.5 text-xs">
								{resultCount === totalCount
									? `${totalCount} items`
									: `${resultCount} of ${totalCount}`}
							</p>
						) : null}
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={() => setExpanded(false)}
						aria-label="Close filters"
					>
						<ChevronLeft className="size-4" />
					</Button>
				</header>

				<section
					className="board-filter-panel__presets"
					aria-label="Preset filters"
				>
					<p className="text-muted-foreground mb-2 text-[0.65rem] font-semibold tracking-wide uppercase">
						Presets
					</p>
					<div className="flex flex-wrap gap-1.5">
						{BOARD_FILTER_PRESETS.map((preset) => (
							<Button
								key={preset.id}
								type="button"
								size="sm"
								variant={isPresetActive(preset, query) ? "default" : "outline"}
								className="h-7 px-2.5 text-xs"
								onClick={() => onQueryChange(preset.query)}
							>
								{preset.label}
							</Button>
						))}
					</div>
				</section>

				<div className="board-filter-panel__builder">
					<SvarThemeWrapper>
						<FilterBuilder
							key={query || "__empty__"}
							type="list"
							fields={fields}
							onChange={(ev: { value: FilterSetValue }) => {
								onQueryChange(buildQueryFromFilterValue(ev.value));
							}}
						/>
					</SvarThemeWrapper>
				</div>

				{chips.length > 0 ? (
					<div className="board-filter-panel__chips flex flex-wrap gap-1.5">
						{chips.map((chip) => (
							<Badge
								key={chip.key}
								variant="secondary"
								className="gap-1 pr-1 font-normal"
							>
								{chip.label}
							</Badge>
						))}
					</div>
				) : null}

				<footer className="board-filter-panel__footer">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="w-full"
						disabled={!hasActiveFilters}
						onClick={() => onQueryChange("")}
					>
						<X className="size-3.5" />
						Clear filters
					</Button>
				</footer>
			</div>
		</aside>
	);
}

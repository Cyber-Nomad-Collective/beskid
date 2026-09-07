"use client";

import { FilterBar } from "@svar-ui/react-filter";
import { Filter as FilterIcon } from "lucide-react";
import { useMemo } from "react";

import {
	buildQueryFromFilterValue,
	buildRoadmapFilterFields,
	type FilterSetValue,
	type RoadmapFilterFieldOptions,
} from "#/lib/roadmap/filter-query-bridge";

export interface RoadmapReactFilterBarProps extends RoadmapFilterFieldOptions {
	value: string;
	onChange: (value: string) => void;
	resultCount?: number;
	totalCount?: number;
	showStructuredFilters?: boolean;
}

export function RoadmapReactFilterBar({
	value,
	onChange,
	resultCount,
	totalCount,
	showStructuredFilters = true,
	workstreams = [],
	domains = [],
	areas = [],
	features = [],
}: RoadmapReactFilterBarProps) {
	const fields = useMemo(
		() =>
			buildRoadmapFilterFields(
				{ workstreams, domains, areas, features },
				showStructuredFilters,
			),
		[workstreams, domains, areas, features, showStructuredFilters],
	);
	return (
		<div className="beskid-svar-filter space-y-2">
			<FilterBar
				key={value || "__empty__"}
				fields={fields}
				onChange={(ev: { value: FilterSetValue }) => {
					onChange(buildQueryFromFilterValue(ev.value));
				}}
			/>
			{resultCount !== undefined && totalCount !== undefined ? (
				<span className="text-muted-foreground flex items-center gap-1.5 text-xs whitespace-nowrap">
					<FilterIcon className="size-3.5 opacity-70" />
					{resultCount === totalCount
						? `${totalCount} items`
						: `${resultCount} of ${totalCount}`}
				</span>
			) : null}
		</div>
	);
}

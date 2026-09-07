"use client";

import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BoardFilterPanel } from "#/components/board-filter-panel";
import { CreateTaskWorkItem } from "#/components/create-task-work-item";
import { RoadmapKanbanBoard } from "#/components/roadmap-kanban-board";
import { Button } from "#/components/ui/button";
import type { BoardPayload } from "#/lib/github/types";
import type {
	BoardFilterState,
	BoardSearchParams,
} from "#/lib/roadmap/board-search";
import { filterColumnsByMetaQuery } from "#/lib/roadmap/meta-search";
import { parseMetaQuery } from "#/lib/roadmap/meta-search-query";
import {
	boardRouteTo,
	boardSearchFromFilters,
	createTaskFullscreenTo,
} from "#/lib/work-item-shell/paths";

export interface VersionBoardViewProps {
	version: string;
	board: BoardPayload;
	search: BoardSearchParams;
	/** When set, the board is scoped to this workstream (path param, not URL search). */
	fixedWorkstream?: string;
	workstreamTitle?: string;
	onNavigate: (options: {
		search: BoardSearchParams;
		replace?: boolean;
	}) => void;
}

export function VersionBoardView({
	version,
	board,
	search,
	fixedWorkstream,
	workstreamTitle,
	onNavigate,
}: VersionBoardViewProps) {
	const createOpen = search.create === "1";

	const [filters, setFilters] = useState<BoardFilterState>({
		q: search.q,
		workstream: fixedWorkstream ?? search.workstream,
		domain: search.domain,
		area: search.area,
		feature: search.feature,
	});

	useEffect(() => {
		setFilters({
			q: search.q,
			workstream: fixedWorkstream ?? search.workstream,
			domain: search.domain,
			area: search.area,
			feature: search.feature,
		});
	}, [
		search.q,
		search.workstream,
		search.domain,
		search.area,
		search.feature,
		fixedWorkstream,
	]);

	const boardSearch = useMemo(
		() =>
			boardSearchFromFilters(
				fixedWorkstream ? { ...filters, workstream: undefined } : filters,
			),
		[filters, fixedWorkstream],
	);

	const syncFiltersToUrl = useCallback(
		(next: BoardFilterState, options?: { create?: boolean }) => {
			setFilters(next);
			const parsed = parseMetaQuery(next.q ?? "");
			const merged: BoardFilterState = {
				q: next.q,
				workstream: fixedWorkstream
					? undefined
					: (next.workstream ?? parsed.workstream),
				domain: next.domain ?? parsed.domain,
				area: next.area ?? parsed.area,
				feature: next.feature ?? parsed.feature,
			};
			onNavigate({
				search: boardSearchFromFilters(merged, {
					create: options?.create ?? createOpen,
				}),
				replace: true,
			});
		},
		[onNavigate, createOpen, fixedWorkstream],
	);

	const openCreatePane = () => {
		onNavigate({
			search: boardSearchFromFilters(filters, { create: true }),
		});
	};

	const closeCreatePane = () => {
		onNavigate({
			search: boardSearch,
			replace: true,
		});
	};

	const filteredColumns = useMemo(
		() => filterColumnsByMetaQuery(board.columns, filters.q ?? ""),
		[board.columns, filters.q],
	);

	const totalCount = board.tasks.length;
	const resultCount = useMemo(() => {
		return Object.values(filteredColumns).reduce(
			(sum, col) => sum + col.length,
			0,
		);
	}, [filteredColumns]);

	const metaQuery = filters.q ?? "";
	const expandTo = createTaskFullscreenTo(version, boardSearch, fixedWorkstream);

	const filterWorkstreams = fixedWorkstream ? [] : board.meta.workstreams;

	return (
		<div className="board-view flex min-h-0 flex-1 flex-col">
			{fixedWorkstream ? (
				<div className="border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-sm md:px-5">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<p className="island-kicker text-xs">Workstream board</p>
							<h1 className="text-lg font-semibold">
								{workstreamTitle ?? fixedWorkstream}
							</h1>
							<p className="text-muted-foreground font-mono text-xs">
								{version} · {fixedWorkstream}
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-3 text-sm">
							<Link
								{...boardRouteTo(version)}
								className="text-primary font-medium hover:underline"
							>
								Global board
							</Link>
							<Link
								to="/versions/$version/workstreams/$slug"
								params={{ version, slug: fixedWorkstream }}
								className="text-muted-foreground hover:text-foreground hover:underline"
							>
								Overview
							</Link>
						</div>
					</div>
				</div>
			) : null}

			<div className="board-view__stage relative flex min-h-0 flex-1">
				<div className="board-view__canvas min-h-0 min-w-0 flex-1 overflow-auto p-4 md:p-5">
					<RoadmapKanbanBoard
						columns={filteredColumns}
						canManage={board.meta.canManage}
					/>
				</div>

				<CreateTaskWorkItem
					presentation="pane"
					version={version}
					workstreamOptions={board.meta.workstreams}
					defaultWorkstream={fixedWorkstream}
					open={createOpen}
					onClose={closeCreatePane}
					expandTo={expandTo}
					onCreated={closeCreatePane}
				/>

				<BoardFilterPanel
					query={metaQuery}
					onQueryChange={(q) => syncFiltersToUrl({ ...filters, q: q || undefined })}
					workstreams={filterWorkstreams}
					domains={board.meta.domains}
					areas={board.meta.areas}
					features={board.meta.features}
					resultCount={resultCount}
					totalCount={totalCount}
				/>

				{!createOpen ? (
					<div className="board-view__fab pointer-events-none absolute bottom-4 left-4 z-20 md:left-5">
						<div className="pointer-events-auto">
							<Button type="button" onClick={openCreatePane}>
								New task
							</Button>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}

/** @internal exported for route navigate helpers */
export function resolveBoardLoaderFilters(
	version: string,
	search: BoardSearchParams,
	fixedWorkstream?: string,
) {
	const parsed = parseMetaQuery(search.q ?? "");
	return {
		version,
		workstream: fixedWorkstream ?? search.workstream ?? parsed.workstream,
		domain: search.domain ?? parsed.domain,
		area: search.area ?? parsed.area,
		feature: search.feature ?? parsed.feature,
	};
}

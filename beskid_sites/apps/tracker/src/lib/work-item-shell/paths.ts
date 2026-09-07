import type { WorkItemShellRouteTarget } from "#/components/work-item-shell/work-item-shell";
import type {
	BoardFilterState,
	BoardSearchParams,
} from "#/lib/roadmap/board-search";

export function boardSearchFromFilters(
	filters: BoardFilterState,
	options?: { create?: boolean },
): BoardSearchParams {
	return {
		q: filters.q,
		workstream: filters.workstream,
		domain: filters.domain,
		area: filters.area,
		feature: filters.feature,
		...(options?.create ? { create: "1" as const } : {}),
	};
}

/** Global version board — all workstreams unless filtered in search. */
export function boardRouteTo(version: string, search?: BoardSearchParams) {
	return {
		to: "/v/$version" as const,
		params: { version },
		search: stripCreateFlag(search),
	};
}

/** Per-workstream kanban scoped to one catalog workstream. */
export function workstreamBoardRouteTo(
	version: string,
	workstream: string,
	search?: BoardSearchParams,
) {
	const { workstream: _ignored, create: _create, ...rest } = search ?? {};
	return {
		to: "/v/$version/w/$workstream" as const,
		params: { version, workstream },
		search: stripCreateFlag(rest),
	};
}

export function createTaskFullscreenTo(
	version: string,
	search?: BoardSearchParams,
	workstream?: string,
): WorkItemShellRouteTarget {
	if (workstream) {
		return {
			to: "/v/$version/w/$workstream/tasks/new" as const,
			params: { version, workstream },
			search: stripCreateFlag(search),
		};
	}
	return {
		to: "/v/$version/tasks/new" as const,
		params: { version },
		search: stripCreateFlag(search),
	};
}

function stripCreateFlag(
	search?: BoardSearchParams,
): BoardSearchParams | undefined {
	if (!search) return undefined;
	const { create: _create, ...rest } = search;
	return Object.keys(rest).length > 0 ? rest : undefined;
}

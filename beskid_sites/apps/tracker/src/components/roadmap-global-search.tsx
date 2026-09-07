"use client";

import { useNavigate } from "@tanstack/react-router";
import {
	Flag,
	KanbanSquare,
	Layers,
	ListTodo,
	Map as MapIcon,
	Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "#/components/ui/command";
import {
	type RoadmapSearchHit,
	searchRoadmapIndex,
} from "#/lib/roadmap/search-index";

const KIND_LABELS: Record<RoadmapSearchHit["kind"], string> = {
	nav: "Navigate",
	version: "Versions",
	deliverable: "Deliverables",
	workstream: "Workstreams",
	task: "Tasks",
};

const KIND_ICONS: Record<RoadmapSearchHit["kind"], typeof Search> = {
	nav: MapIcon,
	version: Layers,
	deliverable: Flag,
	workstream: KanbanSquare,
	task: ListTodo,
};

interface RoadmapGlobalSearchProps {
	hits: RoadmapSearchHit[];
}

export function RoadmapGlobalSearch({ hits }: RoadmapGlobalSearchProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const navigate = useNavigate();

	const results = useMemo(
		() => searchRoadmapIndex(hits, query, 16),
		[hits, query],
	);

	const grouped = useMemo(() => {
		const map = new Map<RoadmapSearchHit["kind"], RoadmapSearchHit[]>();
		for (const hit of results) {
			const list = map.get(hit.kind) ?? [];
			list.push(hit);
			map.set(hit.kind, list);
		}
		return map;
	}, [results]);

	const goTo = useCallback(
		(hit: RoadmapSearchHit) => {
			setOpen(false);
			setQuery("");
			if (hit.params) {
				navigate({
					to: hit.to as "/",
					params: hit.params as never,
					search: hit.search as never,
				});
			} else {
				navigate({ to: hit.to as "/" });
			}
		},
		[navigate],
	);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setOpen((current) => !current);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	return (
		<>
			<button
				type="button"
				className="roadmap-global-search-trigger text-muted-foreground hover:text-foreground border-input bg-background/80 flex h-9 min-w-[10rem] flex-1 items-center gap-2 rounded-lg border px-3 text-left text-sm shadow-xs transition-colors sm:max-w-xs"
				onClick={() => setOpen(true)}
			>
				<Search className="size-4 shrink-0 opacity-70" />
				<span className="truncate">Search tracker…</span>
				<kbd className="bg-muted text-muted-foreground pointer-events-none ml-auto hidden rounded px-1.5 py-0.5 font-mono text-[10px] sm:inline">
					⌘K
				</kbd>
			</button>

			<CommandDialog
				open={open}
				onOpenChange={setOpen}
				shouldFilter={false}
				title="Roadmap search"
				description="Versions, deliverables, workstreams, tasks, and pages"
			>
				<CommandInput
					placeholder="Meta search — version, deliverable, workstream:slug, #42…"
					value={query}
					onValueChange={setQuery}
				/>
				<CommandList>
					<CommandEmpty>
						No matches. Try a version id or workstream name.
					</CommandEmpty>
					{[...grouped.entries()].map(([kind, items], index) => {
						const Icon = KIND_ICONS[kind];
						return (
							<div key={kind}>
								{index > 0 ? <CommandSeparator /> : null}
								<CommandGroup heading={KIND_LABELS[kind]}>
									{items.map((hit) => (
										<CommandItem
											key={hit.id}
											value={`${hit.title} ${hit.subtitle} ${hit.keywords}`}
											onSelect={() => goTo(hit)}
										>
											<Icon className="size-4 opacity-70" />
											<div className="flex min-w-0 flex-col gap-0.5">
												<span className="truncate font-medium">{hit.title}</span>
												<span className="text-muted-foreground truncate text-xs">
													{hit.subtitle}
												</span>
											</div>
										</CommandItem>
									))}
								</CommandGroup>
							</div>
						);
					})}
				</CommandList>
			</CommandDialog>
		</>
	);
}

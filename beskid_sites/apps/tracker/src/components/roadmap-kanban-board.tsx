"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { IssueDetailSheet } from "#/components/issue-detail-sheet";
import {
	Kanban,
	KanbanBoard,
	KanbanColumn,
	KanbanColumnContent,
	KanbanItem,
	KanbanItemHandle,
	type KanbanMoveEvent,
	KanbanOverlay,
} from "#/components/reui/kanban";
import { TaskDisplay } from "#/components/task-display";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import type { RoadmapColumnId } from "#/lib/github/roadmap-labels";
import type { RoadmapColumns, RoadmapTask } from "#/lib/github/types";
import { moveIssueColumn } from "#/server/issues";

function applyKanbanMove(
	prev: RoadmapColumns,
	event: KanbanMoveEvent,
): {
	next: RoadmapColumns;
	move: {
		versionId: string;
		taskId: string;
		targetColumn: RoadmapColumnId;
		targetIndex: number;
	} | null;
} {
	const { activeContainer, overContainer, activeIndex, overIndex } = event;
	const from = activeContainer as RoadmapColumnId;
	const to = overContainer as RoadmapColumnId;

	if (from === to) {
		return {
			next: {
				...prev,
				[from]: arrayMove([...prev[from]], activeIndex, overIndex),
			},
			move: {
				versionId: prev[from][activeIndex]?.version ?? "",
				taskId: prev[from][activeIndex]?.id ?? "",
				targetColumn: to,
				targetIndex: overIndex,
			},
		};
	}

	const source = [...prev[from]];
	const target = [...prev[to]];
	const [moved] = source.splice(activeIndex, 1);
	if (!moved) {
		return { next: prev, move: null };
	}

	const updated: RoadmapTask = { ...moved, statusColumn: to };
	target.splice(overIndex, 0, updated);

	return {
		next: {
			...prev,
			[from]: source,
			[to]: target,
		},
		move: {
			versionId: moved.version,
			taskId: moved.id,
			targetColumn: to,
			targetIndex: overIndex,
		},
	};
}

interface RoadmapKanbanBoardProps {
	columns: RoadmapColumns;
	canManage?: boolean;
}

export function RoadmapKanbanBoard({
	columns: initialColumns,
	canManage = false,
}: RoadmapKanbanBoardProps) {
	const router = useRouter();
	const [columns, setColumns] = useState(initialColumns);
	const [selectedTask, setSelectedTask] = useState<RoadmapTask | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

	const tasksById = useMemo(() => {
		const map = new Map<string, RoadmapTask>();
		for (const items of Object.values(columns)) {
			for (const task of items) {
				map.set(task.id, task);
			}
		}
		return map;
	}, [columns]);

	useEffect(() => {
		setColumns(initialColumns);
	}, [initialColumns]);

	const moveMutation = useMutation({
		mutationFn: (input: {
			versionId: string;
			taskId: string;
			targetColumn: RoadmapColumnId;
			targetIndex: number;
			rollback: RoadmapColumns;
		}) => {
			const { rollback: _rollback, ...data } = input;
			return moveIssueColumn({ data });
		},
		onSuccess: async () => {
			await router.invalidate();
		},
		onError: (_error, input) => {
			setColumns(input.rollback);
		},
	});

	const handleMove = (event: KanbanMoveEvent) => {
		setColumns((prev) => {
			const { next, move } = applyKanbanMove(prev, event);
			if (move?.taskId && !moveMutation.isPending) {
				moveMutation.mutate({ ...move, rollback: prev });
			}
			return next;
		});
	};

	const openTask = (taskId: string) => {
		const task = tasksById.get(taskId);
		if (!task) return;
		setSelectedTask(task);
		setDetailOpen(true);
	};

	return (
		<>
			<Kanban
				value={columns}
				onValueChange={(next) => setColumns(next as RoadmapColumns)}
				onMove={handleMove}
				getItemValue={(item) => item.id}
				className="w-full"
			>
				<KanbanBoard className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
					{Object.entries(columns).map(([columnId, items]) => (
						<KanbanColumn
							key={columnId}
							value={columnId}
							className="flex flex-col gap-3"
						>
							<Card size="sm" className="kanban-column-header py-4">
								<CardHeader className="border-0 px-4 py-0">
									<CardTitle className="flex items-center justify-between text-sm font-semibold">
										<span>{columnId}</span>
										<Badge variant="secondary">{items.length}</Badge>
									</CardTitle>
								</CardHeader>
							</Card>
							<KanbanColumnContent
								value={columnId}
								className="flex min-h-48 flex-col gap-3"
							>
								{items.map((item) => (
									<KanbanItem key={item.id} value={item.id}>
										<KanbanItemHandle>
											<Card
												size="sm"
												className="kanban-card cursor-grab py-4 active:cursor-grabbing"
												onClick={() => openTask(item.id)}
											>
												<CardContent className="px-4 pt-0">
													<TaskDisplay task={item} variant="card" />
												</CardContent>
											</Card>
										</KanbanItemHandle>
									</KanbanItem>
								))}
							</KanbanColumnContent>
						</KanbanColumn>
					))}
				</KanbanBoard>
				<KanbanOverlay>
					<div className="bg-muted size-full rounded-2xl ring-1 ring-foreground/10" />
				</KanbanOverlay>
			</Kanban>
			<IssueDetailSheet
				task={selectedTask}
				open={detailOpen}
				onOpenChange={setDetailOpen}
				canManage={canManage}
			/>
		</>
	);
}

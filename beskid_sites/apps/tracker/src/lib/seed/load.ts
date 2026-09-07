import "@tanstack/react-start/server-only";

import { collectBoardMeta } from "#/lib/github/mappers";
import { DEFAULT_DELIVERY_VERSIONS } from "#/lib/github/roadmap-labels";
import type { RoadmapColumns, RoadmapTask } from "#/lib/github/types";
import {
	listEntityJsonFiles,
	listSeedVersionIds,
	readJsonFile,
	seedVersionDir,
} from "#/lib/seed/paths";
import {
	compareSeedDeliverables,
	compareSeedTasks,
	type SeedDeliverable,
	type SeedTask,
	type SeedVersion,
	type SeedWorkstream,
	seedDeliverableSchema,
	seedTaskSchema,
	seedVersionSchema,
	seedWorkstreamSchema,
} from "#/lib/seed/schemas";
import { seedTaskToRoadmapTask } from "#/lib/seed/to-roadmap-task";

export interface LoadedVersionSeed {
	version: SeedVersion;
	workstreams: SeedWorkstream[];
	deliverables: SeedDeliverable[];
	tasks: SeedTask[];
}

export function loadVersionSeed(versionId: string): LoadedVersionSeed {
	const version = seedVersionSchema.parse(
		readJsonFile(`${seedVersionDir(versionId)}/version.json`),
	);

	const workstreams = listEntityJsonFiles(versionId, "workstreams").map((file) =>
		seedWorkstreamSchema.parse(readJsonFile(file)),
	);
	const deliverableFiles = listEntityJsonFiles(versionId, "deliverables");
	const legacyMilestoneFiles =
		deliverableFiles.length > 0
			? []
			: listEntityJsonFiles(versionId, "milestones");
	const deliverables = [...deliverableFiles, ...legacyMilestoneFiles].map(
		(file) => seedDeliverableSchema.parse(readJsonFile(file)),
	);
	const tasks = listEntityJsonFiles(versionId, "tasks").map((file) =>
		seedTaskSchema.parse(readJsonFile(file)),
	);

	workstreams.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	tasks.sort(compareSeedTasks);
	deliverables.sort(compareSeedDeliverables);

	return { version, workstreams, deliverables, tasks };
}

export function loadAllVersionSeeds(): LoadedVersionSeed[] {
	return listSeedVersionIds().map((versionId) => loadVersionSeed(versionId));
}

export function loadAllSeedRoadmapTasks(): RoadmapTask[] {
	const tasks: RoadmapTask[] = [];
	let displayNumber = 1;
	for (const bundle of loadAllVersionSeeds()) {
		const deliverableMap = new Map(
			bundle.deliverables.map((deliverable) => [deliverable.id, deliverable]),
		);
		for (const task of bundle.tasks) {
			tasks.push(
				seedTaskToRoadmapTask(
					bundle.version,
					task,
					deliverableMap,
					displayNumber++,
				),
			);
		}
	}
	return tasks;
}

export function listSeedVersionLabels(): string[] {
	const fromDisk = listSeedVersionIds();
	if (fromDisk.length > 0) return fromDisk;
	return [...DEFAULT_DELIVERY_VERSIONS];
}

export function listSeedVersionsFromDisk(): string[] {
	return listSeedVersionIds();
}

export function tasksToColumns(tasks: RoadmapTask[]): RoadmapColumns {
	const columns: RoadmapColumns = {
		Backlog: [],
		"In Progress": [],
		Done: [],
	};
	for (const task of tasks) {
		columns[task.statusColumn].push(task);
	}
	for (const column of Object.keys(columns) as (keyof RoadmapColumns)[]) {
		columns[column].sort((a, b) => a.number - b.number);
	}
	return columns;
}

export function collectSeedBoardMeta(tasks: RoadmapTask[]) {
	return collectBoardMeta(tasks);
}

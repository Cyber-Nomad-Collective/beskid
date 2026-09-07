/**
 * Validates all JSON under data/v0.x against Zod schemas (canonical) and reports counts.
 * Run: bun run seed:validate
 *
 * JSON Schema artifacts live in schemas/seed/ (regenerate with seed:schema:export).
 */
import { loadAllVersionSeeds } from "#/lib/seed/load";

const bundles = loadAllVersionSeeds();
let tasks = 0;
let workstreams = 0;
let deliverables = 0;
let subtaskSteps = 0;

for (const bundle of bundles) {
	workstreams += bundle.workstreams.length;
	deliverables += bundle.deliverables.length;
	tasks += bundle.tasks.length;
	for (const task of bundle.tasks) {
		subtaskSteps += task.subtasks.length;
	}
	console.log(
		`${bundle.version.id}: ${bundle.tasks.length} tasks, ${bundle.workstreams.length} workstreams, ${bundle.deliverables.length} deliverables`,
	);
}

console.log(
	`OK — ${bundles.length} versions, ${tasks} tasks, ${workstreams} workstreams, ${deliverables} deliverables, ${subtaskSteps} subtask steps`,
);

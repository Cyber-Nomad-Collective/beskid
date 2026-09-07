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

export interface UploadedSeedFile {
	relativePath: string;
	content: string;
}

export interface ParsedSeedBundle {
	versionId: string;
	version: SeedVersion;
	workstreams: SeedWorkstream[];
	deliverables: SeedDeliverable[];
	tasks: SeedTask[];
}

const ENTITY_PATH =
	/^([^/]+\/)?v\d+\.\d+\/(version\.json|workstreams\/[^/]+\.json|deliverables\/[^/]+\.json|milestones\/[^/]+\.json|tasks\/[^/]+\.json)$/;

function normalizePath(relativePath: string): string {
	return relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

function versionIdFromPath(path: string): string | null {
	const match = path.match(/v\d+\.\d+/);
	return match?.[0] ?? null;
}

export function parseUploadedSeedBundles(
	files: UploadedSeedFile[],
): ParsedSeedBundle[] {
	const byVersion = new Map<
		string,
		{
			version?: SeedVersion;
			workstreams: SeedWorkstream[];
			deliverables: SeedDeliverable[];
			tasks: SeedTask[];
		}
	>();

	for (const file of files) {
		const path = normalizePath(file.relativePath);
		if (!ENTITY_PATH.test(path)) continue;

		const versionId = versionIdFromPath(path);
		if (!versionId) continue;

		let bucket = byVersion.get(versionId);
		if (!bucket) {
			bucket = { workstreams: [], deliverables: [], tasks: [] };
			byVersion.set(versionId, bucket);
		}

		const json = JSON.parse(file.content) as unknown;

		if (path.endsWith("/version.json")) {
			const version = seedVersionSchema.parse(json);
			if (version.id !== versionId) {
				throw new Error(
					`version.json id ${version.id} does not match folder ${versionId}`,
				);
			}
			bucket.version = version;
			continue;
		}

		if (path.includes("/workstreams/")) {
			bucket.workstreams.push(seedWorkstreamSchema.parse(json));
			continue;
		}

		if (path.includes("/deliverables/") || path.includes("/milestones/")) {
			bucket.deliverables.push(seedDeliverableSchema.parse(json));
			continue;
		}

		if (path.includes("/tasks/")) {
			bucket.tasks.push(seedTaskSchema.parse(json));
		}
	}

	const bundles: ParsedSeedBundle[] = [];

	for (const [versionId, bucket] of byVersion) {
		if (!bucket.version) {
			throw new Error(`Missing version.json for ${versionId}`);
		}
		bucket.workstreams.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
		bucket.tasks.sort(compareSeedTasks);
		bucket.deliverables.sort(compareSeedDeliverables);

		bundles.push({
			versionId,
			version: bucket.version,
			workstreams: bucket.workstreams,
			deliverables: bucket.deliverables,
			tasks: bucket.tasks,
		});
	}

	if (bundles.length === 0) {
		throw new Error(
			"No seed JSON files found. Pick a folder like data/ with v0.x/version.json and tasks/*.json",
		);
	}

	bundles.sort((a, b) => a.versionId.localeCompare(b.versionId));
	return bundles;
}

export function countUploadedSeedEntities(files: UploadedSeedFile[]): {
	versions: number;
	tasks: number;
} {
	const bundles = parseUploadedSeedBundles(files);
	return {
		versions: bundles.length,
		tasks: bundles.reduce((sum, b) => sum + b.tasks.length, 0),
	};
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	parseUploadedSeedBundles,
	type UploadedSeedFile,
} from "#/lib/seed/parse-uploaded-bundle";
import {
	type CatalogImportSummary,
	upsertParsedSeedBundles,
} from "#/lib/tracker/import-catalog";
import {
	canManageRoadmap,
	requireSession,
	withOctokit,
} from "#/server/auth-guard.server";

const uploadedFileSchema = z.object({
	relativePath: z.string().min(1).max(512),
	content: z.string().max(512_000),
});

export interface ImportPreviewSummary {
	bundleCount: number;
	versions: number;
	workstreams: number;
	deliverables: number;
	tasks: number;
}

function summarizeBundles(
	bundles: ReturnType<typeof parseUploadedSeedBundles>,
): ImportPreviewSummary {
	return {
		bundleCount: bundles.length,
		versions: bundles.length,
		workstreams: bundles.reduce(
			(sum, bundle) => sum + bundle.workstreams.length,
			0,
		),
		deliverables: bundles.reduce(
			(sum, bundle) => sum + bundle.deliverables.length,
			0,
		),
		tasks: bundles.reduce((sum, bundle) => sum + bundle.tasks.length, 0),
	};
}

export const getImportPreviewFn = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			files: z.array(uploadedFileSchema).min(1).max(2000),
		}),
	)
	.handler(async ({ data }): Promise<ImportPreviewSummary> => {
		await requireSession();
		const bundles = parseUploadedSeedBundles(data.files as UploadedSeedFile[]);
		return summarizeBundles(bundles);
	});

export const importCatalogBundleFn = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			files: z.array(uploadedFileSchema).min(1).max(2000),
		}),
	)
	.handler(async ({ data }): Promise<CatalogImportSummary> => {
		const session = await requireSession();

		return withOctokit(async (_octokit) => {
			if (!canManageRoadmap(session)) {
				throw new Error("Only repository maintainers can import catalog data");
			}

			const bundles = parseUploadedSeedBundles(data.files as UploadedSeedFile[]);
			return upsertParsedSeedBundles(bundles);
		});
	});

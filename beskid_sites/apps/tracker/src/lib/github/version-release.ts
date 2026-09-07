import type { Octokit } from "@octokit/rest";

import { normalizeVersionStatus } from "#/lib/roadmap/version-status";
import type { SeedVersion } from "#/lib/seed/schemas";
import type { SyncRunHandle } from "#/lib/sync/sync-run-repository";

const DELIVERY_VERSION_ID = /^v(\d+)\.(\d+)$/;

export interface VersionReleaseCandidate {
	versionId: string;
	tagName: string;
	commitSha: string;
}

export interface VersionReleaseResult {
	created: number;
	planned: number;
	skipped: number;
	errors: string[];
}

/** Sort delivery version ids ascending (v0.1, v0.2, v0.10). */
export function compareDeliveryVersionIds(a: string, b: string): number {
	const parsedA = DELIVERY_VERSION_ID.exec(a);
	const parsedB = DELIVERY_VERSION_ID.exec(b);
	if (!parsedA || !parsedB) return a.localeCompare(b);

	const majorDiff = Number(parsedA[1]) - Number(parsedB[1]);
	if (majorDiff !== 0) return majorDiff;
	return Number(parsedA[2]) - Number(parsedB[2]);
}

export function deliveryVersionTagName(versionId: string): string {
	return versionId;
}

async function getRepoParams() {
	const { repoParams } = await import("#/lib/github/octokit");
	return repoParams();
}

export function isEligibleForSuperrepoRelease(version: SeedVersion): boolean {
	if (normalizeVersionStatus(version.status) !== "Released") return false;
	if (version.cutoff.endCommitRepo !== "beskid") return false;
	return Boolean(version.cutoff.endCommitSha?.trim());
}

export function collectVersionReleaseCandidates(
	versions: SeedVersion[],
): VersionReleaseCandidate[] {
	const seen = new Set<string>();
	const candidates: VersionReleaseCandidate[] = [];

	for (const version of versions) {
		if (!isEligibleForSuperrepoRelease(version)) continue;
		const tagName = deliveryVersionTagName(version.id);
		if (seen.has(tagName)) continue;
		seen.add(tagName);
		candidates.push({
			versionId: version.id,
			tagName,
			commitSha: version.cutoff.endCommitSha.trim(),
		});
	}

	candidates.sort((a, b) => compareDeliveryVersionIds(a.versionId, b.versionId));
	return candidates;
}

async function resolveCommitSha(
	octokit: Octokit,
	commitSha: string,
): Promise<string> {
	const params = await getRepoParams();
	const { data } = await octokit.rest.repos.getCommit({
		...params,
		ref: commitSha,
	});
	return data.sha;
}

async function readTagCommitSha(
	octokit: Octokit,
	tagName: string,
): Promise<string | null> {
	try {
		const params = await getRepoParams();
		const { data } = await octokit.rest.git.getRef({
			...params,
			ref: `tags/${tagName}`,
		});
		return data.object.sha;
	} catch (error) {
		const status = (error as { status?: number }).status;
		if (status === 404) return null;
		throw error;
	}
}

export async function createSuperrepoVersionTags(
	octokit: Octokit,
	versions: SeedVersion[],
	run: SyncRunHandle,
	options?: { dryRun?: boolean },
): Promise<VersionReleaseResult> {
	const candidates = collectVersionReleaseCandidates(versions);
	let created = 0;
	let planned = 0;
	let skipped = 0;
	const errors: string[] = [];

	if (candidates.length === 0) {
		run.log("No released beskid cutoff versions to tag");
		return { created, planned, skipped, errors };
	}

	run.setPhase(
		options?.dryRun
			? "Planning superrepo release tags"
			: "Creating superrepo release tags",
	);
	run.setProgress(0, candidates.length);

	for (const [index, candidate] of candidates.entries()) {
		run.setProgress(index + 1, candidates.length);

		try {
			const targetSha = await resolveCommitSha(octokit, candidate.commitSha);
			const existingSha = await readTagCommitSha(octokit, candidate.tagName);

			if (existingSha) {
				if (
					existingSha.startsWith(candidate.commitSha) ||
					existingSha === targetSha
				) {
					skipped += 1;
					run.log(
						`Tag ${candidate.tagName} already points at ${existingSha.slice(0, 7)} — skipped`,
					);
					continue;
				}

				const message = `Tag ${candidate.tagName} already exists at ${existingSha.slice(0, 7)} (wanted ${targetSha.slice(0, 7)})`;
				errors.push(message);
				run.log(message, "warn");
				skipped += 1;
				continue;
			}

			if (options?.dryRun) {
				planned += 1;
				run.log(
					`[dry-run] Would create tag ${candidate.tagName} -> ${targetSha.slice(0, 7)} (${candidate.versionId} cutoff)`,
				);
				continue;
			}

			const params = await getRepoParams();
			await octokit.rest.git.createRef({
				...params,
				ref: `refs/tags/${candidate.tagName}`,
				sha: targetSha,
			});
			created += 1;
			run.log(
				`Created tag ${candidate.tagName} -> ${targetSha.slice(0, 7)} (${candidate.versionId} cutoff)`,
			);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: `Failed to tag ${candidate.tagName}`;
			errors.push(`${candidate.tagName}: ${message}`);
			run.log(`${candidate.tagName}: ${message}`, "error");
			skipped += 1;
		}
	}

	return { created, planned, skipped, errors };
}

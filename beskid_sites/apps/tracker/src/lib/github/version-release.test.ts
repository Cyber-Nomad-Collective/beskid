import { describe, expect, it } from "vitest";

import {
	collectVersionReleaseCandidates,
	compareDeliveryVersionIds,
	isEligibleForSuperrepoRelease,
} from "#/lib/github/version-release";
import type { SeedVersion } from "#/lib/seed/schemas";

function version(
	partial: Partial<SeedVersion> & Pick<SeedVersion, "id">,
): SeedVersion {
	return {
		title: partial.title ?? partial.id,
		summary: partial.summary ?? "summary",
		theme: partial.theme ?? "theme",
		status: partial.status,
		cutoff: partial.cutoff ?? {
			startDate: "2026-01-01",
			endDate: "2026-01-02",
			endCommitSha: "abc1234",
			endCommitRepo: "beskid",
			rationale: "test",
		},
		...partial,
	};
}

describe("compareDeliveryVersionIds", () => {
	it("sorts delivery versions numerically", () => {
		const ids = ["v0.10", "v0.2", "v0.1", "v0.3"].sort(compareDeliveryVersionIds);
		expect(ids).toEqual(["v0.1", "v0.2", "v0.3", "v0.10"]);
	});
});

describe("isEligibleForSuperrepoRelease", () => {
	it("accepts released beskid cutoffs", () => {
		expect(
			isEligibleForSuperrepoRelease(
				version({
					id: "v0.3",
					status: "Released",
					cutoff: {
						startDate: "2026-05-23",
						endDate: "2026-05-25",
						endCommitSha: "aaddd32",
						endCommitRepo: "beskid",
						rationale: "cutoff",
					},
				}),
			),
		).toBe(true);
	});

	it("rejects in-progress and non-beskid cutoffs", () => {
		expect(
			isEligibleForSuperrepoRelease(
				version({
					id: "v0.4",
					status: "In Progress",
					cutoff: {
						startDate: "2026-05-26",
						endDate: "2026-05-27",
						endCommitSha: "c8e5fc4",
						endCommitRepo: "beskid",
						rationale: "active",
					},
				}),
			),
		).toBe(false);

		expect(
			isEligibleForSuperrepoRelease(
				version({
					id: "v0.0",
					status: "Released",
					cutoff: {
						startDate: "2026-02-18",
						endDate: "2026-03-05",
						endCommitSha: "dd75bff",
						endCommitRepo: "compiler",
						rationale: "compiler handoff",
					},
				}),
			),
		).toBe(false);
	});
});

describe("collectVersionReleaseCandidates", () => {
	it("returns ascending released tags only once", () => {
		const candidates = collectVersionReleaseCandidates([
			version({
				id: "v0.3",
				status: "Released",
				cutoff: {
					startDate: "2026-05-23",
					endDate: "2026-05-25",
					endCommitSha: "aaddd32",
					endCommitRepo: "beskid",
					rationale: "v0.3",
				},
			}),
			version({
				id: "v0.1",
				status: "Released",
				cutoff: {
					startDate: "2026-03-05",
					endDate: "2026-04-22",
					endCommitSha: "f777b79",
					endCommitRepo: "beskid",
					rationale: "v0.1",
				},
			}),
			version({
				id: "v0.2",
				status: "Released",
				cutoff: {
					startDate: "2026-04-23",
					endDate: "2026-05-22",
					endCommitSha: "f57377a",
					endCommitRepo: "beskid",
					rationale: "v0.2",
				},
			}),
			version({
				id: "v0.4",
				status: "In Progress",
				cutoff: {
					startDate: "2026-05-26",
					endDate: "2026-05-27",
					endCommitSha: "c8e5fc4",
					endCommitRepo: "beskid",
					rationale: "v0.4",
				},
			}),
		]);

		expect(candidates.map((candidate) => candidate.versionId)).toEqual([
			"v0.1",
			"v0.2",
			"v0.3",
		]);
		expect(candidates.map((candidate) => candidate.tagName)).toEqual([
			"v0.1",
			"v0.2",
			"v0.3",
		]);
	});
});

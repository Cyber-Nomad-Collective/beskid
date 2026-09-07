import { describe, expect, test } from "vitest";

import { planHistoryBackfill } from "./history-backfill";

const fixtureLedger = {
	bands: [
		{
			versionId: "v0.5",
			repository: "beskid",
			startSha: "0000000",
			endSha: "fffffff",
			workstream: "tracker",
			catalogRevision: "catalog-5",
		},
	],
};

describe("history backfill", () => {
	test("puts ambiguous commits in an explicit unmapped bucket", () => {
		expect(
			planHistoryBackfill(fixtureLedger, [
				{ sha: "abc", subject: "cleanup", repository: "root" },
			]).unmapped,
		).toEqual([{ sha: "abc", confidence: "unmapped" }]);
	});

	test("sorts proposals and uses only reviewed repository ranges", () => {
		const plan = planHistoryBackfill(fixtureLedger, [
			{ sha: "def", subject: "second", repository: "beskid" },
			{ sha: "abc", subject: "first", repository: "beskid" },
		]);

		expect(plan.assignments).toEqual([
			{
				sha: "abc",
				repository: "beskid",
				versionId: "v0.5",
				workstream: "tracker",
				catalogRevision: "catalog-5",
				confidence: "inferred",
			},
			{
				sha: "def",
				repository: "beskid",
				versionId: "v0.5",
				workstream: "tracker",
				catalogRevision: "catalog-5",
				confidence: "inferred",
			},
		]);
		expect(plan.proposalDigest).toMatch(/^[a-f0-9]{64}$/);
	});
});

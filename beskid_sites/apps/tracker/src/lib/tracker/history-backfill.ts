import { createHash } from "node:crypto";

export interface VersionBand {
	versionId: string;
	repository: string;
	startSha: string;
	endSha: string;
	workstream: string;
	catalogRevision: string;
}

export interface VersionBandLedger {
	bands: VersionBand[];
}

export interface HistoryCommit {
	sha: string;
	subject: string;
	repository: string;
}

export interface BackfillAssignment {
	sha: string;
	repository: string;
	versionId: string;
	workstream: string;
	catalogRevision: string;
	confidence: "exact" | "inferred";
}

export interface BackfillProposal {
	assignments: BackfillAssignment[];
	unmapped: Array<{ sha: string; confidence: "unmapped" }>;
	proposalDigest: string;
}

function canonicalJson(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
	if (value && typeof value === "object") {
		const record = value as Record<string, unknown>;
		return `{${Object.keys(record)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
			.join(",")}}`;
	}
	return JSON.stringify(value);
}

function digest(value: Omit<BackfillProposal, "proposalDigest">): string {
	return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function compareCommit(a: HistoryCommit, b: HistoryCommit): number {
	return a.repository.localeCompare(b.repository) || a.sha.localeCompare(b.sha);
}

/**
 * Plans only reviewed mappings. A commit at an explicit band boundary is exact;
 * a repository with one reviewed band is inferred; overlapping bands are never
 * guessed and remain in the visible unmapped bucket.
 */
export function planHistoryBackfill(
	ledger: VersionBandLedger,
	commits: HistoryCommit[],
): BackfillProposal {
	const assignments: BackfillAssignment[] = [];
	const unmapped: BackfillProposal["unmapped"] = [];

	for (const commit of [...commits].sort(compareCommit)) {
		const candidates = ledger.bands.filter(
			(band) => band.repository === commit.repository,
		);
		const exact = candidates.filter(
			(band) => band.startSha === commit.sha || band.endSha === commit.sha,
		);
		const selected =
			exact.length === 1
				? exact[0]
				: candidates.length === 1
					? candidates[0]
					: undefined;
		if (!selected) {
			unmapped.push({ sha: commit.sha, confidence: "unmapped" });
			continue;
		}
		assignments.push({
			sha: commit.sha,
			repository: commit.repository,
			versionId: selected.versionId,
			workstream: selected.workstream,
			catalogRevision: selected.catalogRevision,
			confidence: exact.length === 1 ? "exact" : "inferred",
		});
	}

	const unsigned = { assignments, unmapped };
	return { ...unsigned, proposalDigest: digest(unsigned) };
}

import { readFile } from "node:fs/promises";

import {
	type HistoryCommit,
	planHistoryBackfill,
	type VersionBandLedger,
} from "#/lib/tracker/history-backfill";

function option(name: string): string | undefined {
	const index = process.argv.indexOf(name);
	return index >= 0 ? process.argv[index + 1] : undefined;
}

const ledgerPath = option("--ledger");
if (!ledgerPath) throw new Error("--ledger is required");

const ledger = JSON.parse(
	await readFile(ledgerPath, "utf8"),
) as VersionBandLedger;
const commitsPath = option("--commits");
const commits = commitsPath
	? (JSON.parse(await readFile(commitsPath, "utf8")) as HistoryCommit[])
	: [];

console.log(JSON.stringify(planHistoryBackfill(ledger, commits), null, 2));

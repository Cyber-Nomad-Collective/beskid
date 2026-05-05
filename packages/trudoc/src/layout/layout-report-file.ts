import fs from 'node:fs';
import path from 'node:path';
import { completenessReportSchema, type CompletenessReport } from './schema';

/** Reads `src/generated/platform-spec-layout-report.json` from a Starlight site root (e.g. `site/website`). */
export function readPlatformSpecLayoutReportOrThrow(cwd: string): CompletenessReport {
	const p = path.join(cwd, 'src', 'generated', 'platform-spec-layout-report.json');
	const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
	return completenessReportSchema.parse(raw);
}

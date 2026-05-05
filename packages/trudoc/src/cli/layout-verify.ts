#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { buildLayoutTree } from '../layout/scan';
import { evaluateCompleteness, type NodeScanRow } from '../layout/completeness';
import { parseLayoutContractJson, effectiveLayoutSchema } from '../layout/schema';
import { mergeLayoutContract, toEffectiveLayout } from '../layout/merge';
import { resolveTrudocWebsiteRoot } from './site-root';

const siteRoot = resolveTrudocWebsiteRoot(process.argv, import.meta.url);

function main() {
	const nodes = buildLayoutTree(siteRoot);
	const rows: NodeScanRow[] = nodes.map((n) => ({
		slug: n.slug,
		level: n.level,
		contentPath: n.contentPath,
		body: fs.readFileSync(path.join(siteRoot, 'src', 'content', 'docs', ...n.contentPath.split('/')), 'utf8'),
		effective: n.effective,
	}));
	const report = evaluateCompleteness(rows, { docsRoot: path.join(siteRoot, 'src', 'content', 'docs') });

	const outDir = path.join(siteRoot, 'src', 'generated');
	fs.mkdirSync(outDir, { recursive: true });
	fs.writeFileSync(path.join(outDir, 'platform-spec-layout-report.json'), JSON.stringify(report, null, 2), 'utf8');

	if (report.summary.errors > 0) {
		console.error('\nplatform-spec layout verification failed.\n');
		for (const d of report.diagnostics.filter((x) => x.severity === 'error')) {
			console.error(`- [${d.code}] ${d.slug}: ${d.message}`);
		}
		process.exit(1);
	}

	console.log(
		`platform-spec layout: OK (${report.summary.nodes} nodes, ${report.summary.warnings} warnings). Report written to src/generated/platform-spec-layout-report.json`,
	);
}

/** Smoke-test shared Zod helpers (regression guard). */
function selfCheck() {
	const raw = parseLayoutContractJson(
		{ version: 1, level: 'domain', extends: 'domain-default', pathPrefix: 'platform-spec/x' },
		'selfcheck',
	);
	const merged = mergeLayoutContract(raw, { presetFromExtends: raw.extends });
	effectiveLayoutSchema.parse(toEffectiveLayout(merged));
}

main();
selfCheck();

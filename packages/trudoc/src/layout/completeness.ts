import path from 'node:path';
import type { CompletenessReport, EffectiveLayout, LayoutDiagnostic, LayoutLevel } from './schema';
import { extractBodySignals, hasMarkdownH2, satisfiesSpecSectionRule } from './bodyMeta';
import { validateHubMdxComponents } from './mdxHubComponents';
import { evaluateDocumentStructureAndChildren } from './structureAndChildren';

export type NodeScanRow = {
	slug: string;
	level: LayoutLevel;
	contentPath: string;
	body: string;
	effective: EffectiveLayout;
};

function diag(code: string, severity: LayoutDiagnostic['severity'], slug: string, message: string, detail?: string): LayoutDiagnostic {
	return { code, severity, slug, message, detail };
}

function validateDomainTilesPathPrefix(
	slug: string,
	effective: EffectiveLayout,
): LayoutDiagnostic[] {
	const out: LayoutDiagnostic[] = [];
	const expected = effective.pathPrefix?.replace(/^\/+|\/+$/g, '') ?? '';
	for (const w of effective.effectiveWidgets) {
		if (w.type !== 'domainTiles') continue;
		const got = w.props.pathPrefix.replace(/^\/+|\/+$/g, '');
		if (expected && got !== expected) {
			out.push(
				diag(
					'WIDGET_PATH_PREFIX_MISMATCH',
					'error',
					slug,
					`domainTiles.pathPrefix "${got}" must match layout pathPrefix "${expected}"`,
				),
			);
		}
	}
	return out;
}

export function evaluateCompleteness(nodes: NodeScanRow[], options?: { docsRoot?: string }): CompletenessReport {
	const diagnostics: LayoutDiagnostic[] = [];
	const nodeReports: CompletenessReport['nodes'] = [];

	for (const row of nodes) {
		const signals = extractBodySignals(row.body);
		const messages: LayoutDiagnostic[] = [];
		const eff = row.effective;

		const sectionRows: CompletenessReport['nodes'][number]['sections'] = [];
		for (const rule of eff.effectiveSections) {
			let found = false;
			if (rule.kind === 'specSection') found = satisfiesSpecSectionRule(signals, rule.id);
			else found = hasMarkdownH2(signals, rule.id);
			sectionRows.push({ id: rule.id, required: rule.required, found });
			if (rule.required && !found) {
				const m = diag(
					'MISSING_SECTION',
					'error',
					row.slug,
					`Missing required ${rule.kind} "${rule.id}"`,
					row.contentPath,
				);
				messages.push(m);
				diagnostics.push(m);
			}
		}

		const specCount = signals.specSectionIds.size;
		const h2Count = signals.markdownH2.length;

		if (eff.effectiveMinSpecSections != null && specCount < eff.effectiveMinSpecSections) {
			const m = diag(
				'MIN_SPEC_SECTIONS',
				'error',
				row.slug,
				`Expected at least ${eff.effectiveMinSpecSections} <SpecSection> blocks, found ${specCount}`,
				row.contentPath,
			);
			messages.push(m);
			diagnostics.push(m);
		}
		if (eff.effectiveMinMarkdownHeadings != null && h2Count < eff.effectiveMinMarkdownHeadings) {
			const m = diag(
				'MIN_MARKDOWN_H2',
				'error',
				row.slug,
				`Expected at least ${eff.effectiveMinMarkdownHeadings} "##" headings, found ${h2Count}`,
				row.contentPath,
			);
			messages.push(m);
			diagnostics.push(m);
		}

		const tileMsgs = validateDomainTilesPathPrefix(row.slug, eff);
		for (const m of tileMsgs) {
			messages.push(m);
			diagnostics.push(m);
		}

		if (options?.docsRoot) {
			const absContent = path.join(options.docsRoot, ...row.contentPath.split('/'));
			const hubDir = path.dirname(absContent);
			const featureDir = row.level === 'feature' ? hubDir : undefined;
			for (const m of evaluateDocumentStructureAndChildren(row, featureDir)) {
				messages.push(m);
				diagnostics.push(m);
			}
			for (const m of validateHubMdxComponents(row.slug, row.contentPath, row.body)) {
				messages.push(m);
				diagnostics.push(m);
			}
		}

		const hasErr = messages.some((m) => m.severity === 'error');
		const hasWarn = messages.some((m) => m.severity === 'warning');
		const status = hasErr ? 'fail' : hasWarn ? 'warn' : 'ok';
		nodeReports.push({
			slug: row.slug,
			level: row.level,
			status,
			sections: sectionRows,
			counts: { specSections: specCount, markdownH2: h2Count },
			messages,
		});
	}

	const errors = diagnostics.filter((d) => d.severity === 'error').length;
	const warnings = diagnostics.filter((d) => d.severity === 'warning').length;

	return {
		generatedAt: new Date().toISOString(),
		summary: { nodes: nodes.length, errors, warnings },
		nodes: nodeReports,
		diagnostics,
	};
}

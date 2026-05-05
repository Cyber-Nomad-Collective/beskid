import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { LayoutDiagnostic } from './schema';
import { extractBodySignals, hasMarkdownH2, satisfiesSpecSectionRule } from './bodyMeta';
import type { NodeScanRow } from './completeness';

function diag(
	code: string,
	severity: LayoutDiagnostic['severity'],
	slug: string,
	message: string,
	detail?: string,
): LayoutDiagnostic {
	return { code, severity, slug, message, detail };
}

function escapeRe(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function specSectionOpenPos(body: string, id: string): number {
	const re = new RegExp(`<SpecSection[^>]*\\bid=["']${escapeRe(id)}["']`, 'i');
	return body.search(re);
}

function componentOpenPos(body: string, componentName: string): number {
	const re = new RegExp(`<${escapeRe(componentName)}(\\s|>)`, 'i');
	return body.search(re);
}

function markdownHeadingPos(body: string, slug: string): number {
	const want = slug.toLowerCase();
	const lines = body.split('\n');
	let offset = 0;
	for (const line of lines) {
		const m = /^##\s+(.+)$/.exec(line);
		if (m) {
			const h = m[1].trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
			if (h === want) return offset;
		}
		offset += line.length + 1;
	}
	return -1;
}

function loadYamlTitle(filePath: string): string | null {
	const raw = fs.readFileSync(filePath, 'utf8');
	if (!raw.startsWith('---')) return null;
	const end = raw.indexOf('\n---', 3);
	if (end < 0) return null;
	const fm = parseYaml(raw.slice(3, end).trim()) as { title?: unknown };
	if (typeof fm.title !== 'string') return null;
	const t = fm.title.trim();
	return t.length ? t : null;
}

/**
 * Ordered document steps + child article rules declared on `layout.json` / presets.
 */
export function evaluateDocumentStructureAndChildren(
	row: NodeScanRow,
	featureHubAbsDir: string | undefined,
): LayoutDiagnostic[] {
	const out: LayoutDiagnostic[] = [];
	const body = row.body;
	const ds = row.effective.effectiveDocumentStructure;
	const ca = row.effective.effectiveChildArticles;

	if (ds?.orderedSpecSectionIds?.length) {
		let lastPos = -1;
		for (const id of ds.orderedSpecSectionIds) {
			const sig = extractBodySignals(body);
			if (!satisfiesSpecSectionRule(sig, id)) {
				out.push(
					diag(
						'DOC_STRUCTURE_MISSING',
						'error',
						row.slug,
						`Ordered section "${id}" missing`,
						row.contentPath,
					),
				);
				continue;
			}
			const pos = specSectionOpenPos(body, id);
			if (lastPos >= 0 && pos < lastPos) {
				out.push(
					diag(
						'DOC_STRUCTURE_ORDER',
						'error',
						row.slug,
						`Ordered SpecSection ids: "${id}" appears before an earlier ordered section in the file`,
						row.contentPath,
					),
				);
			}
			lastPos = pos;
		}
	}

	if (ds?.orderedSequence?.length) {
		let lastPos = -1;
		for (const step of ds.orderedSequence) {
			let pos = -1;
			if (step.kind === 'specSection') {
				pos = specSectionOpenPos(body, step.id);
				if (step.required && pos < 0) {
					out.push(
						diag(
							'DOC_STRUCTURE_MISSING',
							'error',
							row.slug,
							`Document structure: missing required <SpecSection id="${step.id}">`,
							row.contentPath,
						),
					);
					continue;
				}
			} else if (step.kind === 'markdownHeading') {
				const sig = extractBodySignals(body);
				const ok = hasMarkdownH2(sig, step.slug);
				pos = ok ? markdownHeadingPos(body, step.slug) : -1;
				if (step.required && !ok) {
					out.push(
						diag(
							'DOC_STRUCTURE_MISSING',
							'error',
							row.slug,
							`Document structure: missing required ## heading for slug "${step.slug}"`,
							row.contentPath,
						),
					);
					continue;
				}
			} else {
				pos = componentOpenPos(body, step.name);
				if (step.required && pos < 0) {
					out.push(
						diag(
							'DOC_STRUCTURE_MISSING',
							'error',
							row.slug,
							`Document structure: missing required <${step.name} />`,
							row.contentPath,
						),
					);
					continue;
				}
			}

			if (pos >= 0) {
				if (lastPos >= 0 && pos < lastPos) {
					out.push(
						diag(
							'DOC_STRUCTURE_ORDER',
							'error',
							row.slug,
							`Document structure: a later step appears before an earlier required step in source order`,
							row.contentPath,
						),
					);
				}
				lastPos = pos;
			}
		}
	}

	if (row.level === 'feature' && ca && featureHubAbsDir && fs.existsSync(featureHubAbsDir)) {
		const articles = fs
			.readdirSync(featureHubAbsDir)
			.filter((f) => /\.(md|mdx)$/i.test(f) && !/^index\./i.test(f))
			.map((f) => path.join(featureHubAbsDir, f));

		if (ca.minDirectArticles != null && articles.length < ca.minDirectArticles) {
			out.push(
				diag(
					'CHILD_ARTICLE_COUNT',
					'error',
					row.slug,
					`Expected at least ${ca.minDirectArticles} direct article(s), found ${articles.length}`,
					featureHubAbsDir,
				),
			);
		}

		if (ca.requireYamlTitle) {
			for (const p of articles) {
				const title = loadYamlTitle(p);
				if (!title) {
					out.push(
						diag(
							'CHILD_ARTICLE_TITLE',
							'error',
							row.slug,
							`Article must declare a non-empty YAML title: ${path.basename(p)}`,
							p,
						),
					);
				}
			}
		}
	}

	return out;
}

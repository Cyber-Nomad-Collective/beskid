import fs from 'node:fs';
import path from 'node:path';
import { buildLayoutTree } from '../layout/scan';
import { evaluateCompleteness, type NodeScanRow } from '../layout/completeness';
import { collectPlatformSpecFrontmatterIssues } from './collect-frontmatter-issues';
import {
	verifyPlatformSpecContent,
	type PlatformSpecContentIssue,
} from './platform-spec-content';

export type ProposalWorkspaceIssue = {
	code: string;
	severity: 'error' | 'warn';
	file: string;
	message: string;
	source: 'frontmatter' | 'content' | 'layout';
};

export type VerifyProposalWorkspaceOptions = {
	websiteRoot: string;
	/** Platform-spec relative paths (posix), e.g. `compiler/mods/index.mdx`. */
	changedRelPaths: string[];
};

export type VerifyProposalWorkspaceResult = {
	ok: boolean;
	issues: ProposalWorkspaceIssue[];
};

function toProposalIssues(
	items: { code: string; severity: 'error' | 'warn'; file: string; message: string }[],
	source: ProposalWorkspaceIssue['source'],
): ProposalWorkspaceIssue[] {
	return items.map((i) => ({ ...i, source }));
}

function collectLayoutIssues(
	websiteRoot: string,
	changedRelPaths: Set<string>,
): ProposalWorkspaceIssue[] {
	const nodes = buildLayoutTree(websiteRoot);
	const rows: NodeScanRow[] = nodes
		.filter((n) => {
			const rel = n.contentPath.replace(/^platform-spec\//, '');
			return changedRelPaths.has(rel);
		})
		.map((n) => ({
			slug: n.slug,
			level: n.level,
			contentPath: n.contentPath,
			body: fs.readFileSync(
				path.join(websiteRoot, 'src', 'content', 'docs', ...n.contentPath.split('/')),
				'utf8',
			),
			effective: n.effective,
		}));

	if (rows.length === 0) return [];

	const report = evaluateCompleteness(rows, {
		docsRoot: path.join(websiteRoot, 'src', 'content', 'docs'),
	});

	return report.diagnostics
		.filter((d) => d.severity === 'error' || d.severity === 'warn')
		.map((d) => ({
			code: d.code,
			severity: d.severity === 'warn' ? 'warn' : 'error',
			file: d.slug.replace(/^platform-spec\//, ''),
			message: d.message,
			source: 'layout' as const,
		}));
}

/**
 * Run platform-spec frontmatter, content, and layout checks for proposal changed paths.
 */
export function verifyProposalWorkspace(
	options: VerifyProposalWorkspaceOptions,
): VerifyProposalWorkspaceResult {
	const { websiteRoot, changedRelPaths } = options;
	const changed = new Set(changedRelPaths.map((p) => p.replace(/\\/g, '/')));

	const frontmatter = collectPlatformSpecFrontmatterIssues(websiteRoot, changed);
	const content: PlatformSpecContentIssue[] = verifyPlatformSpecContent({
		websiteRoot,
		changedOnly: true,
		changedRelPaths: changed,
	});

	const layout = collectLayoutIssues(websiteRoot, changed);

	const issues: ProposalWorkspaceIssue[] = [
		...toProposalIssues(frontmatter, 'frontmatter'),
		...toProposalIssues(content, 'content'),
		...layout,
	];

	const ok = !issues.some((i) => i.severity === 'error');
	return { ok, issues };
}

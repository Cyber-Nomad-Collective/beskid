import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { parse as parseYaml } from 'yaml';

/** Tier-1 language-meta circular canon stubs (Track A); excluded from PSC001 until restored. */
export const LANGUAGE_META_CIRCULAR_CANON_ALLOWLIST = [
	'language-meta/conformance/glossary-and-conformance.mdx',
	'language-meta/surface-syntax/documentation-comments.mdx',
	'language-meta/surface-syntax/lexical-and-syntax.mdx',
	'language-meta/type-system/types.mdx',
	'language-meta/type-system/type-inference.mdx',
	'language-meta/type-system/enums-and-match.mdx',
	'language-meta/type-system/method-dispatch.mdx',
	'language-meta/program-structure/modules-and-visibility.mdx',
	'language-meta/program-structure/name-resolution.mdx',
	'language-meta/evaluation/control-flow.mdx',
	'language-meta/evaluation/events.mdx',
	'language-meta/evaluation/lambdas-and-closures.mdx',
	'language-meta/contracts-and-effects/contracts.mdx',
	'language-meta/contracts-and-effects/error-handling.mdx',
	'language-meta/contracts-and-effects/testing.mdx',
	'language-meta/memory-model/memory-and-references.mdx',
	'language-meta/metaprogramming/metaprogramming.mdx',
] as const;

const CIRCULAR_CANON_MARKER = 'The canonical chapter is';
const SCAFFOLD_MARKER = 'What this article covers';
const STUB_EXPLAINS_MARKER = 'This article explains the';
const NORMATIVE_MIN_WORDS = 80;
const HTML_ENTITY_RE = /&lt;|&gt;|&amp;lt;|&amp;gt;/;

const MANIFEST_FEATURE_PAIRS = [
	{
		slug: 'project-manifest-contract',
		compiler: 'compiler/resolution-and-projects/project-manifest-contract',
		tooling: 'tooling/manifests-and-lockfiles/project-manifest-contract',
	},
	{
		slug: 'workspace-and-lock-contracts',
		compiler: 'compiler/resolution-and-projects/workspace-and-lock-contracts',
		tooling: 'tooling/manifests-and-lockfiles/workspace-and-lock-contracts',
	},
] as const;

const ARTICLE_ROLE_THRESHOLDS: Record<string, { minH2: number; minBodyLines: number }> = {
	'design-model': { minH2: 4, minBodyLines: 30 },
	'contracts-and-edge-cases': { minH2: 4, minBodyLines: 25 },
	'flow-and-algorithm': { minH2: 4, minBodyLines: 25 },
	'verification-and-traceability': { minH2: 3, minBodyLines: 20 },
	examples: { minH2: 3, minBodyLines: 15 },
	'faq-and-troubleshooting': { minH2: 3, minBodyLines: 15 },
};

const LEGACY_LINK_RE = /(?:href:\s*|]\()\/(?:execution|corelib)\//;

export type ContentIssueSeverity = 'error' | 'warn';

export type PlatformSpecContentIssue = {
	code: string;
	severity: ContentIssueSeverity;
	file: string;
	message: string;
};

export type PlatformSpecContentVerifyOptions = {
	websiteRoot: string;
	/** Emit issues as warnings and exit 0 (CI / prebuild default). */
	warnOnly?: boolean;
	/** Only report issues for platform-spec paths changed in git (staged + unstaged vs HEAD). */
	changedOnly?: boolean;
};

type PathLevel = 'feature' | 'article' | 'adr' | 'other';

function walk(dir: string, out: string[] = []): string[] {
	if (!fs.existsSync(dir)) return out;
	for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, name.name);
		if (name.isDirectory()) walk(p, out);
		else if (/\.(md|mdx)$/i.test(name.name)) out.push(p);
	}
	return out;
}

function loadFrontmatter(filePath: string): Record<string, unknown> {
	const raw = fs.readFileSync(filePath, 'utf8');
	if (!raw.startsWith('---')) return {};
	const end = raw.indexOf('\n---', 3);
	if (end === -1) return {};
	return (parseYaml(raw.slice(3, end).trim()) as Record<string, unknown> | null) ?? {};
}

function bodyAfterFrontmatter(raw: string): string {
	if (!raw.startsWith('---')) return raw;
	const end = raw.indexOf('\n---', 3);
	if (end === -1) return raw;
	return raw.slice(end + 4);
}

function classifyPath(filePath: string): PathLevel {
	const normalized = filePath.split(path.sep).join('/');
	const marker = '/src/content/docs/platform-spec/';
	const index = normalized.indexOf(marker);
	if (index === -1) return 'other';
	const relative = normalized.slice(index + marker.length).replace(/\.(md|mdx)$/i, '');
	const segments = relative.split('/').filter(Boolean);
	const isIndex = segments.at(-1) === 'index';
	if (segments.length === 4 && isIndex) return 'feature';
	if (segments.length >= 5 && segments.at(-2) === 'adr' && !isIndex) return 'adr';
	if ((segments.length === 3 || segments.length >= 4) && !isIndex && segments.at(-2) !== 'adr') return 'article';
	return 'other';
}

function platformSpecRel(filePath: string, websiteRoot: string): string {
	const root = path.join(websiteRoot, 'src', 'content', 'docs', 'platform-spec');
	return path.relative(root, filePath).split(path.sep).join('/');
}

function stripBoilerplateForNormativeCount(body: string): string {
	return body
		.split('\n')
		.filter((line) => {
			const t = line.trim();
			if (!t) return false;
			if (t.startsWith('import ')) return false;
			if (t.startsWith('<') && t.endsWith('>')) return false;
			if (t.includes(CIRCULAR_CANON_MARKER)) return false;
			if (/^##\s+Platform view/i.test(t)) return false;
			return true;
		})
		.join('\n');
}

function normativeWordCount(body: string): number {
	const text = stripBoilerplateForNormativeCount(body);
	const lines = text.split('\n').filter((line) => /\b(MUST|SHOULD|MAY)\b/.test(line));
	return lines.join(' ').split(/\s+/).filter(Boolean).length;
}

function countH2Sections(body: string): number {
	return (body.match(/^##\s+/gm) ?? []).length;
}

function countBodyLines(body: string): number {
	return body
		.split('\n')
		.filter((line) => {
			const t = line.trim();
			if (!t) return false;
			if (t.startsWith('import ')) return false;
			if (t.startsWith('<') && (t.includes('/>') || t.endsWith('>'))) return false;
			return true;
		}).length;
}

function articleRoleFromPath(rel: string): string | null {
	const base = path.basename(rel, path.extname(rel));
	return ARTICLE_ROLE_THRESHOLDS[base] ? base : null;
}

function hasDecisionsSection(body: string, featureHasAdr: boolean): boolean {
	return (
		/^##\s+Decisions\b/im.test(body) ||
		/decisions-record/i.test(body) ||
		/feature\/adr\//i.test(body) ||
		/\.\/adr\//i.test(body) ||
		featureHasAdr
	);
}

function featureDirFromHubRel(rel: string): string {
	return path.dirname(rel);
}

function featureHasAdrFiles(specRoot: string, featureHubRel: string): boolean {
	const adrDir = path.join(specRoot, featureDirFromHubRel(featureHubRel), 'adr');
	if (!fs.existsSync(adrDir)) return false;
	return fs
		.readdirSync(adrDir, { withFileTypes: true })
		.some((entry) => entry.isFile() && /\.(md|mdx)$/i.test(entry.name));
}

function relatedTopicIsNonNormativeBridge(
	relatedTopics: unknown,
	legacyPrefix: '/execution/' | '/corelib/',
): boolean {
	if (!Array.isArray(relatedTopics)) return false;
	return relatedTopics.some((topic) => {
		if (!topic || typeof topic !== 'object') return false;
		const href = String((topic as { href?: string }).href ?? '');
		const relation = String((topic as { relation?: string }).relation ?? '');
		if (!href.startsWith(legacyPrefix)) return false;
		return /non[- ]?normative/i.test(relation);
	});
}

function proseMarksNonNormativeNearLink(body: string, legacyPrefix: '/execution/' | '/corelib/'): boolean {
	const idx = body.indexOf(legacyPrefix);
	if (idx === -1) return false;
	const window = body.slice(Math.max(0, idx - 240), idx + legacyPrefix.length + 240);
	return /non[- ]?normative|informative only/i.test(window);
}

function extractMarkdownTableSignatures(body: string): string[] {
	const lines = body.split('\n');
	const signatures: string[] = [];
	let i = 0;
	while (i < lines.length) {
		const line = lines[i]?.trim() ?? '';
		if (!line.startsWith('|')) {
			i += 1;
			continue;
		}
		const block: string[] = [];
		while (i < lines.length && lines[i]?.trim().startsWith('|')) {
			block.push(lines[i]!.trim());
			i += 1;
		}
		if (block.length < 2) continue;
		const header = block[0]!;
		if (!/\bKey\b/i.test(header) || !/\bRequired\b/i.test(header)) continue;
		signatures.push(block.map((row) => row.replace(/\s+/g, ' ').toLowerCase()).join('\n'));
	}
	return signatures;
}

function gitChangedPlatformSpecPaths(websiteRoot: string): Set<string> | null {
	try {
		const specRoot = path.join(websiteRoot, 'src', 'content', 'docs', 'platform-spec');
		const out = execSync('git diff --name-only HEAD', {
			cwd: websiteRoot,
			encoding: 'utf8',
			stdio: ['pipe', 'pipe', 'ignore'],
		});
		const staged = execSync('git diff --cached --name-only', {
			cwd: websiteRoot,
			encoding: 'utf8',
			stdio: ['pipe', 'pipe', 'ignore'],
		});
		const combined = new Set<string>();
		for (const chunk of [out, staged]) {
			for (const line of chunk.split('\n')) {
				const trimmed = line.trim();
				if (!trimmed) continue;
				const abs = path.isAbsolute(trimmed) ? trimmed : path.join(websiteRoot, trimmed);
				if (abs.startsWith(specRoot)) {
					combined.add(platformSpecRel(abs, websiteRoot));
				}
			}
		}
		return combined;
	} catch {
		return null;
	}
}

function checkCircularCanon(rel: string, body: string): PlatformSpecContentIssue | null {
	if (LANGUAGE_META_CIRCULAR_CANON_ALLOWLIST.includes(rel as (typeof LANGUAGE_META_CIRCULAR_CANON_ALLOWLIST)[number])) {
		return null;
	}
	if (!body.includes(CIRCULAR_CANON_MARKER)) return null;
	if (normativeWordCount(body) >= NORMATIVE_MIN_WORDS) return null;
	return {
		code: 'PSC001',
		severity: 'error',
		file: rel,
		message: `circular canon boilerplate without ≥${NORMATIVE_MIN_WORDS} MUST/SHOULD/MAY normative words`,
	};
}

function bodyOutsideFencedCode(body: string): string {
	const lines = body.split('\n');
	const out: string[] = [];
	let inFence = false;
	for (const line of lines) {
		if (/^```/.test(line.trim())) {
			inFence = !inFence;
			continue;
		}
		if (!inFence) out.push(line);
	}
	return out.join('\n');
}

const ENTITY_CHECK_SKIP_RELS = new Set([
	'community/spec-maintenance/feature-hub-article-bundle-template.mdx',
]);

function checkHtmlEntityGenerics(rel: string, body: string): PlatformSpecContentIssue | null {
	if (ENTITY_CHECK_SKIP_RELS.has(rel)) return null;
	const prose = bodyOutsideFencedCode(body);
	if (!HTML_ENTITY_RE.test(prose)) return null;
	return {
		code: 'PSC006',
		severity: 'error',
		file: rel,
		message:
			'prose uses HTML entities (&lt;, &gt;) for generics; use backtick literals like `Fiber<T>` instead',
	};
}

function checkStubExplainsBoilerplate(rel: string, body: string): PlatformSpecContentIssue | null {
	if (!body.includes(STUB_EXPLAINS_MARKER)) return null;
	const role = articleRoleFromPath(rel);
	const thresholds = (role && ARTICLE_ROLE_THRESHOLDS[role]) ?? { minH2: 3, minBodyLines: 20 };
	const h2 = countH2Sections(body);
	const lines = countBodyLines(body);
	if (h2 >= thresholds.minH2 && lines >= thresholds.minBodyLines) return null;
	return {
		code: 'PSC007',
		severity: 'error',
		file: rel,
		message: `stub article ("${STUB_EXPLAINS_MARKER}") needs ≥${thresholds.minH2} ## sections and ≥${thresholds.minBodyLines} body lines (has ${h2} sections, ${lines} lines)`,
	};
}

function checkScaffoldBoilerplate(rel: string, body: string): PlatformSpecContentIssue | null {
	if (!body.includes(SCAFFOLD_MARKER)) return null;
	const role = articleRoleFromPath(rel);
	const thresholds = (role && ARTICLE_ROLE_THRESHOLDS[role]) ?? { minH2: 3, minBodyLines: 20 };
	const h2 = countH2Sections(body);
	const lines = countBodyLines(body);
	if (h2 >= thresholds.minH2 && lines >= thresholds.minBodyLines) return null;
	return {
		code: 'PSC002',
		severity: 'error',
		file: rel,
		message: `scaffold article ("${SCAFFOLD_MARKER}") needs ≥${thresholds.minH2} ## sections and ≥${thresholds.minBodyLines} body lines (has ${h2} sections, ${lines} lines)`,
	};
}

function checkStandardFeatureDecisions(
	specRoot: string,
	rel: string,
	pathLevel: PathLevel,
	frontmatter: Record<string, unknown>,
	body: string,
): PlatformSpecContentIssue | null {
	if (pathLevel !== 'feature' || frontmatter.status !== 'Standard') return null;
	const hasAdr = featureHasAdrFiles(specRoot, rel);
	if (hasDecisionsSection(body, hasAdr)) return null;
	return {
		code: 'PSC003',
		severity: 'error',
		file: rel,
		message:
			'Standard feature hub missing ## Decisions, decisions-record link, or at least one file under adr/',
	};
}

function checkAdrSections(rel: string, pathLevel: PathLevel, body: string): PlatformSpecContentIssue | null {
	if (pathLevel !== 'adr') return null;
	const hasContext = /^##\s+Context\b/im.test(body);
	const hasDecision = /^##\s+Decision\b/im.test(body);
	if (hasContext && hasDecision) return null;
	return {
		code: 'PSC006',
		severity: 'error',
		file: rel,
		message: 'ADR page must include ## Context and ## Decision sections',
	};
}

function checkStaleLegacyBridge(
	rel: string,
	frontmatter: Record<string, unknown>,
	body: string,
	raw: string,
): PlatformSpecContentIssue | null {
	if (frontmatter.status !== 'Standard') return null;

	const haystack = `${raw}\n${body}`;
	if (!LEGACY_LINK_RE.test(haystack)) return null;

	for (const prefix of ['/execution/', '/corelib/'] as const) {
		if (!haystack.includes(prefix)) continue;
		if (relatedTopicIsNonNormativeBridge(frontmatter.relatedTopics, prefix)) continue;
		if (proseMarksNonNormativeNearLink(body, prefix)) continue;
		return {
			code: 'PSC005',
			severity: 'error',
			file: rel,
			message: `Standard page links ${prefix} without non-normative relation in relatedTopics or nearby prose`,
		};
	}
	return null;
}

function checkDuplicateManifestTables(websiteRoot: string, issues: PlatformSpecContentIssue[]): void {
	const specRoot = path.join(websiteRoot, 'src', 'content', 'docs', 'platform-spec');

	for (const pair of MANIFEST_FEATURE_PAIRS) {
		const compilerDir = path.join(specRoot, pair.compiler);
		const toolingDir = path.join(specRoot, pair.tooling);
		const compilerTables = new Map<string, string[]>();
		const toolingTables = new Map<string, string[]>();

		for (const [dir, bucket] of [
			[compilerDir, compilerTables],
			[toolingDir, toolingTables],
		] as const) {
			if (!fs.existsSync(dir)) continue;
			for (const file of walk(dir)) {
				const rel = platformSpecRel(file, websiteRoot);
				const sigs = extractMarkdownTableSignatures(bodyAfterFrontmatter(fs.readFileSync(file, 'utf8')));
				for (const sig of sigs) {
					const list = bucket.get(sig) ?? [];
					list.push(rel);
					bucket.set(sig, list);
				}
			}
		}

		for (const [sig, compilerFiles] of compilerTables) {
			const toolingFiles = toolingTables.get(sig);
			if (!toolingFiles?.length) continue;
			issues.push({
				code: 'PSC004',
				severity: 'error',
				file: pair.slug,
				message: `duplicate normative key table between compiler and tooling manifest features (${compilerFiles.join(', ')} ↔ ${toolingFiles.join(', ')})`,
			});
		}
	}
}

export function verifyPlatformSpecContent(
	options: PlatformSpecContentVerifyOptions,
): PlatformSpecContentIssue[] {
	const { websiteRoot, changedOnly = false } = options;
	const specRoot = path.join(websiteRoot, 'src', 'content', 'docs', 'platform-spec');
	const files = walk(specRoot);
	const changed = changedOnly ? gitChangedPlatformSpecPaths(websiteRoot) : null;
	const issues: PlatformSpecContentIssue[] = [];

	for (const file of files) {
		const rel = platformSpecRel(file, websiteRoot);
		if (changed && !changed.has(rel)) continue;

		const raw = fs.readFileSync(file, 'utf8');
		const body = bodyAfterFrontmatter(raw);
		let frontmatter: Record<string, unknown> = {};
		try {
			frontmatter = loadFrontmatter(file);
		} catch {
			continue;
		}
		const pathLevel = classifyPath(file);

		for (const check of [
			checkCircularCanon(rel, body),
			checkHtmlEntityGenerics(rel, body),
			checkStubExplainsBoilerplate(rel, body),
			checkScaffoldBoilerplate(rel, body),
			checkStandardFeatureDecisions(specRoot, rel, pathLevel, frontmatter, body),
			checkAdrSections(rel, pathLevel, body),
			checkStaleLegacyBridge(rel, frontmatter, body, raw),
		]) {
			if (check) issues.push(check);
		}
	}

	checkDuplicateManifestTables(websiteRoot, issues);

	if (options.warnOnly) {
		for (const issue of issues) issue.severity = 'warn';
	}

	return issues;
}

function summarizeByCode(issues: PlatformSpecContentIssue[]): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const issue of issues) {
		counts[issue.code] = (counts[issue.code] ?? 0) + 1;
	}
	return counts;
}

export function runPlatformSpecContentVerify(argv: string[]): void {
	const warnOnly = argv.includes('--warn-only');
	const changedOnly = argv.includes('--changed-only');

	const websiteRoot = process.env.BESKID_WEBSITE_ROOT?.trim() || process.cwd();
	const issues = verifyPlatformSpecContent({
		websiteRoot,
		warnOnly,
		changedOnly,
	});

	const specRoot = path.join(websiteRoot, 'src', 'content', 'docs', 'platform-spec');
	const fileCount = walk(specRoot).length;
	const byCode = summarizeByCode(issues);
	const errors = issues.filter((i) => i.severity === 'error');
	const warnings = issues.filter((i) => i.severity === 'warn');

	const modeLabel = warnOnly
		? 'warn-only (CI / prebuild; exits 0 on findings)'
		: 'strict (default; omit --warn-only locally)';

	console.log(`platform-spec content verify [${modeLabel}]: scanned ${fileCount} file(s).`);
	if (changedOnly) console.log('  filter: changed platform-spec paths only (--changed-only).');
	if (!warnOnly) console.log('  allowlist: PSC001 skips 16 language-meta Tier-1 stub paths until Track A.');

	for (const [code, count] of Object.entries(byCode).sort(([a], [b]) => a.localeCompare(b))) {
		console.log(`  ${code}: ${count}`);
	}

	if (issues.length) {
		const grouped = new Map<string, PlatformSpecContentIssue[]>();
		for (const issue of issues) {
			const list = grouped.get(issue.file) ?? [];
			list.push(issue);
			grouped.set(issue.file, list);
		}
		for (const [file, fileIssues] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
			console.error(`\n[platform-spec-content] ${file}:`);
			for (const issue of fileIssues) {
				const tag = issue.severity === 'warn' ? 'warn' : 'error';
				console.error(`  - ${issue.code} (${tag}): ${issue.message}`);
			}
		}
	}

	if (errors.length) {
		console.error(`\nplatform-spec content verification failed (${errors.length} error(s)).`);
		process.exit(1);
	}
	if (warnings.length) {
		console.warn(`\nplatform-spec content verification: ${warnings.length} warning(s), continuing.`);
	} else {
		console.log('\nplatform-spec content verification passed.');
	}
}

const isMain =
	typeof process.argv[1] === 'string' &&
	(process.argv[1].endsWith('platform-spec-content.ts') ||
		process.argv[1].endsWith('platform-spec-content.mjs'));
if (isMain) {
	runPlatformSpecContentVerify(process.argv.slice(2));
}

#!/usr/bin/env bun
/**
 * Sync Beskid platform-spec + book progress into Mission Control (tasks + skills).
 *
 * Mission Control has no document-ingestion pipeline; it uses:
 * - Skills Library (markdown injected into agent prompts)
 * - Tasks/goals (kanban + Eisenhower)
 * - data/ai-context.md (run `bun run gen:context` in mission-control after sync)
 *
 * Prerequisites:
 *   - Mission Control dev server: http://127.0.0.1:3000
 *   - Generated nav tree: cd site/website && bun run generate:platform-spec-nav-tree
 *
 * Usage:
 *   bun ci/sync-mission-control.mjs --all
 *   bun ci/sync-mission-control.mjs --book --spec --skills
 *   bun ci/sync-mission-control.mjs --dry-run --spec
 *
 * Env:
 *   MISSION_CONTROL_URL  (default http://127.0.0.1:3000)
 *   MC_PROJECT_ID        (default proj_gCvYQ2EyYBwK — beskid venture)
 *   MC_DOCS_MILESTONE_ID (default goal_DM0t4irzSFPA — public docs milestone)
 *   MC_SPEC_MILESTONE_ID (optional; defaults to MC_DOCS_MILESTONE_ID)
 */
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const WEBSITE = path.join(REPO_ROOT, 'site/website');
const BOOK_ROOT = path.join(WEBSITE, 'src/content/docs/book');
const SPEC_ROOT = path.join(WEBSITE, 'src/content/docs/platform-spec');
const NAV_TREE = path.join(WEBSITE, 'src/generated/platform-spec-nav-tree.json');
const BOOK_NAV = path.join(BOOK_ROOT, 'nav.order.json');

const MC_URL = process.env.MISSION_CONTROL_URL ?? 'http://127.0.0.1:3000';
const PROJECT_ID = process.env.MC_PROJECT_ID ?? 'proj_gCvYQ2EyYBwK';
const DOCS_MILESTONE = process.env.MC_DOCS_MILESTONE_ID ?? 'goal_DM0t4irzSFPA';
const SPEC_MILESTONE = process.env.MC_SPEC_MILESTONE_ID ?? DOCS_MILESTONE;

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const syncAll = args.has('--all');
const syncBook = syncAll || args.has('--book');
const syncSpec = syncAll || args.has('--spec');
const doSkills = syncAll || args.has('--skills');

if (!syncBook && !syncSpec && !doSkills) {
	console.error('Specify --book, --spec, --skills, or --all');
	process.exit(1);
}

async function mc(method, apiPath, body) {
	const url = `${MC_URL}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`;
	const init = { method };
	if (body != null) {
		init.headers = { 'Content-Type': 'application/json' };
		init.body = JSON.stringify(body);
	}
	const res = await fetch(url, init);
	const text = await res.text();
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		data = text;
	}
	if (!res.ok) {
		throw new Error(`${method} ${apiPath} → ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
	}
	return data;
}

function syncTag(kind, slug) {
	return `sync:${kind}:${slug}`;
}

function readFrontmatter(filePath) {
	if (!fs.existsSync(filePath)) return {};
	const raw = fs.readFileSync(filePath, 'utf8');
	if (!raw.startsWith('---')) return {};
	const end = raw.indexOf('\n---', 3);
	if (end === -1) return {};
	const block = raw.slice(3, end).trim();
	const fm = {};
	for (const line of block.split('\n')) {
		const m = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
		if (m) fm[m[1]] = m[2].replace(/^["']|["']$/g, '');
	}
	return fm;
}

function bodyMetrics(filePath) {
	if (!fs.existsSync(filePath)) return { exists: false, words: 0, h2: 0 };
	const raw = fs.readFileSync(filePath, 'utf8');
	let body = raw;
	if (raw.startsWith('---')) {
		const end = raw.indexOf('\n---', 3);
		body = end === -1 ? raw : raw.slice(end + 4);
	}
	const words = body.split(/\s+/).filter(Boolean).length;
	const h2 = (body.match(/^## /gm) ?? []).length;
	const stub =
		/\b(TODO|Coming soon|Placeholder)\b/i.test(body) && words < 120;
	return { exists: true, words, h2, stub };
}

function bookFileForSlug(slug) {
	if (slug === 'index') return path.join(BOOK_ROOT, 'index.md');
	const base = path.join(BOOK_ROOT, slug);
	for (const ext of ['.mdx', '.md']) {
		const p = base + ext;
		if (fs.existsSync(p)) return p;
	}
	return null;
}

function flattenBookEntries(nav) {
	const out = [];
	for (const section of Object.values(nav)) {
		if (!section?.entries) continue;
		for (const entry of section.entries) {
			if (entry.includes('/')) out.push(entry);
			else {
				const indexFile = bookFileForSlug(entry);
				if (indexFile) out.push(entry);
			}
		}
	}
	return [...new Set(out)];
}

function walkNav(node, acc = []) {
	acc.push(node);
	for (const c of node.children ?? []) walkNav(c, acc);
	return acc;
}

function loadSpecFeatures() {
	if (!fs.existsSync(NAV_TREE)) {
		throw new Error(`Missing ${NAV_TREE}. Run: bun --cwd site/website run generate:platform-spec-nav-tree`);
	}
	const { tree } = JSON.parse(fs.readFileSync(NAV_TREE, 'utf8'));
	return walkNav(tree).filter((n) => n.level === 'feature');
}

function specFeaturePaths(slug) {
	const rel = slug.replace(/^platform-spec\//, '');
	return path.join(SPEC_ROOT, rel, 'index.mdx');
}

function specStatus(slug) {
	const indexPath = specFeaturePaths(slug);
	const fm = readFrontmatter(indexPath);
	const status = String(fm.status ?? 'Unknown').trim();
	return status;
}

function bookDone(slug) {
	const file = bookFileForSlug(slug);
	if (!file) return false;
	const m = bodyMetrics(file);
	return m.exists && !m.stub && m.words >= 80 && m.h2 >= 1;
}

function specDone(slug) {
	const status = specStatus(slug);
	return status === 'Standard';
}

async function loadProjectTasks() {
	const { tasks = [] } = await mc('GET', `/api/tasks?projectId=${PROJECT_ID}&limit=500`);
	const byTag = new Map();
	for (const t of tasks) {
		for (const tag of t.tags ?? []) {
			if (tag.startsWith('sync:')) byTag.set(tag, t);
		}
	}
	return byTag;
}

async function upsertTask(byTag, payload) {
	const tag = payload.tags[0];
	const existing = byTag.get(tag);
	if (dryRun) {
		console.log(existing ? `  [update] ${payload.title} → ${payload.kanban}` : `  [create] ${payload.title} → ${payload.kanban}`);
		return existing?.id ?? 'dry-run';
	}
	if (existing) {
		const updated = await mc('PUT', '/api/tasks', {
			id: existing.id,
			title: payload.title,
			description: payload.description,
			kanban: payload.kanban,
			importance: payload.importance,
			urgency: payload.urgency,
			milestoneId: payload.milestoneId,
			tags: payload.tags,
			notes: payload.notes,
		});
		return updated.id;
	}
	const created = await mc('POST', '/api/tasks', payload);
	byTag.set(tag, created);
	return created.id;
}

function buildPlatformSpecSkill(features, domains) {
	const lines = [
		'# Beskid platform specification map',
		'',
		'Canonical tree on disk: `site/website/src/content/docs/platform-spec/`',
		'Public URLs: `/platform-spec/...` on https://beskid-lang.org',
		'',
		'**Spec leads code** — extend normative spec before observable behavior changes.',
		'Verify after edits: `cd site/website && bun run verify:trudoc -- --preset ci`',
		'',
		'## Domains',
		...domains.map((d) => `- **${d.title}** — \`${d.slug}\` → ${d.href}`),
		'',
		'## Features (hub pages)',
		'| Status | Feature | Path |',
		'|--------|---------|------|',
	];
	for (const f of features.sort((a, b) => a.slug.localeCompare(b.slug))) {
		const st = specStatus(f.slug);
		const rel = f.slug.replace(/^platform-spec\//, '');
		lines.push(`| ${st} | ${f.title} | \`${rel}/index.mdx\` |`);
	}
	lines.push('', `_${features.length} features — synced ${new Date().toISOString().slice(0, 10)}_`);
	return lines.join('\n');
}

function buildBookSkill(entries) {
	const lines = [
		'# Beskid Book (informative) map',
		'',
		'Canonical tree: `site/website/src/content/docs/book/`',
		'Nav manifest: `book/nav.order.json`',
		'',
		'**Author-owned images** — do not rewrite `![...](...)` in book Markdown unless explicitly asked.',
		'',
		'## Chapters (tutorial entries)',
	];
	const byChapter = new Map();
	for (const slug of entries) {
		const ch = slug.split('/')[0];
		if (!byChapter.has(ch)) byChapter.set(ch, []);
		byChapter.get(ch).push(slug);
	}
	for (const [ch, pages] of [...byChapter.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
		const done = pages.filter(bookDone).length;
		lines.push(`- **${ch}** — ${done}/${pages.length} pages drafted`);
	}
	return lines.join('\n');
}

async function syncSkills(features, bookEntries) {
	const tree = JSON.parse(fs.readFileSync(NAV_TREE, 'utf8'));
	const domains = walkNav(tree.tree).filter((n) => n.level === 'domain');

	const specs = [
		{
			id: 'skill_beskid_platform_spec',
			name: 'Beskid platform specification',
			description: 'Normative spec domain/feature map synced from trudoc nav tree',
			content: buildPlatformSpecSkill(features, domains),
			agentIds: ['developer', 'researcher', 'business-analyst'],
			tags: ['beskid', 'platform-spec', 'sync'],
		},
		{
			id: 'skill_beskid_book',
			name: 'Beskid Book',
			description: 'Informative book chapter map and authoring rules',
			content: buildBookSkill(bookEntries),
			agentIds: ['developer', 'marketer', 'me'],
			tags: ['beskid', 'book', 'sync'],
		},
		{
			id: 'skill_beskid_workspace',
			name: 'Beskid superrepo layout',
			description: 'Submodule map and verification commands',
			content: `# Beskid superrepo

Root: \`${REPO_ROOT}\`

| Path | Role |
|------|------|
| compiler/ | Rust compiler, CLI, LSP, nested corelib |
| pckg/ | Package registry (.NET) |
| site/website/ | Astro docs (platform-spec + book) |
| beskid_vscode/ | VS Code extension |
| packages/trudoc/ | Docs validation + nav generation |

## Commands
- Website dev: \`cd site/website && bun run dev\`
- Trudoc verify: \`cd site/website && bun run verify:trudoc -- --preset ci\`
- Sync MC: \`bun ci/sync-mission-control.mjs --all\`

Read \`AGENTS.md\` at repo root for agent conventions.`,
			agentIds: ['developer', 'researcher', 'tester'],
			tags: ['beskid', 'workspace', 'sync'],
		},
	];

	const { skills = [] } = await mc('GET', '/api/skills?limit=200');
	const existingIds = new Set(skills.map((s) => s.id));

	for (const skill of specs) {
		if (dryRun) {
			console.log(existingIds.has(skill.id) ? `[skill update] ${skill.id}` : `[skill create] ${skill.id}`);
			continue;
		}
		if (existingIds.has(skill.id)) {
			await mc('PUT', '/api/skills', { ...skill, updatedAt: new Date().toISOString() });
		} else {
			await mc('POST', '/api/skills', skill);
		}
	}

	if (!dryRun) {
		await mc('POST', '/api/sync');
	}
}

async function main() {
	try {
		await mc('GET', '/api/server-status');
	} catch (e) {
		console.error(`Mission Control not reachable at ${MC_URL}`);
		console.error(e.message);
		console.error('Start it: cd ~/mcp/mc/mission-control && pnpm dev');
		process.exit(1);
	}

	console.log(`Mission Control sync → project ${PROJECT_ID}${dryRun ? ' (dry-run)' : ''}`);

	const byTag = await loadProjectTasks();
	let created = 0;
	let updated = 0;

	if (syncBook) {
		const nav = JSON.parse(fs.readFileSync(BOOK_NAV, 'utf8'));
		const entries = flattenBookEntries(nav);
		console.log(`\nBook: ${entries.length} pages`);
		for (const slug of entries) {
			const file = bookFileForSlug(slug);
			const fm = file ? readFrontmatter(file) : {};
			const title = fm.title ?? slug.split('/').pop();
			const done = bookDone(slug);
			const tag = syncTag('book', slug);
			const had = byTag.has(tag);
			await upsertTask(byTag, {
				title: `[Book] ${title}`,
				description: `Informative book page.\n\n- Source: \`site/website/src/content/docs/book/${slug}.md(x)\`\n- URL: /book/${slug}/\n- Sync tag: \`${tag}\``,
				importance: done ? 'not-important' : 'important',
				urgency: done ? 'not-urgent' : 'urgent',
				kanban: done ? 'done' : 'not-started',
				projectId: PROJECT_ID,
				milestoneId: DOCS_MILESTONE,
				assignedTo: done ? null : 'me',
				tags: [tag, 'book', 'sync'],
				notes: file ? `words=${bodyMetrics(file).words}` : 'missing file',
			});
			if (had) updated++;
			else created++;
		}
	}

	if (syncSpec) {
		const features = loadSpecFeatures();
		console.log(`\nPlatform spec: ${features.length} features`);
		for (const f of features) {
			const slug = f.slug;
			const status = specStatus(slug);
			const done = specDone(slug);
			const draft = status === 'Draft' || status === 'Proposed';
			const tag = syncTag('spec', slug);
			const had = byTag.has(tag);
			const rel = slug.replace(/^platform-spec\//, '');
			await upsertTask(byTag, {
				title: `[Spec] ${f.title}`,
				description: `Normative feature hub.\n\n- Status: **${status}**\n- Source: \`site/website/src/content/docs/platform-spec/${rel}/index.mdx\`\n- URL: ${f.href}\n- Sync tag: \`${tag}\``,
				importance: done ? 'not-important' : 'important',
				urgency: draft ? 'urgent' : 'not-urgent',
				kanban: done ? 'done' : draft ? 'not-started' : 'in-progress',
				projectId: PROJECT_ID,
				milestoneId: SPEC_MILESTONE,
				assignedTo: done ? null : 'developer',
				tags: [tag, 'platform-spec', 'sync', status.toLowerCase()],
				notes: `specStatus=${status}`,
			});
			if (had) updated++;
			else created++;
		}
	}

	if (doSkills) {
		const features = loadSpecFeatures();
		const nav = JSON.parse(fs.readFileSync(BOOK_NAV, 'utf8'));
		const bookEntries = flattenBookEntries(nav);
		console.log('\nSkills: platform-spec, book, workspace');
		await syncSkills(features, bookEntries);
	}

	if (!dryRun) {
		console.log('\nRegenerating ai-context.md in Mission Control…');
		const proc = Bun.spawn(['bun', 'run', 'gen:context'], {
			cwd: process.env.MISSION_CONTROL_ROOT ?? path.join(process.env.HOME, 'mcp/mc/mission-control'),
			stdout: 'inherit',
			stderr: 'inherit',
		});
		await proc.exited;
	}

	console.log(`\nDone. Tasks touched: ~${created + updated} (approx; includes updates).`);
	console.log(`Open http://127.0.0.1:3000/ventures/${PROJECT_ID}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

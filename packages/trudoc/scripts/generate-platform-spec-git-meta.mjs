/**
 * Build-time git history for platform-spec docs. Writes JSON consumed by SpecDocHistory.
 * Keys are paths relative to site/website (e.g. src/content/docs/platform-spec/...).
 */
import { execFile, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { getWebsiteRoot } from './lib/website-root.mjs';

const execFileAsync = promisify(execFile);

const WEBSITE_ROOT = getWebsiteRoot(import.meta.url);
const SPEC_ROOT = path.join(WEBSITE_ROOT, 'src', 'content', 'docs', 'platform-spec');
const OUT_DIR = path.join(WEBSITE_ROOT, 'src', 'generated');
const OUT_FILE = path.join(OUT_DIR, 'platform-spec-git-meta.json');
const MAX_COMMITS = 50;
const GIT_CONCURRENCY = Math.max(1, Number.parseInt(process.env.PLATFORM_SPEC_GIT_META_CONCURRENCY ?? '24', 10) || 24);
const defaultRepoJsonPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'platform-spec', 'beskid-default-repo.json');
const DEFAULT_REPO = JSON.parse(fs.readFileSync(defaultRepoJsonPath, 'utf8')).repo;
const DEFAULT_BRANCH = process.env.GITHUB_DEFAULT_BRANCH?.trim() || 'main';
const GIT_LOG_ARGS = ['-c', 'core.quotepath=false', 'log', '--follow', '--date=iso-strict', '--pretty=format:%H%x09%an%x09%ae%x09%ad%x09%s'];
const GIT_MAX_BUFFER = 10 * 1024 * 1024;

function walk(dir, out = []) {
	if (!fs.existsSync(dir)) return out;
	for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, name.name);
		if (name.isDirectory()) walk(p, out);
		else if (/\.(md|mdx)$/i.test(name.name)) out.push(p);
	}
	return out;
}

function gitTopLevel(cwd) {
	try {
		return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', cwd }).trim();
	} catch {
		return null;
	}
}

function parseGitLog(stdout) {
	const lines = stdout.split(/\r?\n/).filter(Boolean);
	const commits = [];
	for (const line of lines) {
		const [hash, author, email, date, ...subj] = line.split('\t');
		if (!hash) continue;
		commits.push({
			hash,
			author: author ?? '',
			email: email ?? '',
			date: date ?? '',
			subject: subj.join('\t') || '',
		});
	}
	return commits;
}

async function gitLogFollow(repoRoot, relPathFromRepo, limit) {
	const args = [...GIT_LOG_ARGS, '-n', String(limit), '--', relPathFromRepo];
	try {
		const { stdout } = await execFileAsync('git', args, {
			encoding: 'utf8',
			cwd: repoRoot,
			maxBuffer: GIT_MAX_BUFFER,
		});
		return parseGitLog(stdout);
	} catch {
		return [];
	}
}

async function gitRevisionCountFollow(repoRoot, relPathFromRepo) {
	try {
		const { stdout } = await execFileAsync(
			'git',
			['-c', 'core.quotepath=false', 'log', '--follow', '--pretty=format:%H', '--', relPathFromRepo],
			{ encoding: 'utf8', cwd: repoRoot, maxBuffer: GIT_MAX_BUFFER },
		);
		return stdout.split(/\r?\n/).filter(Boolean).length;
	} catch {
		return 0;
	}
}

function uniqueAuthorsFromCommits(commits) {
	const seen = new Set();
	const list = [];
	for (const c of commits) {
		const key = (c.email || c.author || '').toLowerCase();
		if (!key || seen.has(key)) continue;
		seen.add(key);
		list.push({ name: c.author, email: c.email });
	}
	return list;
}

async function mapPool(items, concurrency, fn) {
	const results = new Array(items.length);
	let next = 0;
	async function worker() {
		for (;;) {
			const i = next++;
			if (i >= items.length) return;
			results[i] = await fn(items[i], i);
		}
	}
	await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
	return results;
}

async function buildFileEntry(abs, repoRoot) {
	const websiteRelativePath = path.relative(WEBSITE_ROOT, abs).split(path.sep).join('/');
	if (!repoRoot) {
		return [
			websiteRelativePath,
			{
				repoRelativePath: websiteRelativePath,
				revisionCount: 0,
				commits: [],
				uniqueAuthors: [],
			},
		];
	}
	const repoRelativePath = path.relative(repoRoot, abs).split(path.sep).join('/');
	const commits = await gitLogFollow(repoRoot, repoRelativePath, MAX_COMMITS);
	let revisionCount = commits.length;
	if (commits.length >= MAX_COMMITS) {
		revisionCount = await gitRevisionCountFollow(repoRoot, repoRelativePath);
	}
	return [
		websiteRelativePath,
		{
			repoRelativePath,
			revisionCount,
			commits,
			uniqueAuthors: uniqueAuthorsFromCommits(commits),
		},
	];
}

function readExistingMeta() {
	if (!fs.existsSync(OUT_FILE)) return null;
	try {
		return JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
	} catch {
		return null;
	}
}

async function main() {
	const started = performance.now();
	fs.mkdirSync(OUT_DIR, { recursive: true });
	const repoRoot = gitTopLevel(WEBSITE_ROOT);
	if (!repoRoot) {
		const existing = readExistingMeta();
		if (existing?.gitAvailable === true) {
			console.warn(
				'generate-platform-spec-git-meta: no git repo; preserving existing git meta with gitAvailable: true.',
			);
			return;
		}
	}
	const files = walk(SPEC_ROOT);
	const entries = repoRoot
		? await mapPool(files, GIT_CONCURRENCY, (abs) => buildFileEntry(abs, repoRoot))
		: files.map((abs) => {
				const websiteRelativePath = path.relative(WEBSITE_ROOT, abs).split(path.sep).join('/');
				return [
					websiteRelativePath,
					{
						repoRelativePath: websiteRelativePath,
						revisionCount: 0,
						commits: [],
						uniqueAuthors: [],
					},
				];
			});

	const payload = {
		generatedAt: new Date().toISOString(),
		gitAvailable: Boolean(repoRoot),
		defaultBranch: DEFAULT_BRANCH,
		repo: DEFAULT_REPO,
		files: Object.fromEntries(entries),
	};

	if (!repoRoot) {
		console.warn('generate-platform-spec-git-meta: no git repo; revision data will be empty.');
	}

	fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
	const elapsed = ((performance.now() - started) / 1000).toFixed(1);
	console.log(
		`generate-platform-spec-git-meta: wrote ${Object.keys(payload.files).length} file(s) -> ${path.relative(WEBSITE_ROOT, OUT_FILE)} (${elapsed}s)`,
	);
}

main().catch((err) => {
	console.error('generate-platform-spec-git-meta:', err);
	process.exit(1);
});

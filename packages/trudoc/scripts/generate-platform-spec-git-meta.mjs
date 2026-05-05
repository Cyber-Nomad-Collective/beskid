/**
 * Build-time git history for platform-spec docs. Writes JSON consumed by SpecDocHistory.
 * Keys are paths relative to site/website (e.g. src/content/docs/platform-spec/...).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { getWebsiteRoot } from './lib/website-root.mjs';
import { fileURLToPath } from 'node:url';

const WEBSITE_ROOT = getWebsiteRoot(import.meta.url);
const SPEC_ROOT = path.join(WEBSITE_ROOT, 'src', 'content', 'docs', 'platform-spec');
const OUT_DIR = path.join(WEBSITE_ROOT, 'src', 'generated');
const OUT_FILE = path.join(OUT_DIR, 'platform-spec-git-meta.json');
const MAX_COMMITS = 50;
const defaultRepoJsonPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'platform-spec', 'beskid-default-repo.json');
const DEFAULT_REPO = JSON.parse(fs.readFileSync(defaultRepoJsonPath, 'utf8')).repo;
const DEFAULT_BRANCH = process.env.GITHUB_DEFAULT_BRANCH?.trim() || 'main';

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

function gitLogFollow(repoRoot, relPathFromRepo) {
	const args = [
		'-c',
		'core.quotepath=false',
		'log',
		'--follow',
		'-n',
		String(MAX_COMMITS),
		'--date=iso-strict',
		'--pretty=format:%H%x09%an%x09%ae%x09%ad%x09%s',
		'--',
		relPathFromRepo,
	];
	try {
		const out = execFileSync('git', args, { encoding: 'utf8', cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 });
		const lines = out.split(/\r?\n/).filter(Boolean);
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
	} catch {
		return [];
	}
}

function gitRevisionCountFollow(repoRoot, relPathFromRepo) {
	try {
		const out = execFileSync(
			'git',
			['-c', 'core.quotepath=false', 'log', '--follow', '--pretty=format:%H', '--', relPathFromRepo],
			{ encoding: 'utf8', cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 },
		);
		return out.split(/\r?\n/).filter(Boolean).length;
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

function main() {
	fs.mkdirSync(OUT_DIR, { recursive: true });
	const repoRoot = gitTopLevel(WEBSITE_ROOT);
	const files = walk(SPEC_ROOT);
	const payload = {
		generatedAt: new Date().toISOString(),
		gitAvailable: Boolean(repoRoot),
		defaultBranch: DEFAULT_BRANCH,
		repo: DEFAULT_REPO,
		files: {},
	};

	for (const abs of files) {
		const websiteRelativePath = path.relative(WEBSITE_ROOT, abs).split(path.sep).join('/');
		let repoRelativePath = websiteRelativePath;
		let commits = [];
		let revisionCount = 0;
		if (repoRoot) {
			repoRelativePath = path.relative(repoRoot, abs).split(path.sep).join('/');
			commits = gitLogFollow(repoRoot, repoRelativePath);
			revisionCount = gitRevisionCountFollow(repoRoot, repoRelativePath);
		}
		payload.files[websiteRelativePath] = {
			repoRelativePath,
			revisionCount,
			commits,
			uniqueAuthors: uniqueAuthorsFromCommits(commits),
		};
	}

	if (!repoRoot) {
		console.warn('generate-platform-spec-git-meta: no git repo; revision data will be empty.');
	}

	fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
	console.log(
		`generate-platform-spec-git-meta: wrote ${Object.keys(payload.files).length} file(s) -> ${path.relative(WEBSITE_ROOT, OUT_FILE)}`,
	);
}

main();

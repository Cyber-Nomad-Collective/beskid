import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_GITHUB_REPO } from './github-repo';
import type { PlatformSpecGitMeta } from './spec-git-meta';

const empty: PlatformSpecGitMeta = {
	generatedAt: null,
	gitAvailable: false,
	defaultBranch: 'main',
	repo: DEFAULT_GITHUB_REPO,
	files: {},
};

export function loadPlatformSpecGitMeta(cwd: string): PlatformSpecGitMeta {
	const p = path.join(cwd, 'src', 'generated', 'platform-spec-git-meta.json');
	try {
		if (!fs.existsSync(p)) return empty;
		return JSON.parse(fs.readFileSync(p, 'utf8')) as PlatformSpecGitMeta;
	} catch {
		return empty;
	}
}

import repoConfig from './beskid-default-repo.json' with { type: 'json' };

/** Default GitHub org/repo for superrepo links (matches Starlight social config). */
export const DEFAULT_GITHUB_REPO = repoConfig.repo;

export type GithubResourceKind = 'blob' | 'tree' | 'raw';

export function githubWebUrl(repo: string, kind: GithubResourceKind, ref: string, repoPath: string): string {
	const clean = repoPath.replace(/^\/+/, '').replace(/\\/g, '/');
	const encoded = clean
		.split('/')
		.map((seg) => encodeURIComponent(seg))
		.join('/');
	if (kind === 'raw') {
		return `https://raw.githubusercontent.com/${repo}/${ref}/${encoded}`;
	}
	const kindSeg = kind === 'tree' ? 'tree' : 'blob';
	return `https://github.com/${repo}/${kindSeg}/${ref}/${encoded}`;
}

export function githubCommitsHistoryUrl(repo: string, ref: string, repoPath: string): string {
	const clean = repoPath.replace(/^\/+/, '').replace(/\\/g, '/');
	const encoded = clean
		.split('/')
		.map((seg) => encodeURIComponent(seg))
		.join('/');
	return `https://github.com/${repo}/commits/${ref}/${encoded}`;
}

export function githubCommitUrl(repo: string, hash: string): string {
	return `https://github.com/${repo}/commit/${hash}`;
}

export function lineHash(line?: number, endLine?: number): string {
	if (line == null || !Number.isFinite(line)) return '';
	if (endLine != null && endLine !== line) return `#L${line}-L${endLine}`;
	return `#L${line}`;
}

export type GitCommitRow = {
	hash: string;
	author: string;
	email: string;
	date: string;
	subject: string;
};

export type GitFileMeta = {
	repoRelativePath: string;
	revisionCount: number;
	commits: GitCommitRow[];
	uniqueAuthors: { name: string; email: string }[];
};

export type PlatformSpecGitMeta = {
	generatedAt: string | null;
	gitAvailable: boolean;
	defaultBranch: string;
	repo: string;
	files: Record<string, GitFileMeta>;
};

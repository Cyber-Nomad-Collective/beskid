type GitHubRequestError = {
	status: number;
	message: string;
};

function isGitHubRequestError(error: unknown): error is GitHubRequestError {
	if (typeof error !== "object" || error === null) return false;
	return (
		"status" in error &&
		"message" in error &&
		typeof (error as { status?: unknown }).status === "number" &&
		typeof (error as { message?: unknown }).message === "string"
	);
}

export function isGitHubRateLimitError(error: unknown): boolean {
	if (!isGitHubRequestError(error)) return false;
	if (error.status !== 403) return false;
	const message = error.message.toLowerCase();
	return (
		message.includes("rate limit") || message.includes("api rate limit exceeded")
	);
}

export function githubErrorMessage(error: unknown): string {
	if (isGitHubRequestError(error)) {
		if (isGitHubRateLimitError(error)) {
			return "GitHub API rate limit exceeded. Set GITHUB_PUBLIC_READ_TOKEN or sign in, then retry in a few minutes.";
		}
		return error.message;
	}
	if (error instanceof Error) return error.message;
	return "GitHub request failed";
}

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";

interface GitHubRateLimitAlertProps {
	message?: string;
}

export function GitHubRateLimitAlert({ message }: GitHubRateLimitAlertProps) {
	if (!message) return null;

	return (
		<Alert variant="destructive" className="mb-6">
			<AlertTitle>GitHub API rate limit</AlertTitle>
			<AlertDescription className="text-sm leading-relaxed">
				{message}{" "}
				<a
					href="https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting"
					target="_blank"
					rel="noopener noreferrer"
					className="font-medium underline underline-offset-2"
				>
					Rate limiting docs
				</a>
			</AlertDescription>
		</Alert>
	);
}

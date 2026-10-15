import { Button } from "@cyber-nomad-collective/beskid-ui-react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@cyber-nomad-collective/beskid-ui-react/ui/alert";
import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { PckgApiClient } from "#/lib/pckg-api";

/** The registry client surface the release center pages use. */
export type ReleaseCenterApi = Pick<
	PckgApiClient,
	| "listApiKeys"
	| "createApiKey"
	| "revokeApiKey"
	| "listPackages"
	| "listPackageVersions"
	| "yankVersion"
	| "unyankVersion"
>;

/** Public registry origin the CLI targets by default. */
export const REGISTRY_ORIGIN = "https://pckg.beskid-lang.org";

/** Step-by-step publishing guide on the language site. */
export const PUBLISH_GUIDE_URL =
	"https://beskid-lang.org/docs/packages/publish/";

/** Page container shared by every release center section. */
export function ReleasePage({ children }: { children: ReactNode }) {
	return (
		<section className="mx-auto w-full max-w-6xl space-y-6 px-5 py-10">
			{children}
		</section>
	);
}

/** Eyebrow, title, lead and optional actions for a release center section. */
export function ReleasePageHeader({
	title,
	description,
	actions,
}: {
	title: string;
	description: string;
	actions?: ReactNode;
}) {
	return (
		<header className="flex flex-wrap items-end justify-between gap-4">
			<div>
				<p className="text-sm font-medium text-muted-foreground">Release center</p>
				<h1 className="mt-1 text-3xl font-bold">{title}</h1>
				<p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
			</div>
			{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
		</header>
	);
}

/** Inline failure state with a retry action (the page stays navigable). */
export function ReleaseErrorState({
	title,
	error,
	onRetry,
}: {
	title: string;
	error: unknown;
	onRetry?: () => void;
}) {
	return (
		<Alert variant="destructive" role="alert">
			<CircleAlert />
			<AlertTitle>{title}</AlertTitle>
			<AlertDescription>
				<p>
					{error instanceof Error ? error.message : "The registry did not answer."}
				</p>
				{onRetry ? (
					<Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
						Try again
					</Button>
				) : null}
			</AlertDescription>
		</Alert>
	);
}

/** Monospace block for a shell command or a secret. */
export function CodeBlock({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<pre
			className={`overflow-x-auto rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm leading-6 ${className}`}
		>
			<code>{children}</code>
		</pre>
	);
}

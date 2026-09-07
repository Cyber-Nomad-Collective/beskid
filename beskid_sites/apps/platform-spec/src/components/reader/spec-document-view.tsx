import { TrackerTaskEmbed } from "#/components/reader/tracker-task-embed";

interface SpecDocumentViewProps {
	title: string;
	specLevel?: string | null;
	status?: string | null;
	description?: string | null;
	bodyHtml: string;
	trackerLinks?: Array<{ standardId: string; catalogRevision: string }>;
}

export function SpecDocumentView({
	title,
	specLevel,
	status,
	description,
	bodyHtml,
	trackerLinks = [],
}: SpecDocumentViewProps) {
	return (
		<article className="spec-document-view mx-auto w-full max-w-4xl px-6 py-8">
			<header className="mb-8 space-y-3 border-b border-border pb-6">
				<div className="flex flex-wrap items-center gap-2">
					{specLevel ? (
						<span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
							{specLevel}
						</span>
					) : null}
					{status ? (
						<span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
							{status}
						</span>
					) : null}
				</div>
				<h1 className="display-title text-3xl font-bold tracking-tight">{title}</h1>
				{description ? (
					<p className="text-base text-muted-foreground">{description}</p>
				) : null}
			</header>
			<div
				className="spec-prose prose prose-invert max-w-none"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered markdown
				dangerouslySetInnerHTML={{ __html: bodyHtml }}
			/>
			{trackerLinks.map((link) => (
				<TrackerTaskEmbed
					key={`${link.standardId}:${link.catalogRevision}`}
					{...link}
				/>
			))}
		</article>
	);
}

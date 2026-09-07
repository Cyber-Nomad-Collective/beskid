"use client";

import { Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import { Badge, Button } from "#/components/ui-primitives";
import type {
	Manifest,
	ManifestChapter,
	ManifestEntry,
	ManifestReference,
	ManifestSection,
} from "#/lib/manifest/types";

export interface ManifestViewProps {
	manifest: Manifest;
	/** Capability IDs that exist in the OpenSpec catalog. Used to flag unresolved references. */
	knownCapabilities: Set<string>;
}

export function ManifestView({
	manifest,
	knownCapabilities,
}: ManifestViewProps) {
	const [activeChapter, setActiveChapter] = useState<string | null>(null);

	const handleDownloadJson = useCallback(() => {
		fetch("/api/v1/manifest")
			.then((res) => res.json())
			.then((data) => {
				const blob = new Blob([JSON.stringify(data, null, 2)], {
					type: "application/json",
				});
				triggerDownload(blob, "beskid-normative-manifest.json");
			})
			.catch((err: unknown) => {
				console.error("Failed to download manifest JSON", err);
			});
	}, []);

	const handleExportDocument = useCallback(() => {
		const html = renderExportHtml(manifest);
		const blob = new Blob([html], { type: "text/html" });
		triggerDownload(blob, "beskid-normative-manifest.html");
	}, [manifest]);

	return (
		<article className="manifest-view mx-auto w-full min-w-0 max-w-5xl px-6 py-8">
			<header className="manifest-header mb-8 space-y-3 border-b border-border pb-6">
				<div className="flex flex-wrap items-center gap-2">
					<Badge>Normative manifest</Badge>
					<Badge className="border border-border bg-transparent text-muted-foreground">
						ASD-STE100
					</Badge>
					{manifest.catalogRevision ? (
						<span className="text-xs text-muted-foreground">
							Catalog revision: <code>{manifest.catalogRevision}</code>
						</span>
					) : null}
				</div>
				<h1 className="text-4xl font-bold tracking-tight">{manifest.title}</h1>
				<p className="text-lg text-muted-foreground">
					A chaptered aggregation of the most important normative facts about Beskid.
					The prose conforms to ASD-STE100 Simplified Technical English. Each entry
					references the platform spec capability and the source file.
				</p>
				<div className="flex flex-wrap gap-2 pt-2">
					<Button onClick={handleDownloadJson}>Download JSON</Button>
					<Button variant="ghost" onClick={handleExportDocument}>
						Export document
					</Button>
				</div>
			</header>

			<nav
				className="manifest-toc sticky top-0 z-10 mb-8 flex flex-wrap gap-2 border-b border-border bg-background/90 py-3 backdrop-blur"
				aria-label="Manifest chapters"
			>
				{manifest.chapters.map((chapter) => (
					<a
						key={chapter.id}
						href={`#chapter-${chapter.id}`}
						className={`rounded-full px-3 py-1 text-sm transition-colors ${
							activeChapter === chapter.id
								? "bg-primary/15 font-medium text-primary"
								: "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
						}`}
						onClick={() => setActiveChapter(chapter.id)}
					>
						{chapter.order + 1}. {chapter.title}
					</a>
				))}
			</nav>

			{manifest.chapters.map((chapter) => (
				<ManifestChapterView
					key={chapter.id}
					chapter={chapter}
					knownCapabilities={knownCapabilities}
				/>
			))}
		</article>
	);
}

function ManifestChapterView({
	chapter,
	knownCapabilities,
}: {
	chapter: ManifestChapter;
	knownCapabilities: Set<string>;
}) {
	return (
		<section
			id={`chapter-${chapter.id}`}
			className="manifest-chapter spec-document-section"
		>
			<header className="mb-4 space-y-2">
				<div className="flex items-center gap-2">
					<Badge>{chapter.order + 1}</Badge>
					<h2 className="text-2xl font-semibold tracking-tight">{chapter.title}</h2>
				</div>
				{chapter.description ? (
					<p className="text-sm text-muted-foreground">{chapter.description}</p>
				) : null}
			</header>
			{chapter.sections.map((section) => (
				<ManifestSectionView
					key={section.id}
					section={section}
					knownCapabilities={knownCapabilities}
				/>
			))}
		</section>
	);
}

function ManifestSectionView({
	section,
	knownCapabilities,
}: {
	section: ManifestSection;
	knownCapabilities: Set<string>;
}) {
	return (
		<section className="manifest-section mb-6">
			<div className="mb-3 space-y-1">
				<h3 className="text-lg font-semibold tracking-tight">{section.title}</h3>
				{section.description ? (
					<p className="text-sm text-muted-foreground">{section.description}</p>
				) : null}
			</div>
			<div className="space-y-3">
				{section.entries.map((entry) => (
					<ManifestEntryView
						key={entry.id}
						entry={entry}
						knownCapabilities={knownCapabilities}
					/>
				))}
			</div>
		</section>
	);
}

function ManifestEntryView({
	entry,
	knownCapabilities,
}: {
	entry: ManifestEntry;
	knownCapabilities: Set<string>;
}) {
	return (
		<div className="manifest-entry island-shell rounded-xl p-4">
			<div className="flex flex-wrap items-baseline gap-2">
				<h4 className="text-base font-semibold">{entry.title}</h4>
				<code className="text-xs text-muted-foreground">{entry.id}</code>
			</div>
			<p className="manifest-entry-desc spec-prose mt-2 text-sm leading-relaxed">
				{entry.description}
			</p>
			{entry.examples && entry.examples.length > 0 ? (
				<div className="manifest-examples mt-3 space-y-2">
					{entry.examples.map((example) => (
						<pre key={example} className="spec-prose">
							<code>{example}</code>
						</pre>
					))}
				</div>
			) : null}
			<ManifestReferencesView
				references={entry.references}
				knownCapabilities={knownCapabilities}
			/>
			{entry.metadata ? <ManifestMetadataView metadata={entry.metadata} /> : null}
		</div>
	);
}

const GITHUB_REPO_BASE =
	"https://github.com/Cyber-Nomad-Collective/beskid/blob/main/";

function ManifestReferencesView({
	references,
	knownCapabilities,
}: {
	references: ManifestReference;
	knownCapabilities: Set<string>;
}) {
	return (
		<div className="manifest-refs mt-3 space-y-2 border-t border-border pt-3">
			{references.capabilities.length > 0 ? (
				<div className="space-y-1">
					<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Capabilities
					</span>
					<ul className="flex flex-wrap gap-1.5">
						{references.capabilities.map((capability) => {
							const resolved = knownCapabilities.has(capability);
							if (resolved) {
								return (
									<li key={capability}>
										<Link
											to="/platform-spec/$"
											params={{ _splat: `capabilities/${capability}` }}
											className="rounded-full border border-border px-2.5 py-0.5 text-xs text-primary transition-colors hover:bg-primary/10"
										>
											{capability}
										</Link>
									</li>
								);
							}
							return (
								<li key={capability}>
									<span
										title="Unresolved capability reference"
										className="inline-flex items-center gap-1 rounded-full border border-destructive/60 bg-destructive/10 px-2.5 py-0.5 text-xs text-destructive"
									>
										<span aria-hidden="true">⚠</span>
										{capability}
									</span>
								</li>
							);
						})}
					</ul>
				</div>
			) : null}
			{references.sources.length > 0 ? (
				<div className="space-y-1">
					<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Source files
					</span>
					<ul className="flex flex-col gap-1">
						{references.sources.map((source) => (
							<li key={source}>
								<a
									href={`${GITHUB_REPO_BASE}${source}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs text-primary underline-offset-2 hover:underline"
								>
									<code className="text-muted-foreground">{source}</code>
								</a>
							</li>
						))}
					</ul>
				</div>
			) : null}
		</div>
	);
}

function ManifestMetadataView({
	metadata,
}: {
	metadata: Record<string, string | string[]>;
}) {
	const entries = Object.entries(metadata);
	if (entries.length === 0) return null;
	return (
		<dl className="manifest-metadata mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs">
			{entries.map(([key, value]) => (
				<div key={key} className="flex gap-1">
					<dt className="font-semibold text-muted-foreground">{key}:</dt>
					<dd className="text-muted-foreground">
						{Array.isArray(value) ? value.join(", ") : value}
					</dd>
				</div>
			))}
		</dl>
	);
}

/** Trigger a browser download for a blob. */
function triggerDownload(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/** Render a self-contained HTML export of the manifest. */
function renderExportHtml(manifest: Manifest): string {
	const chapters = manifest.chapters
		.map((chapter) => renderChapterHtml(chapter))
		.join("\n");
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(manifest.title)}</title>
<style>
body { font-family: system-ui, sans-serif; max-width: 60rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1a1a1a; }
h1 { font-size: 2rem; }
h2 { font-size: 1.5rem; margin-top: 2rem; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem; }
h3 { font-size: 1.2rem; margin-top: 1.5rem; }
h4 { font-size: 1rem; margin-top: 1rem; }
code, pre { font-family: ui-monospace, monospace; font-size: 0.875rem; }
pre { background: #f4f4f4; padding: 0.75rem; border-radius: 0.25rem; overflow-x: auto; }
.entry { border: 1px solid #ddd; border-radius: 0.5rem; padding: 1rem; margin: 0.75rem 0; }
.refs { margin-top: 0.5rem; font-size: 0.8rem; color: #555; }
.meta { margin-top: 0.5rem; font-size: 0.8rem; color: #555; }
.badge { display: inline-block; background: #e5e7eb; border-radius: 9999px; padding: 0.1rem 0.5rem; font-size: 0.75rem; }
</style>
</head>
<body>
<h1>${escapeHtml(manifest.title)}</h1>
<p><span class="badge">Normative manifest</span> <span class="badge">ASD-STE100</span></p>
<p>Version ${escapeHtml(manifest.version)}${
		manifest.catalogRevision
			? ` &middot; Catalog revision <code>${escapeHtml(manifest.catalogRevision)}</code>`
			: ""
	}</p>
<p>A chaptered aggregation of the most important normative facts about Beskid. The prose conforms to ASD-STE100 Simplified Technical English. Each entry references the platform spec capability and the source file.</p>
${chapters}
</body>
</html>`;
}

function renderChapterHtml(chapter: ManifestChapter): string {
	const sections = chapter.sections
		.map((section) => renderSectionHtml(section))
		.join("\n");
	return `<section id="chapter-${escapeHtml(chapter.id)}">
<h2>${chapter.order + 1}. ${escapeHtml(chapter.title)}</h2>
${chapter.description ? `<p>${escapeHtml(chapter.description)}</p>` : ""}
${sections}
</section>`;
}

function renderSectionHtml(section: ManifestSection): string {
	const entries = section.entries
		.map((entry) => renderEntryHtml(entry))
		.join("\n");
	return `<section>
<h3>${escapeHtml(section.title)}</h3>
${section.description ? `<p>${escapeHtml(section.description)}</p>` : ""}
${entries}
</section>`;
}

function renderEntryHtml(entry: ManifestEntry): string {
	const examples = (entry.examples ?? [])
		.map((example) => `<pre><code>${escapeHtml(example)}</code></pre>`)
		.join("\n");
	const capabilities = entry.references.capabilities
		.map((cap) => escapeHtml(cap))
		.join(", ");
	const sources = entry.references.sources
		.map(
			(src) =>
				`<a href="${GITHUB_REPO_BASE}${escapeHtml(src)}" target="_blank" rel="noopener noreferrer"><code>${escapeHtml(src)}</code></a>`,
		)
		.join(", ");
	const metadata = entry.metadata
		? Object.entries(entry.metadata)
				.map(
					([key, value]) =>
						`<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(
							Array.isArray(value) ? value.join(", ") : value,
						)}</dd>`,
				)
				.join("\n")
		: "";
	return `<div class="entry">
<h4>${escapeHtml(entry.title)}</h4>
<p>${escapeHtml(entry.description)}</p>
${examples}
<div class="refs">
${capabilities ? `<p>Capabilities: ${capabilities}</p>` : ""}
${sources ? `<p>Sources: ${sources}</p>` : ""}
</div>
${metadata ? `<dl class="meta">${metadata}</dl>` : ""}
</div>`;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

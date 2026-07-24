"use client";

import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TrackerTaskEmbed } from "#/components/reader/tracker-task-embed";
import { renderMarkdownToHtml } from "#/lib/markdown";
import type { LayoutValidation, SpecLayout } from "#/lib/spec/layouts-pure";

export interface StructuredDocumentViewProps {
	title: string;
	specLevel?: string | null;
	status?: string | null;
	description?: string | null;
	bodyMd: string;
	/** Informative Book guides; they never alter this standard's authority. */
	bookLinks?: string[];
	adrs?: { href: string; title: string }[];
	relatedTopics?: { href: string; title: string }[];
	architectureGraph?: { graphKey: string; entryNode?: string } | null;
	/** Enforceable layout resolved for this document's spec level. */
	layout?: SpecLayout | null;
	/** Result of validating the body against its enforceable layout. */
	layoutValidation?: LayoutValidation | null;
	showEditLink?: boolean;
	/** Prefill for Propose change → draft context wizard. */
	proposeSearch?: {
		capability: string | undefined;
		domain: string | undefined;
		area: string | undefined;
		feature: string | undefined;
	};
	/** Catalog revision for Tracker embed. */
	catalogRevision?: string | null;
	standardId?: string | null;
}

function bookGuideTitle(href: string): string {
	const slug = href.replace(/^\/+|\/+$/g, "").split("/").at(-1) ?? href;
	return slug
		.replace(/^\d+-/, "")
		.replace(/-/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function bookGuideHref(href: string): string {
	return new URL(href, "https://beskid-lang.org").href;
}

export function StructuredDocumentView({
	title,
	specLevel,
	status,
	description,
	bodyMd,
	bookLinks = [],
	adrs = [],
	relatedTopics = [],
	architectureGraph = null,
	layout = null,
	layoutValidation = null,
	showEditLink = true,
	proposeSearch,
	catalogRevision = null,
	standardId = null,
}: StructuredDocumentViewProps) {
	const bodyHtml = renderMarkdownToHtml(bodyMd);
	const [graph, setGraph] = useState<unknown | null>(null);
	const [graphError, setGraphError] = useState<string | null>(null);

	useEffect(() => {
		if (!architectureGraph?.graphKey) return;
		setGraph(null);
		setGraphError(null);
		fetch(
			`/api/v1/architecture/${encodeURIComponent(architectureGraph.graphKey)}`,
		)
			.then(async (res) => {
				if (!res.ok) {
					const payload = await res.json().catch(() => ({}));
					throw new Error(
						payload?.error ??
							`failed to load architecture graph (${res.status})`,
					);
				}
				return res.json();
			})
			.then((data) => setGraph(data))
			.catch((err) =>
				setGraphError(err instanceof Error ? err.message : String(err)),
			);
	}, [architectureGraph?.graphKey]);

	const architectureSlot = architectureGraph ? (
		graph ? (
			<details className="rounded-lg border border-border p-4">
				<summary className="cursor-pointer font-semibold">
					Derived architecture graph
				</summary>
				{architectureGraph.entryNode ? (
					<p className="mt-2 text-sm text-muted-foreground">
						Entry node: <code>{architectureGraph.entryNode}</code>
					</p>
				) : null}
				<pre className="mt-3 max-h-96 overflow-auto text-xs">
					{JSON.stringify(graph, null, 2)}
				</pre>
			</details>
		) : graphError ? (
			<p className="text-sm text-muted-foreground">
				Failed to load architecture graph: {graphError}
			</p>
		) : (
			<p className="text-sm text-muted-foreground">
				Loading architecture graph…
			</p>
		)
	) : null;

	const missingHeadings = new Set(
		(layoutValidation?.violations ?? [])
			.filter(
				(violation) =>
					violation.code === "missing-section" && violation.heading,
			)
			.map((violation) => violation.heading as string),
	);
	const layoutSlot = layout ? (
		<details
			className="rounded-lg border border-border p-4"
			open={layoutValidation ? !layoutValidation.ok : false}
		>
			<summary className="cursor-pointer font-semibold">
				Document layout: {layout.title}
				{layoutValidation ? (
					<span
						className={`ml-2 text-xs uppercase tracking-wide ${
							layoutValidation.ok ? "text-muted-foreground" : "text-destructive"
						}`}
					>
						{layoutValidation.ok ? "conforms" : "non-conforming"}
					</span>
				) : null}
			</summary>
			<ul className="mt-3 space-y-1 text-sm">
				{layout.sections.map((section) => {
					const missing =
						section.required !== false && missingHeadings.has(section.heading);
					return (
						<li key={section.heading} className="flex items-center gap-2">
							<span aria-hidden className={missing ? "text-destructive" : ""}>
								{missing ? "✗" : "✓"}
							</span>
							<code>{`${"#".repeat(section.level)} ${section.heading}`}</code>
							{section.required === false ? (
								<span className="text-xs text-muted-foreground">optional</span>
							) : null}
						</li>
					);
				})}
			</ul>
			{layoutValidation && !layoutValidation.ok ? (
				<ul className="mt-3 space-y-1 text-xs text-destructive">
					{layoutValidation.violations.map((violation) => (
						<li key={`${violation.code}-${violation.heading ?? ""}`}>
							{violation.message}
						</li>
					))}
				</ul>
			) : null}
		</details>
	) : null;

	return (
		<article className="spec-document-view mx-auto w-full min-w-0 max-w-5xl px-6 py-8">
			<div className="mb-4 flex justify-end">
				{showEditLink ? (
					<Link
						to="/edit/drafts/$id"
						params={{ id: "new" }}
						search={(proposeSearch ?? {}) as never}
						className="text-sm text-primary underline"
					>
						Propose change
					</Link>
				) : null}
			</div>
			<header className="mb-8 space-y-3 border-b border-border pb-6">
				<div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-muted-foreground">
					{specLevel ? <span>{specLevel}</span> : null}
					{status ? <span>{status}</span> : null}
				</div>
				<h1 className="text-4xl font-bold tracking-tight">{title}</h1>
				{description ? (
					<p className="text-lg text-muted-foreground">{description}</p>
				) : null}
			</header>
			{architectureSlot ? (
				<section className="mb-8">{architectureSlot}</section>
			) : null}
			{layoutSlot ? <section className="mb-8">{layoutSlot}</section> : null}
			<div
				className="spec-prose prose prose-invert max-w-none"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered markdown
				dangerouslySetInnerHTML={{ __html: bodyHtml }}
			/>
			{relatedTopics.length > 0 || adrs.length > 0 || bookLinks.length > 0 ? (
				<aside className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
					{bookLinks.length > 0 ? (
						<section>
							<h2 className="font-semibold">Informative Book guides</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								These guides explain and contextualize this standard; OpenSpec
									remains the normative source.
							</p>
							<ul>
								{bookLinks.map((href) => (
									<li key={href}>
										<a href={bookGuideHref(href)}>{bookGuideTitle(href)}</a>
									</li>
								))}
							</ul>
						</section>
					) : null}
					{relatedTopics.length > 0 ? (
						<section>
							<h2 className="font-semibold">Related capabilities</h2>
							<ul>
								{relatedTopics.map((item) => (
									<li key={item.href}>
										<a href={item.href}>{item.title}</a>
									</li>
								))}
							</ul>
						</section>
					) : null}
					{adrs.length > 0 ? (
						<section>
							<h2 className="font-semibold">Decisions</h2>
							<ul>
								{adrs.map((item) => (
									<li key={item.href}>
										<a href={item.href}>{item.title}</a>
									</li>
								))}
							</ul>
						</section>
					) : null}
				</aside>
			) : null}
			{standardId && catalogRevision ? (
				<TrackerTaskEmbed
					standardId={standardId}
					catalogRevision={catalogRevision}
				/>
			) : null}
		</article>
	);
}

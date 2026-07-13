"use client";

import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { renderMarkdownToHtml } from "#/lib/markdown";

export interface StructuredDocumentViewProps {
	title: string;
	specLevel?: string | null;
	status?: string | null;
	description?: string | null;
	bodyMd: string;
	adrs?: { href: string; title: string }[];
	relatedTopics?: { href: string; title: string }[];
	architectureGraph?: { graphKey: string; entryNode?: string } | null;
	showEditLink?: boolean;
}

export function StructuredDocumentView({
	title,
	specLevel,
	status,
	description,
	bodyMd,
	adrs = [],
	relatedTopics = [],
	architectureGraph = null,
	showEditLink = true,
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

	return (
		<article className="spec-document-view mx-auto w-full max-w-5xl px-6 py-8">
			<div className="mb-4 flex justify-end">
				{showEditLink ? (
					<Link
						to="/edit/drafts/new"
						className="text-sm text-primary underline"
					>
						Edit this page
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
			<div
				className="spec-prose prose prose-invert max-w-none"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered markdown
				dangerouslySetInnerHTML={{ __html: bodyHtml }}
			/>
			{relatedTopics.length > 0 || adrs.length > 0 ? (
				<aside className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
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
		</article>
	);
}

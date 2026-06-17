"use client";

import { useEffect, useState } from "react";

import type { LayoutFile } from "@cyber-nomad-collective/spec-core";
import {
	SpecOriginProvider,
	SpecPageHeader,
	SpecReaderShell,
	SpecWidgetGrid,
	SpecCommentsPanel,
	type CatalogEntry,
	type NavTreeNode,
	type SpecCommentItem,
} from "@beskid/ui-react/platform-spec";
import { ArchitectureGraphCanvas } from "@beskid/ui-react/architecture-graph";
import { Link } from "@tanstack/react-router";
import { renderMarkdownToHtml } from "#/lib/markdown";

export interface StructuredDocumentViewProps {
	slug: string;
	title: string;
	specLevel?: string | null;
	status?: string | null;
	description?: string | null;
	bodyMd: string;
	layoutJson?: Record<string, unknown> | null;
	adrs?: { href: string; title: string }[];
	comments?: SpecCommentItem[];
	catalogEntries?: CatalogEntry[];
	relatedTopics?: { href: string; title: string }[];
	architectureGraph?: { graphKey: string; entryNode?: string } | null;
	showEditLink?: boolean;
}

export function StructuredDocumentView({
	slug,
	title,
	specLevel,
	status,
	description,
	bodyMd,
	layoutJson,
	adrs = [],
	comments = [],
	catalogEntries = [],
	relatedTopics = [],
	architectureGraph = null,
	showEditLink = true,
}: StructuredDocumentViewProps) {
	const bodyHtml = renderMarkdownToHtml(bodyMd);
	const layout = layoutJson as LayoutFile | null | undefined;

	const [graph, setGraph] = useState<unknown | null>(null);
	const [graphError, setGraphError] = useState<string | null>(null);

	useEffect(() => {
		if (!architectureGraph?.graphKey) return;
		setGraph(null);
		setGraphError(null);
		fetch(`/api/v1/architecture/${encodeURIComponent(architectureGraph.graphKey)}`)
			.then(async (res) => {
				if (!res.ok) {
					const payload = await res.json().catch(() => ({}));
					throw new Error(payload?.error ?? `failed to load architecture graph (${res.status})`);
				}
				return res.json();
			})
			.then((data) => setGraph(data))
			.catch((err) => setGraphError(err instanceof Error ? err.message : String(err)));
	}, [architectureGraph?.graphKey]);

	const architectureSlot = architectureGraph ? (
		graph ? (
			<ArchitectureGraphCanvas graph={graph} entryNodeId={architectureGraph.entryNode} />
		) : graphError ? (
			<p className="text-sm text-muted-foreground">Failed to load architecture graph: {graphError}</p>
		) : (
			<p className="text-sm text-muted-foreground">Loading architecture graph…</p>
		)
	) : null;

	return (
		<SpecOriginProvider>
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
				<SpecReaderShell
					relatedTopics={relatedTopics}
					adrs={adrs}
					adrCount={adrs.length}
					architecture={architectureSlot}
				>
					<SpecPageHeader
						title={title}
						description={description}
						specLevel={specLevel}
						status={status}
					/>
					{layout ? (
						<SpecWidgetGrid
							layout={layout}
							catalogEntries={catalogEntries}
							className="mb-8"
						/>
					) : null}
					<div
						className="spec-prose prose prose-invert max-w-none"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered markdown
						dangerouslySetInnerHTML={{ __html: bodyHtml }}
					/>
					{comments.length > 0 ? (
						<SpecCommentsPanel comments={comments} onChange={() => {}} disabled />
					) : null}
				</SpecReaderShell>
			</article>
		</SpecOriginProvider>
	);
}

export type { CatalogEntry, NavTreeNode };

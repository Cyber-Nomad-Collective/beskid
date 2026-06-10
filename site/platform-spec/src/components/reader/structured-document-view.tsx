"use client";

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
	comments?: SpecCommentItem[];
	catalogEntries?: CatalogEntry[];
	relatedTopics?: { href: string; title: string }[];
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
	comments = [],
	catalogEntries = [],
	relatedTopics = [],
	showEditLink = true,
}: StructuredDocumentViewProps) {
	const bodyHtml = renderMarkdownToHtml(bodyMd);
	const layout = layoutJson as LayoutFile | null | undefined;

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
				<SpecReaderShell relatedTopics={relatedTopics}>
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

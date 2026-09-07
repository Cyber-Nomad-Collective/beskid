"use client";

import { Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import { ArchitectureGraphEditor } from "#/components/reader/architecture-graph-editor";
import type {
	AuthorArchitectureGraph,
	AuthorGraphNode,
} from "#/lib/architecture/graph-schema";

export interface ArchitectureGraphSectionProps {
	graph: AuthorArchitectureGraph;
	readOnly?: boolean;
}

const GITHUB_REPO_BASE =
	"https://github.com/Cyber-Nomad-Collective/beskid/blob/main/";

/**
 * Embeddable architecture graph section for spec content.
 *
 * Wraps the {@link ArchitectureGraphEditor} with a title, description, and a
 * detail panel that shows the selected node's spec capability and source path
 * links — reusing the `ArchitectureDetail` pattern from the compiler map.
 */
export function ArchitectureGraphSection({
	graph,
	readOnly = true,
}: ArchitectureGraphSectionProps) {
	const [selectedNode, setSelectedNode] = useState<AuthorGraphNode | null>(null);

	const handleSelectNode = useCallback((node: AuthorGraphNode | null) => {
		setSelectedNode(node);
	}, []);

	return (
		<section
			className="space-y-3"
			aria-label={`Architecture graph: ${graph.title}`}
		>
			<header className="space-y-1">
				<h2 className="text-lg font-semibold">{graph.title}</h2>
				{graph.description ? (
					<p className="text-sm text-muted-foreground">{graph.description}</p>
				) : null}
			</header>
			<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_19rem]">
				<ArchitectureGraphEditor
					graph={graph}
					readOnly={readOnly}
					onSelectNode={handleSelectNode}
				/>
				<AuthorNodeDetail node={selectedNode} />
			</div>
		</section>
	);
}

function AuthorNodeDetail({ node }: { node: AuthorGraphNode | null }) {
	if (!node) {
		return (
			<aside className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
				Select a node to inspect its kind, spec capability, and source path.
			</aside>
		);
	}
	return (
		<aside className="space-y-3 rounded-lg border border-border bg-card p-4">
			<div>
				<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{node.group ? `${node.group} · ` : ""}
					{node.kind}
				</p>
				<h3 className="mt-1 text-base font-semibold">{node.label}</h3>
				{node.description ? (
					<p className="mt-1.5 text-sm text-muted-foreground">{node.description}</p>
				) : null}
			</div>
			{node.specKey ? (
				<div>
					<h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Spec capability
					</h4>
					<Link
						to="/platform-spec/$"
						params={{ _splat: `capabilities/${node.specKey}` }}
						className="mt-1 block text-sm text-primary underline-offset-2 hover:underline"
					>
						{node.specKey}
					</Link>
				</div>
			) : null}
			{node.sourcePath ? (
				<div>
					<h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Source path
					</h4>
					<a
						href={`${GITHUB_REPO_BASE}${node.sourcePath}`}
						target="_blank"
						rel="noopener noreferrer"
						className="mt-1 block text-sm text-primary underline-offset-2 hover:underline"
					>
						<code className="text-muted-foreground">{node.sourcePath}</code>
					</a>
				</div>
			) : null}
		</aside>
	);
}

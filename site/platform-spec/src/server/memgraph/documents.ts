import type { PathClass } from "@cyber-nomad-collective/trudoc/layout";
import type {
	PlatformSpecCatalogEntry,
	PlatformSpecDocumentBundle,
} from "@cyber-nomad-collective/trudoc/platform-spec/catalog";
import {
	buildNavTree,
	pathClassToNavLevel,
	type NavTreeNode,
} from "@cyber-nomad-collective/trudoc/platform-spec/nav-tree";
import { runQuery, runWrite } from "#/server/memgraph/client";

export interface SpecDocumentUpsertInput {
	slug: string;
	specLevel: string | null;
	pathClass: string;
	title: string;
	description: string | null;
	status: string | null;
	adrId: string | null;
	adrStatus: string | null;
	repoPath: string;
	href: string;
	parentSlug: string | null;
	bodyMd: string;
	frontmatterJson: string;
	layoutJson: string | null;
	contentJson: string | null;
	hasLayoutJson: boolean;
	sourceGitSha: string | null;
	importedAt: string;
	publishedAt: string | null;
	lastReviewed: string | null;
}

type SpecDocumentProps = {
	slug: string;
	specLevel: string | null;
	pathClass: string;
	title: string;
	description: string | null;
	status: string | null;
	adrId: string | null;
	adrStatus: string | null;
	repoPath: string;
	href: string;
	parentSlug: string | null;
	bodyMd: string;
	frontmatterJson: string;
	layoutJson: string | null;
	contentJson: string | null;
	hasLayoutJson: boolean;
	sourceGitSha: string | null;
	importedAt: string;
	publishedAt: string | null;
	lastReviewed: string | null;
};

function toCatalogEntry(node: SpecDocumentProps): PlatformSpecCatalogEntry {
	return {
		slug: node.slug,
		href: node.href,
		pathClass: node.pathClass,
		specLevel: node.specLevel,
		title: node.title,
		description: node.description,
		status: node.status,
		adrId: node.adrId,
		adrStatus: node.adrStatus,
		repoPath: node.repoPath,
		contentPath: `/api/v1/docs/${node.slug}`,
		parentSlug: node.parentSlug,
		hasLayoutJson: node.hasLayoutJson,
	};
}

function toDocumentBundle(node: SpecDocumentProps): PlatformSpecDocumentBundle {
	let frontmatter: Record<string, unknown> = {};
	try {
		frontmatter = JSON.parse(node.frontmatterJson) as Record<string, unknown>;
	} catch {
		frontmatter = {};
	}

	let layoutJson: Record<string, unknown> | null = null;
	if (node.layoutJson) {
		try {
			layoutJson = JSON.parse(node.layoutJson) as Record<string, unknown>;
		} catch {
			layoutJson = null;
		}
	}

	return {
		generatedAt: node.importedAt,
		slug: node.slug,
		repoPath: node.repoPath,
		frontmatter,
		body: node.bodyMd,
		layoutJson,
	};
}

export async function upsertSpecDocument(
	input: SpecDocumentUpsertInput,
): Promise<void> {
	await runWrite(
		`
		MERGE (d:SpecDocument {slug: $slug})
		SET d += $props
		`,
		{
			slug: input.slug,
			props: {
				specLevel: input.specLevel,
				pathClass: input.pathClass,
				title: input.title,
				description: input.description,
				status: input.status,
				adrId: input.adrId,
				adrStatus: input.adrStatus,
				repoPath: input.repoPath,
				href: input.href,
				parentSlug: input.parentSlug,
				bodyMd: input.bodyMd,
				frontmatterJson: input.frontmatterJson,
				layoutJson: input.layoutJson,
				contentJson: input.contentJson,
				hasLayoutJson: input.hasLayoutJson,
				sourceGitSha: input.sourceGitSha,
				importedAt: input.importedAt,
				publishedAt: input.publishedAt,
				lastReviewed: input.lastReviewed,
				updatedAt: input.importedAt,
			},
		},
	);
}

export async function getDocumentBySlug(
	slug: string,
): Promise<PlatformSpecDocumentBundle | null> {
	const rows = await runQuery<{ props: SpecDocumentProps }>(
		`MATCH (d:SpecDocument {slug: $slug}) RETURN properties(d) AS props`,
		{ slug },
	);
	if (rows.length === 0) return null;
	return toDocumentBundle(rows[0].props);
}

export async function listCatalog(): Promise<{
	generatedAt: string;
	entries: PlatformSpecCatalogEntry[];
}> {
	const rows = await runQuery<{ props: SpecDocumentProps }>(
		`MATCH (d:SpecDocument) RETURN properties(d) AS props ORDER BY d.slug`,
	);
	const entries = rows.map((row) => toCatalogEntry(row.props));
	const importedAt = rows
		.map((row) => row.props.importedAt)
		.sort()
		.at(-1);
	return {
		generatedAt: importedAt ?? new Date().toISOString(),
		entries,
	};
}

export async function getNavTree(): Promise<NavTreeNode> {
	const catalog = await listCatalog();
	const rows = catalog.entries
		.map((entry) => {
			const level = pathClassToNavLevel(entry.pathClass as PathClass);
			if (!level) return null;
			return {
				slug: entry.slug,
				title: entry.title,
				level,
				href: entry.href,
			};
		})
		.filter((row): row is NonNullable<typeof row> => row != null);

	return buildNavTree(rows);
}

export async function rebuildContainsEdges(
	entries: Array<{ slug: string; parentSlug: string | null }>,
): Promise<void> {
	await runWrite(`MATCH (:SpecDocument)-[r:CONTAINS]->(:SpecDocument) DELETE r`);
	for (const entry of entries) {
		if (!entry.parentSlug) continue;
		await runWrite(
			`
			MATCH (parent:SpecDocument {slug: $parentSlug})
			MATCH (child:SpecDocument {slug: $slug})
			MERGE (parent)-[:CONTAINS]->(child)
			`,
			{ parentSlug: entry.parentSlug, slug: entry.slug },
		);
	}
}

export async function rebuildRelatedEdges(
	relations: Array<{ fromSlug: string; toSlug: string; relation: string }>,
): Promise<void> {
	await runWrite(
		`MATCH (:SpecDocument)-[r:RELATED_TO]->(:SpecDocument) DELETE r`,
	);
	for (const edge of relations) {
		await runWrite(
			`
			MATCH (from:SpecDocument {slug: $fromSlug})
			MATCH (to:SpecDocument {slug: $toSlug})
			MERGE (from)-[r:RELATED_TO]->(to)
			SET r.relation = $relation
			`,
			edge,
		);
	}
}

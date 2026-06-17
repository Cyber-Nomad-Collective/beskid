import type {
	PlatformSpecCatalogEntry,
	PlatformSpecDocumentBundle,
} from "@cyber-nomad-collective/trudoc/platform-spec/catalog";
import {
	buildNavTree,
	pathClassToNavLevel,
	type NavTreeNode,
} from "@cyber-nomad-collective/trudoc/platform-spec/nav-tree";
import { pathClassFromRel } from "@cyber-nomad-collective/spec-core";
import { listLocalNodes } from "./index.js";

function hrefForSlug(slug: string): string {
	return `/platform-spec/${slug.replace(/^platform-spec\/?/, "")}`;
}

function relFromSlug(slug: string): string {
	return slug.replace(/^platform-spec\/?/, "");
}

export function listLocalCatalog(): PlatformSpecCatalogEntry[] {
	return listLocalNodes().map((item) => {
		const rel = relFromSlug(item.slug);
		return {
			slug: item.slug,
			href: hrefForSlug(item.slug),
			pathClass: pathClassFromRel(rel || "index"),
			specLevel: item.node.specLevel,
			title: item.node.title,
			description: item.node.description ?? null,
			status: item.node.status ?? null,
			adrId: item.node.adrId ?? null,
			adrStatus: item.node.adrStatus ?? null,
			repoPath: item.slug,
			contentPath: `/api/v1/docs/${item.slug}`,
			parentSlug: item.node.parentSlug ?? null,
			hasLayoutJson: item.layoutJson != null,
		};
	});
}

export function getLocalDocumentBySlug(
	slug: string,
): PlatformSpecDocumentBundle | null {
	const item = listLocalNodes().find((node) => node.slug === slug);
	if (!item) return null;

	return {
		slug: item.slug,
		href: hrefForSlug(item.slug),
		pathClass: pathClassFromRel(relFromSlug(item.slug) || "index"),
		title: item.node.title,
		description: item.node.description ?? null,
		status: item.node.status ?? null,
		specLevel: item.node.specLevel,
		frontmatter: {
			title: item.node.title,
			description: item.node.description,
			specLevel: item.node.specLevel,
			status: item.node.status,
			adrId: item.node.adrId,
			adrStatus: item.node.adrStatus,
			adrDate: item.node.adrDate,
			relatedTopics: item.node.relatedTopics,
			architectureGraph: item.node.architectureGraph,
		},
		body: item.bodyMd,
		layoutJson: item.layoutJson,
		contentJson: null,
	};
}

export function getLocalNavTree(): NavTreeNode[] {
	const entries = listLocalCatalog().map((entry) => ({
		slug: entry.slug,
		href: entry.href,
		title: entry.title,
		level: pathClassToNavLevel(entry.pathClass),
	}));

	return buildNavTree(entries);
}

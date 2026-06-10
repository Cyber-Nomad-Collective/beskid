import { createServerFn } from "@tanstack/react-start";

import type { PlatformSpecDocumentBundle } from "@cyber-nomad-collective/trudoc/platform-spec/catalog";
import type { NavTreeNode } from "@cyber-nomad-collective/trudoc/platform-spec/nav-tree";
import {
	getLocalDocumentBySlug,
	getLocalNavTree,
	listLocalCatalog,
} from "#/server/local-workspace/catalog";
import { localWorkspaceRoot } from "#/server/local-workspace/index";
import {
	getDocumentBySlug,
	getNavTree,
	listCatalog,
} from "#/server/memgraph/documents";

export const fetchCatalog = createServerFn({ method: "GET" }).handler(async () => {
	if (localWorkspaceRoot()) {
		return { entries: listLocalCatalog() };
	}
	return listCatalog();
});

export const fetchNavTree = createServerFn({ method: "GET" }).handler(async () => {
	if (localWorkspaceRoot()) {
		return getLocalNavTree();
	}
	return getNavTree();
});

export const fetchDocumentBySlug = createServerFn({ method: "GET" })
	.inputValidator((data: { slug: string }) => data)
	.handler(async ({ data }): Promise<PlatformSpecDocumentBundle | null> => {
		if (localWorkspaceRoot()) {
			return getLocalDocumentBySlug(data.slug);
		}
		return getDocumentBySlug(data.slug);
	});

export type { NavTreeNode };

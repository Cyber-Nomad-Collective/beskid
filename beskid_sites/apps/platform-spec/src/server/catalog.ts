import { createServerFn } from "@tanstack/react-start";

import {
	getOpenSpecDocument,
	getOpenSpecNavTree,
	loadOpenSpecCatalog,
	type OpenSpecDocumentBundle,
	type OpenSpecNavNode,
} from "#/server/openspec/reader";

export const fetchCatalog = createServerFn({ method: "GET" }).handler(
	async () => {
		return loadOpenSpecCatalog();
	},
);

export const fetchNavTree = createServerFn({ method: "GET" }).handler(
	async () => {
		return getOpenSpecNavTree();
	},
);

export const fetchDocumentBySlug = createServerFn({ method: "GET" })
	.inputValidator((data: { slug: string }) => data)
	.handler(async ({ data }): Promise<OpenSpecDocumentBundle | null> => {
		return getOpenSpecDocument(data.slug);
	});

export type NavTreeNode = OpenSpecNavNode;

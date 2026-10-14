import type { ApiDocItem, ApiDocRoot } from "./pckg-api";

/** Small schema-v4 `api.json` shaped like corelib's, shared by unit tests. */
const location = {
	file: "src/Collections/List.bd",
	startLine: 1,
	startColumn: 1,
	endLine: 1,
	endColumn: 1,
};

function item(
	partial: Partial<ApiDocItem> & Pick<ApiDocItem, "id" | "name" | "kind">,
): ApiDocItem {
	return { qualifiedName: partial.name, location, ...partial };
}

export const fixture: ApiDocRoot = {
	schemaVersion: 4,
	navigationModel: "graph-v1",
	generator: "test",
	source: "src/Prelude.bd",
	items: [
		item({
			id: 1,
			name: "Collections",
			kind: "module",
			visibility: "public",
			memberIds: [2, 9],
		}),
		item({
			id: 2,
			name: "List",
			kind: "module",
			visibility: "public",
			parentId: 1,
			memberIds: [3, 5, 7],
			qualifiedName: "Collections::List",
		}),
		item({
			id: 3,
			name: "List",
			kind: "type",
			visibility: "public",
			parentId: 2,
			memberIds: [4],
			qualifiedName: "Collections::List::List",
			symbolKey: "corelib::Collections::List::List",
			signature: "type List<T>",
			docMarkdown:
				"Growable list surface.\n@tier(supported)\n\nIndexed access is Tier 3.\n\n**Type parameter `T`**\nElement type.\n",
			doc: {
				summaryMarkdown: "Growable list surface.",
				typeParameters: [{ name: "T", markdown: "Element type." }],
			},
		}),
		item({
			id: 4,
			name: "count",
			kind: "field",
			visibility: "public",
			parentId: 3,
			fieldType: { display: "i64" },
			docMarkdown: "Logical element count.",
		}),
		item({
			id: 5,
			name: "Count",
			kind: "function",
			visibility: "public",
			parentId: 2,
			memberIds: [6],
			qualifiedName: "Collections::List::Count",
			signature: "i64 Count(List list)",
			returnType: { display: "i64" },
			parameters: [
				{
					name: "list",
					type: { display: "List", refItemId: 3 },
					docMarkdown: "List handle.",
				},
			],
			docMarkdown:
				"Returns the logical element count.\n\n```beskid\nlet n = Count(list)\n```\n\n**Parameter `list`**\nList handle.\n\n**Returns**\n\n`count` field.\n",
			doc: {
				summaryMarkdown: "Returns the logical element count.",
				returnsMarkdown: "`count` field.",
			},
		}),
		item({ id: 6, name: "list", kind: "parameter", parentId: 5 }),
		item({
			id: 7,
			name: "__alloc",
			kind: "function",
			visibility: "public",
			parentId: 2,
		}),
		item({
			id: 9,
			name: "Shape",
			kind: "enum",
			visibility: "public",
			parentId: 1,
			memberIds: [10],
		}),
		item({
			id: 10,
			name: "Circle",
			kind: "enum_variant",
			visibility: "public",
			parentId: 9,
		}),
		item({ id: 11, name: "__array_new", kind: "module", visibility: "public" }),
	],
};

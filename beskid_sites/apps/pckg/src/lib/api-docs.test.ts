import { describe, expect, it } from "vitest";
import {
	breadcrumbs,
	buildApiIndex,
	buildNavTree,
	defaultPage,
	exampleOf,
	memberGroups,
	outlineFor,
	remarksOf,
	resolveItem,
	summaryOf,
} from "./api-docs";
import { fixture } from "./api-docs.fixture";
import type { ApiDocItem } from "./pckg-api";

describe("api-docs read model", () => {
	const index = buildApiIndex(fixture);

	it("builds navigation from parent edges and hides compiler-internal roots", () => {
		const tree = buildNavTree(index);
		expect(tree.map((node) => node.item.name)).toEqual(["Collections"]);
		const collections = tree[0];
		expect(
			collections?.children.map((node) => `${node.item.kind}:${node.item.name}`),
		).toEqual(["module:List", "enum:Shape"]);
		const list = collections?.children[0];
		expect(
			list?.children.map((node) => `${node.item.kind}:${node.item.name}`),
		).toEqual(["type:List", "function:Count"]);
		expect(defaultPage(index)?.name).toBe("Collections");
	});

	it("groups members like a .NET reference page, including receiver methods on types", () => {
		const listType = index.byId.get(3) as ApiDocItem;
		expect(
			memberGroups(index, listType).map(
				(group) => `${group.title}:${group.items.map((i) => i.name).join(",")}`,
			),
		).toEqual(["Fields:count", "Methods:Count"]);
		const module = index.byId.get(2) as ApiDocItem;
		expect(memberGroups(index, module).map((group) => group.title)).toEqual([
			"Types",
			"Functions",
		]);
		expect(memberGroups(index, index.byId.get(9) as ApiDocItem)[0]).toMatchObject(
			{ title: "Variants" },
		);
	});

	it("extracts summary, remarks and examples from the doc markdown", () => {
		const listType = index.byId.get(3) as ApiDocItem;
		expect(summaryOf(listType)).toBe("Growable list surface.");
		expect(remarksOf(listType)).toBe("Indexed access is Tier 3.");
		const count = index.byId.get(5) as ApiDocItem;
		expect(exampleOf(count)).toBe("let n = Count(list)");
		expect(summaryOf(index.byId.get(4) as ApiDocItem)).toBe(
			"Logical element count.",
		);
	});

	it("produces the in-article outline in page order", () => {
		const count = index.byId.get(5) as ApiDocItem;
		expect(outlineFor(index, count).map((entry) => entry.id)).toEqual([
			"definition",
			"parameters",
			"returns",
			"examples",
			"source",
		]);
		const listType = index.byId.get(3) as ApiDocItem;
		expect(outlineFor(index, listType).map((entry) => entry.id)).toEqual([
			"definition",
			"remarks",
			"fields",
			"receiver-methods",
			"source",
		]);
	});

	it("resolves selectors by id, symbolKey or qualifiedName and builds breadcrumbs", () => {
		expect(resolveItem(index, "5")?.name).toBe("Count");
		expect(resolveItem(index, "corelib::Collections::List::List")?.id).toBe(3);
		expect(resolveItem(index, "Collections::List::Count")?.id).toBe(5);
		expect(resolveItem(index, "nope")).toBeNull();
		expect(
			breadcrumbs(index, index.byId.get(4) as ApiDocItem).map((i) => i.name),
		).toEqual(["Collections", "List", "List", "count"]);
	});
});

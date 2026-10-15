import { describe, expect, it } from "vitest";
import { buildApiIndex, buildNavTree, isOwn, memberGroups } from "./api-docs";
import type { ApiDocItem, ApiDocRoot } from "./pckg-api";

const location = {
	file: "src/main.bd",
	startLine: 1,
	startColumn: 1,
	endLine: 1,
	endColumn: 1,
};

function item(
	over: Partial<ApiDocItem> & Pick<ApiDocItem, "id" | "name" | "kind">,
): ApiDocItem {
	return {
		qualifiedName: `::${over.name}`,
		visibility: "public",
		location,
		...over,
	};
}

// A concurrency-like package: its own `Concurrency` module, one own function
// added inside the dependency's `Core` module, and the dependency's own
// `Core::Results` module that it never extends.
const root: ApiDocRoot = {
	schemaVersion: 4,
	navigationModel: "graph-v1",
	generator: "test",
	source: "src/main.bd",
	items: [
		item({ id: 1, name: "Concurrency", kind: "module", memberIds: [2] }),
		item({ id: 2, name: "Channel", kind: "type", parentId: 1, memberIds: [3] }),
		item({ id: 3, name: "Capacity", kind: "field", parentId: 2 }),
		item({
			id: 10,
			name: "Core",
			kind: "module",
			declaringPackage: "corelib_foundation",
			memberIds: [11, 12],
		}),
		item({
			id: 11,
			name: "Results",
			kind: "module",
			parentId: 10,
			declaringPackage: "corelib_foundation",
			memberIds: [13],
		}),
		item({ id: 12, name: "Spawn", kind: "function", parentId: 10 }),
		item({
			id: 13,
			name: "Result",
			kind: "type",
			parentId: 11,
			declaringPackage: "corelib_foundation",
		}),
	],
};

describe("api.json with a dependency closure", () => {
	const index = buildApiIndex(root);

	it("shows own items and only the dependency modules that contain them", () => {
		const names = (nodes: ReturnType<typeof buildNavTree>): unknown[] =>
			nodes.map((node) => [node.item.name, names(node.children)]);
		expect(names(buildNavTree(index))).toEqual([
			["Concurrency", [["Channel", []]]],
			["Core", [["Spawn", []]]],
		]);
	});

	it("lists only this package's additions under a dependency module", () => {
		const core = index.byId.get(10) as ApiDocItem;
		expect(
			memberGroups(index, core).flatMap((group) => group.items.map((i) => i.name)),
		).toEqual(["Spawn"]);
		const channel = index.byId.get(2) as ApiDocItem;
		expect(memberGroups(index, channel)[0]?.items.map((i) => i.name)).toEqual([
			"Capacity",
		]);
	});

	it("keeps dependency items resolvable for cross-references", () => {
		const result = index.byId.get(13) as ApiDocItem;
		expect(isOwn(result)).toBe(false);
		expect(result.declaringPackage).toBe("corelib_foundation");
	});
});

describe("compiler internals", () => {
	it("hides items declared in a synthesized workspace entry file", () => {
		const index = buildApiIndex({
			...root,
			items: [
				...root.items,
				item({
					id: 20,
					name: "",
					kind: "module",
					location: { ...location, file: "src/__workspace_entry__.bd" },
					memberIds: [21],
				}),
				item({
					id: 21,
					name: "ParseDigit",
					kind: "function",
					parentId: 20,
					location: { ...location, file: "src/__workspace_entry__.bd" },
				}),
			],
		});
		expect(buildNavTree(index).map((node) => node.item.name)).toEqual([
			"Concurrency",
			"Core",
		]);
	});
});

describe("unnamed namespace modules", () => {
	it("hoist their children instead of becoming a tree level", () => {
		const index = buildApiIndex({
			...root,
			items: [
				item({ id: 30, name: "", kind: "module", memberIds: [31] }),
				item({ id: 31, name: "Runtime", kind: "module", parentId: 30 }),
				item({ id: 32, name: "Exit", kind: "function", parentId: 31 }),
			],
		});
		const tree = buildNavTree(index);
		expect(tree.map((node) => node.item.name)).toEqual(["Runtime"]);
		expect(tree[0]?.children.map((node) => node.item.name)).toEqual(["Exit"]);
	});
});

describe("modules that only hold internals", () => {
	it("are not shown", () => {
		const index = buildApiIndex({
			...root,
			items: [
				item({ id: 40, name: "beskid", kind: "module", memberIds: [41] }),
				item({
					id: 41,
					name: "ParseDigit",
					kind: "function",
					parentId: 40,
					location: { ...location, file: "src/__workspace_entry__.bd" },
				}),
				item({ id: 42, name: "Runtime", kind: "module" }),
				item({ id: 43, name: "Exit", kind: "function", parentId: 42 }),
			],
		});
		expect(buildNavTree(index).map((node) => node.item.name)).toEqual([
			"Runtime",
		]);
	});
});

describe("root namespace declared in the workspace entry", () => {
	it("still exposes the real modules beneath it", () => {
		const entry = { ...location, file: "src/__workspace_entry__.bd" };
		const index = buildApiIndex({
			...root,
			items: [
				item({
					id: 50,
					name: "",
					kind: "module",
					location: entry,
					memberIds: [51],
				}),
				item({ id: 51, name: "Core", kind: "module", parentId: 50 }),
				item({ id: 52, name: "Option", kind: "type", parentId: 51 }),
			],
		});
		expect(buildNavTree(index).map((node) => node.item.name)).toEqual(["Core"]);
	});
});

describe("modules declared in the workspace entry", () => {
	it("are shown when they contain real API", () => {
		const entry = { ...location, file: "src/__workspace_entry__.bd" };
		const index = buildApiIndex({
			...root,
			items: [
				item({
					id: 60,
					name: "Core",
					kind: "module",
					location: entry,
					memberIds: [61],
				}),
				item({
					id: 61,
					name: "Bytes",
					kind: "module",
					parentId: 60,
					location: entry,
				}),
				item({ id: 62, name: "BufferReader", kind: "type", parentId: 61 }),
			],
		});
		const tree = buildNavTree(index);
		expect(tree.map((node) => node.item.name)).toEqual(["Core"]);
		expect(tree[0]?.children[0]?.children.map((node) => node.item.name)).toEqual([
			"BufferReader",
		]);
	});
});

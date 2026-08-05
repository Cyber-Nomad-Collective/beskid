import { describe, expect, it } from "vitest";
import { reconcileMosaicTree, updateMosaicSplit } from "./workspaceLayout";

describe("reconcileMosaicTree", () => {
	it("preserves a valid saved mosaic tree and its split sizes", () => {
		const tree = reconcileMosaicTree(
			{
				kind: "split",
				direction: "vertical",
				split: 67,
				first: { kind: "leaf", tileId: "editor" },
				second: {
					kind: "split",
					direction: "horizontal",
					split: 35,
					first: { kind: "leaf", tileId: "terminal" },
					second: { kind: "leaf", tileId: "content" },
				},
			},
			["editor", "terminal", "content"],
		);

		expect(tree).toMatchObject({
			kind: "split",
			split: 67,
			second: { kind: "split", split: 35 },
		});
	});

	it("updates only the requested nested separator and clamps its size", () => {
		const tree = reconcileMosaicTree(
			{
				kind: "split",
				direction: "vertical",
				split: 50,
				first: { kind: "leaf", tileId: "editor" },
				second: {
					kind: "split",
					direction: "horizontal",
					split: 35,
					first: { kind: "leaf", tileId: "terminal" },
					second: { kind: "leaf", tileId: "content" },
				},
			},
			["editor", "terminal", "content"],
		);

		expect(tree).not.toBeNull();
		const updated = updateMosaicSplit(tree!, [1], 100);
		expect(updated).toMatchObject({
			kind: "split",
			split: 50,
			second: { kind: "split", split: 92 },
		});
	});
});

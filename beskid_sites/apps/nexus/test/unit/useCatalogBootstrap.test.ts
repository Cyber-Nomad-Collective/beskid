import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	pickInitialCatalogEntry,
	useCatalogBootstrap,
} from "../../src/hooks/useCatalogBootstrap";
import type { PublicCatalogEntry } from "../../src/services/nexus-api";

vi.mock("../../src/services/nexus-api", () => ({
	fetchPublicCatalog: vi.fn(),
}));

import { fetchPublicCatalog } from "../../src/services/nexus-api";

const entry = (
	overrides: Partial<PublicCatalogEntry> = {},
): PublicCatalogEntry => ({
	id: overrides.id ?? "entry-a",
	displayName: overrides.displayName ?? "Entry A",
	description: "",
	gitUrl: "https://github.com/org/a",
	sortOrder: overrides.sortOrder ?? 0,
	indexed: overrides.indexed ?? false,
	registryName: overrides.registryName,
});

describe("pickInitialCatalogEntry", () => {
	it("selects first indexed repo by sortOrder when no query param", () => {
		const entries = [
			entry({ id: "first", sortOrder: 0, indexed: false }),
			entry({
				id: "second",
				displayName: "Second",
				sortOrder: 1,
				indexed: true,
				registryName: "second-repo",
			}),
		];

		expect(pickInitialCatalogEntry(entries, null)).toEqual(entries[1]);
	});

	it("prefers ?repo= match when indexed", () => {
		const entries = [
			entry({
				id: "alpha",
				sortOrder: 0,
				indexed: true,
				registryName: "alpha",
			}),
			entry({
				id: "beta",
				sortOrder: 1,
				indexed: true,
				registryName: "beta",
			}),
		];

		expect(pickInitialCatalogEntry(entries, "beta")).toEqual(entries[1]);
	});
});

describe("useCatalogBootstrap", () => {
	beforeEach(() => {
		vi.mocked(fetchPublicCatalog).mockReset();
		window.history.replaceState({}, "", "/");
	});

	it("selects first indexed repo when no query param", async () => {
		const entries = [
			entry({ id: "first", sortOrder: 0, indexed: false }),
			entry({
				id: "second",
				sortOrder: 1,
				indexed: true,
				registryName: "second-repo",
			}),
		];
		vi.mocked(fetchPublicCatalog).mockResolvedValue(entries);

		const onSelectRepo = vi.fn();

		const { result } = renderHook(() =>
			useCatalogBootstrap({ enabled: true, onSelectRepo }),
		);

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(onSelectRepo).toHaveBeenCalledWith("second-repo", entries[1]);
		expect(result.current.activeEntry?.id).toBe("second");
	});

	it("calls selectRepo with registry name and updates URL", async () => {
		const entries = [
			entry({
				id: "alpha",
				sortOrder: 0,
				indexed: true,
				registryName: "alpha-registry",
			}),
			entry({
				id: "beta",
				sortOrder: 1,
				indexed: true,
				registryName: "beta-registry",
			}),
		];
		vi.mocked(fetchPublicCatalog).mockResolvedValue(entries);

		const onSelectRepo = vi.fn();

		const { result } = renderHook(() =>
			useCatalogBootstrap({ enabled: true, onSelectRepo }),
		);

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		onSelectRepo.mockClear();
		result.current.selectRepo(entries[1]!);

		expect(onSelectRepo).toHaveBeenCalledWith("beta-registry", entries[1]);
		expect(window.location.search).toContain("repo=beta");
	});
});

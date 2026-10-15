import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PackageSummary, PackageVersionSummary } from "#/lib/pckg-api";
import type { ReleaseCenterApi } from "./release-page";
import { ReleasesCenter } from "./releases-center";

const owned = [
	{ id: "p1", name: "beskid.http" },
	{ id: "p2", name: "beskid.json" },
] as PackageSummary[];

function version(
	packageName: string,
	semver: string,
	publishedAtUtc: string,
	isYanked = false,
): PackageVersionSummary {
	return {
		id: `${packageName}@${semver}`,
		packageId: packageName,
		packageName,
		version: semver,
		isYanked,
		checksumSha256: "0123456789abcdef0123456789abcdef",
		sizeBytes: 3 * 1024,
		publishedAtUtc,
		yankedAtUtc: isYanked ? publishedAtUtc : null,
		hasReadme: false,
	};
}

function fakeApi() {
	const versions: Record<string, PackageVersionSummary[]> = {
		"beskid.http": [
			version("beskid.http", "1.0.0", "2026-07-01T00:00:00Z"),
			version("beskid.http", "1.1.0", "2026-07-20T00:00:00Z"),
		],
		"beskid.json": [
			version("beskid.json", "0.3.0", "2026-07-10T00:00:00Z", true),
		],
	};
	const api = {
		listApiKeys: vi.fn(),
		createApiKey: vi.fn(),
		revokeApiKey: vi.fn(),
		listPackages: vi.fn(async () => owned),
		listPackageVersions: vi.fn(async (name: string) => versions[name] ?? []),
		yankVersion: vi.fn(async (name: string, semver: string) => {
			versions[name] = versions[name].map((item) =>
				item.version === semver ? { ...item, isYanked: true } : item,
			);
			return { success: true, message: "version yanked", version: null };
		}),
		unyankVersion: vi.fn(async () => ({
			success: true,
			message: "",
			version: null,
		})),
	};
	return api as unknown as ReleaseCenterApi & typeof api;
}

function renderCenter(api: ReleaseCenterApi) {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return render(
		<QueryClientProvider client={client}>
			<ReleasesCenter api={api} />
		</QueryClientProvider>,
	);
}

describe("ReleasesCenter", () => {
	afterEach(cleanup);

	it("lists every version across owned packages, newest first", async () => {
		renderCenter(fakeApi());
		const rows = await screen.findAllByRole("row");
		expect(rows).toHaveLength(4);
		expect(rows[1]).toHaveTextContent("beskid.http");
		expect(rows[1]).toHaveTextContent("1.1.0");
		expect(rows[1]).toHaveTextContent("20 Jul 2026");
		expect(rows[1]).toHaveTextContent("3.0 KiB");
		expect(rows[2]).toHaveTextContent("beskid.json");
		expect(within(rows[2]).getByText("Yanked")).toBeInTheDocument();
		expect(
			within(rows[2]).getByRole("button", { name: "Unyank beskid.json 0.3.0" }),
		).toBeInTheDocument();
		expect(rows[3]).toHaveTextContent("1.0.0");
	});

	it("yanks a version only after confirmation and refreshes the row", async () => {
		const user = userEvent.setup();
		const api = fakeApi();
		renderCenter(api);
		await user.click(
			await screen.findByRole("button", { name: "Yank beskid.http 1.1.0" }),
		);
		const confirm = screen.getByRole("alertdialog", {
			name: "Yank beskid.http 1.1.0?",
		});
		await user.click(
			within(confirm).getByRole("button", { name: "Yank version" }),
		);
		expect(api.yankVersion).toHaveBeenCalledWith("beskid.http", "1.1.0");
		await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
		expect(
			await screen.findByRole("button", { name: "Unyank beskid.http 1.1.0" }),
		).toBeInTheDocument();
	});

	it("shows an empty state for a publisher without releases", async () => {
		const api = fakeApi();
		api.listPackages.mockResolvedValueOnce([]);
		renderCenter(api);
		expect(await screen.findByText("No releases yet")).toBeInTheDocument();
	});
});

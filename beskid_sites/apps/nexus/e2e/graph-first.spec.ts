import { expect, test } from "@playwright/test";

/**
 * Graph-first Beskid Nexus UX — catalog bootstrap, graph canvas, repo selector.
 * Mocks same-origin API routes so tests run without a live gitnexus server.
 */

const MOCK_CATALOG = [
	{
		id: "alpha",
		displayName: "Alpha Repo",
		description: "First indexed repository",
		gitUrl: "https://github.com/example/alpha",
		sortOrder: 0,
		indexed: true,
		registryName: "alpha",
		stats: { nodes: 42, edges: 80 },
	},
	{
		id: "beta",
		displayName: "Beta Repo",
		description: "Second indexed repository",
		gitUrl: "https://github.com/example/beta",
		sortOrder: 1,
		indexed: true,
		registryName: "beta",
		stats: { nodes: 24, edges: 36 },
	},
];

const MOCK_GRAPH = {
	nodes: [
		{
			id: "File:src/main.bd",
			label: "File",
			properties: { name: "main.bd", filePath: "src/main.bd", language: "beskid" },
		},
		{
			id: "Function:main",
			label: "Function",
			properties: {
				name: "main",
				filePath: "src/main.bd",
				startLine: 1,
				endLine: 10,
			},
		},
	],
	relationships: [
		{
			id: "rel-1",
			sourceId: "File:src/main.bd",
			targetId: "Function:main",
			type: "CONTAINS",
			properties: {},
		},
	],
};

async function mockGraphFirstApi(page: import("@playwright/test").Page) {
	await page.route("**/api/admin/setup/status", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				oauthConfigured: true,
				authHubConfigured: true,
				authHubUrl: null,
				adminConfigured: true,
				oauthSource: "hub",
				hasSessionSecret: true,
				hasSetupToken: false,
			}),
		});
	});

	await page.route("**/api/health", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: '{"ok":true}',
		});
	});

	await page.route("**/api/repos", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify([
				{ name: "alpha", path: "/data/alpha" },
				{ name: "beta", path: "/data/beta" },
			]),
		});
	});

	// Match only the singular endpoint. A glob for `/api/repo**` also captures
	// `/api/repos`; because Playwright evaluates later routes first, that makes
	// the repository-list response incorrectly look like repository metadata.
	await page.route(/\/api\/repo(?:\?.*)?$/, async (route) => {
		const url = new URL(route.request().url());
		const repo = url.searchParams.get("repo") ?? "alpha";
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				name: repo,
				path: `/data/${repo}`,
				repoPath: `/data/${repo}`,
			}),
		});
	});

	await page.route("**/api/auth/me", async (route) => {
		await route.fulfill({
			status: 401,
			contentType: "application/json",
			body: "{}",
		});
	});

	await page.route("**/api/catalog", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(MOCK_CATALOG),
		});
	});

	await page.route("**/api/graph**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(MOCK_GRAPH),
		});
	});

	// EventSource can't be satisfied by route.fulfill() — the response
	// completes immediately and EventSource fires 'error' + reconnect
	// in a tight loop.  Aborting the route lets EventSource fail once
	// per connection attempt instead of reconnecting continuously.
	await page.route("**/api/heartbeat", async (route) => {
		await route.abort("connectionrefused");
	});
}

test.describe("Graph-first landing", () => {
	test.setTimeout(60_000);

	test("loads first indexed repo and shows graph canvas", async ({ page }) => {
		await mockGraphFirstApi(page);
		await page.goto("/");

		await expect(page.locator(".sigma-container")).toBeVisible({
			timeout: 30_000,
		});
		await expect(page.getByTestId("status-ready")).toBeVisible({
			timeout: 30_000,
		});
		await expect(page.getByTestId("graph-stats")).toContainText("nodes");
	});

	test("repo selector switches active repository", async ({ page }) => {
		await mockGraphFirstApi(page);
		await page.goto("/");

		await expect(page.locator(".sigma-container")).toBeVisible({
			timeout: 30_000,
		});

		const selector = page.getByTestId("repo-selector");
		await expect(selector).toBeVisible();
		await selector.click();

		await page.getByRole("option", { name: "Beta Repo" }).click();

		await expect(page).toHaveURL(/repo=beta/);
		await expect(page.getByTestId("status-ready")).toBeVisible({
			timeout: 30_000,
		});
	});
});

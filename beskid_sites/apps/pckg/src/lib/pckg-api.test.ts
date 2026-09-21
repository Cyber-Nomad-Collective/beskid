import { describe, expect, it } from "vitest";

import { PckgApiClient } from "./pckg-api";

describe("PckgApiClient", () => {
	it("uses the registry search endpoint for a package query", async () => {
		const requests: Request[] = [];
		const client = new PckgApiClient({
			fetch: async (request) => {
				requests.push(new Request(request));
				return Response.json([
					{
						package: {
							id: "1",
							name: "beskid.compiler",
							description: "Compiler",
							tags: ["tooling"],
						},
					},
				]);
			},
		});

		await expect(
			client.listPackages({ query: "compiler" }),
		).resolves.toMatchObject([{ name: "beskid.compiler" }]);
		expect(new URL(requests[0].url, "https://pckg.test").pathname).toBe(
			"/api/search",
		);
		expect(new URL(requests[0].url, "https://pckg.test").search).toBe(
			"?q=compiler",
		);
	});

	it("loads the registry index without using a search wrapper", async () => {
		const requests: Request[] = [];
		const client = new PckgApiClient({
			fetch: async (request) => {
				requests.push(new Request(request));
				return Response.json([
					{ id: "1", name: "beskid.compiler", description: "Compiler", tags: [] },
				]);
			},
		});

		await expect(client.listPackages()).resolves.toMatchObject([
			{ name: "beskid.compiler" },
		]);
		expect(new URL(requests[0].url, "https://pckg.test").pathname).toBe(
			"/api/packages",
		);
	});

	it("loads public GitHub-subject publishers and their package catalog without client-side filtering", async () => {
		const requests: Request[] = [];
		const client = new PckgApiClient({
			fetch: async (request) => {
				const captured = new Request(request);
				requests.push(captured);
				return captured.url.includes("/packages")
					? Response.json([
							{ id: "1", name: "beskid.compiler", description: "Compiler", tags: [] },
						])
					: Response.json([
							{
								subject: "github:42",
								displayName: "github:42",
								isPublisherVerified: true,
								packageCount: 1,
							},
						]);
			},
		});

		await expect(client.listPublishers()).resolves.toMatchObject([
			{ subject: "github:42", displayName: "github:42", packageCount: 1 },
		]);
		await expect(
			client.listPublisherPackages("github:42"),
		).resolves.toMatchObject([{ name: "beskid.compiler" }]);

		expect(
			requests.map(
				(request) =>
					`${request.method} ${new URL(request.url, "https://pckg.test").pathname}`,
			),
		).toEqual([
			"GET /api/publishers",
			"GET /api/publishers/github%3A42/packages",
		]);
		expect(requests.every((request) => request.credentials === "include")).toBe(
			true,
		);
	});

	it("loads the authenticated owner's packages without a client-side filter", async () => {
		const requests: Request[] = [];
		const client = new PckgApiClient({
			fetch: async (request) => {
				requests.push(new Request(request));
				return Response.json([]);
			},
		});

		await client.listPackages({ owner: "me" });
		expect(new URL(requests[0].url, "https://pckg.test").pathname).toBe(
			"/api/packages",
		);
		expect(new URL(requests[0].url, "https://pckg.test").search).toBe(
			"?owner=me",
		);
		expect(requests[0].credentials).toBe("include");
	});

	it("uses credentialed API-key list, create, and revoke contracts", async () => {
		const requests: Request[] = [];
		const client = new PckgApiClient({
			fetch: async (request) => {
				const captured = new Request(request);
				requests.push(captured);
				if (captured.method === "POST")
					return Response.json({
						key: {
							id: "key-1",
							name: "CI",
							prefix: "bpk_",
							scopes: ["publish"],
							createdAtUtc: "2026-07-16T00:00:00Z",
							revokedAtUtc: null,
						},
						plainTextKey: "bpk_secret",
					});
				return captured.method === "DELETE"
					? new Response(null, { status: 204 })
					: Response.json([]);
			},
		});

		await client.listApiKeys();
		await expect(
			client.createApiKey({ name: "CI", scopes: ["publish"] }),
		).resolves.toMatchObject({ plainTextKey: "bpk_secret" });
		await client.revokeApiKey("key-1");

		expect(
			requests.map(
				(request) =>
					`${request.method} ${new URL(request.url, "https://pckg.test").pathname}`,
			),
		).toEqual([
			"GET /api/api-keys",
			"POST /api/api-keys",
			"DELETE /api/api-keys/key-1",
		]);
		expect(requests.every((request) => request.credentials === "include")).toBe(
			true,
		);
		expect(await requests[1].text()).toBe('{"name":"CI","scopes":["publish"]}');
	});

	it("uses credentialed GitHub-subject admin user and permission contracts", async () => {
		const requests: Request[] = [];
		const client = new PckgApiClient({
			fetch: async (request) => {
				const captured = new Request(request);
				requests.push(captured);
				if (captured.method === "PATCH")
					return Response.json({
						subject: "github:42",
						displayName: "github:42",
						publisherVerified: true,
					});
				if (captured.method === "POST")
					return Response.json(
						{
							subject: "github:42",
							resource: "package:beskid.http",
							capability: "moderate",
						},
						{ status: 201 },
					);
				if (captured.url.includes("/permissions"))
					return Response.json([
						{
							subject: "github:42",
							resource: "package:beskid.http",
							capability: "moderate",
						},
					]);
				return Response.json([
					{
						subject: "github:42",
						displayName: "github:42",
						publisherVerified: false,
					},
				]);
			},
		});

		await expect(client.listAdminUsers()).resolves.toMatchObject([
			{ subject: "github:42", displayName: "github:42" },
		]);
		await expect(
			client.updateAdminUser("github:42", {
				publisherVerified: true,
			}),
		).resolves.toMatchObject({ publisherVerified: true });
		await expect(client.listAdminPermissions()).resolves.toMatchObject([
			{ capability: "moderate" },
		]);
		await expect(
			client.grantAdminPermission({
				subject: "github:42",
				resource: "package:beskid.http",
				capability: "moderate",
			}),
		).resolves.toMatchObject({ resource: "package:beskid.http" });

		expect(
			requests.map(
				(request) =>
					`${request.method} ${new URL(request.url, "https://pckg.test").pathname}`,
			),
		).toEqual([
			"GET /api/admin/users",
			"PATCH /api/admin/users/github%3A42",
			"GET /api/admin/permissions",
			"POST /api/admin/permissions",
		]);
		expect(requests.every((request) => request.credentials === "include")).toBe(
			true,
		);
		expect(await requests[1].text()).toBe('{"publisherVerified":true}');
		expect(await requests[3].text()).toBe(
			'{"subject":"github:42","resource":"package:beskid.http","capability":"moderate"}',
		);
	});

	it("uses the implemented admin operational endpoint contracts", async () => {
		const requests: Request[] = [];
		const client = new PckgApiClient({
			fetch: async (request) => {
				const captured = new Request(request);
				requests.push(captured);
				if (captured.url.includes("/admin/registry-activity"))
					return Response.json([
						{
							timestampUtc: "2026-07-27T00:00:00Z",
							severity: "Info",
							action: "publish",
							message: "Published package",
							traceId: null,
							userId: "github:42",
							packageName: "beskid.http",
							version: "1.0.0",
						},
					]);
				if (captured.url.includes("/admin/blocked-links"))
					return captured.method === "POST"
						? Response.json(
								{
									success: true,
									message: "added",
									item: {
										id: "111",
										pattern: "https://bad.example/*",
										note: "test",
										createdAtUtc: "2026-07-27T00:00:00Z",
									},
								},
								{ status: 200 },
							)
						: Response.json([
								{
									id: "111",
									pattern: "https://bad.example/*",
									note: "test",
									createdAtUtc: "2026-07-27T00:00:00Z",
								},
							]);
				if (captured.method === "DELETE")
					return new Response(null, { status: 204 });
				return Response.json({});
			},
		});

		await expect(client.listRegistryActivity(50)).resolves.toHaveLength(1);
		await expect(
			client.addBlockedLink({ pattern: "https://bad.example/*", note: "test" }),
		).resolves.toMatchObject({ success: true });
		await expect(client.deleteBlockedLink("111")).resolves.toBeUndefined();

		expect(
			requests.map(
				(request) =>
					`${request.method} ${new URL(request.url, "https://pckg.test").pathname}`,
			),
		).toEqual([
			"GET /api/admin/registry-activity",
			"POST /api/admin/blocked-links",
			"DELETE /api/admin/blocked-links/111",
		]);
		expect(requests.every((request) => request.credentials === "include")).toBe(
			true,
		);
	});

	it("loads package details with metadata and a latest download URL", async () => {
		const requests: Request[] = [];
		const client = new PckgApiClient({
			fetch: async (request) => {
				requests.push(new Request(request));
				return Response.json({
					package: {
						id: "1",
						name: "beskid.compiler",
						description: "Compiler",
						category: "Tooling",
						repositoryUrl: "https://github.com/beskid-lang/compiler",
						websiteUrl: "https://beskid-lang.org",
						tags: [],
						totalDownloads: 42,
						updatedAtUtc: "2026-01-01T00:00:00Z",
						ownerDisplayName: "Beskid",
					},
					versions: [
						{
							id: "v1",
							version: "1.2.3",
							publishedAtUtc: "2026-01-01T00:00:00Z",
							isYanked: false,
							checksumSha256: "abc",
							sizeBytes: 1234,
							hasReadme: true,
						},
					],
					dependencies: [],
					dependentsCount: 4,
					readme: "# Compiler",
					latestVersion: "1.2.3",
				});
			},
		});

		const details = await client.getPackage("beskid.compiler");
		expect(new URL(requests[0].url, "https://pckg.test").pathname).toBe(
			"/api/packages/beskid.compiler",
		);
		expect(details.package.repositoryUrl).toBe(
			"https://github.com/beskid-lang/compiler",
		);
		expect(details.latestDownloadUrl).toBe(
			"http://localhost:3000/api/packages/beskid.compiler/versions/latest/download",
		);
		expect(details.versions[0].hasReadme).toBe(true);
	});

	it("keeps browser session requests credentialed and reports unauthenticated users", async () => {
		const client = new PckgApiClient({
			fetch: async (request) => {
				expect(new Request(request).credentials).toBe("include");
				return new Response(null, { status: 401 });
			},
		});

		await expect(client.getSession()).resolves.toBeNull();
	});

	it("builds a version-specific package download URL", () => {
		const client = new PckgApiClient({ fetch: async () => Response.json({}) });

		expect(client.packageDownloadUrl("beskid/http", "1.2.3")).toBe(
			"http://localhost:3000/api/packages/beskid%2Fhttp/versions/1.2.3/download",
		);
	});

	it("loads versioned artifact documentation and source through the read-only browse endpoints", async () => {
		const requests: Request[] = [];
		const client = new PckgApiClient({
			fetch: async (request) => {
				const captured = new Request(request);
				requests.push(captured);
				if (captured.url.includes("/docs/structured"))
					return Response.json({ readme: "# Demo", metadata: { title: "Demo" } });
				if (captured.url.endsWith("/docs") || captured.url.includes("/source/tree"))
					return Response.json([{ path: "docs/guide.md", sizeBytes: 12 }]);
				return new Response("module Demo", {
					headers: { "content-type": "text/plain" },
				});
			},
		});

		await expect(client.getPackageReadme("beskid.demo", "1.2.3")).resolves.toBe(
			"module Demo",
		);
		await expect(client.listPackageDocs("beskid.demo", "1.2.3")).resolves.toEqual(
			[{ path: "docs/guide.md", sizeBytes: 12 }],
		);
		await expect(
			client.getPackageDoc("beskid.demo", "1.2.3", "docs/guide.md"),
		).resolves.toBe("module Demo");
		await expect(
			client.getStructuredPackageDocs("beskid.demo", "1.2.3"),
		).resolves.toMatchObject({ metadata: { title: "Demo" } });
		await expect(
			client.listPackageSource("beskid.demo", "1.2.3"),
		).resolves.toEqual([{ path: "docs/guide.md", sizeBytes: 12 }]);
		await expect(
			client.getPackageSource("beskid.demo", "1.2.3", "src/main.bsk"),
		).resolves.toBe("module Demo");

		expect(
			requests.map(
				(request) =>
					`${request.method} ${new URL(request.url, "https://pckg.test").pathname}${new URL(request.url, "https://pckg.test").search}`,
			),
		).toEqual([
			"GET /api/packages/beskid.demo/versions/1.2.3/readme",
			"GET /api/packages/beskid.demo/versions/1.2.3/docs",
			"GET /api/packages/beskid.demo/versions/1.2.3/docs/file?path=docs%2Fguide.md",
			"GET /api/packages/beskid.demo/versions/1.2.3/docs/structured",
			"GET /api/packages/beskid.demo/versions/1.2.3/source/tree",
			"GET /api/packages/beskid.demo/versions/1.2.3/source/file?path=src%2Fmain.bsk",
		]);
	});
});

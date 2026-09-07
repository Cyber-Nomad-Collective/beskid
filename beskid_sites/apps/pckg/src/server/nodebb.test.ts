import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalFetch = globalThis.fetch;

function setEnv(over: Record<string, string | undefined>) {
	for (const [key, value] of Object.entries(over)) {
		if (value === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = value;
		}
	}
}

async function importNodebb() {
	vi.resetModules();
	return import("./nodebb");
}

describe("createPackageSubforum", () => {
	beforeEach(() => {
		setEnv({
			NODEBB_API_URL: "https://community.beskid-lang.org",
			NODEBB_ADMIN_TOKEN: "admin-token",
			NODEBB_PACKAGES_PARENT_CID: "5",
			COMMUNITY_URL: "https://community.beskid-lang.org",
		});
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		setEnv({
			NODEBB_API_URL: undefined,
			NODEBB_ADMIN_TOKEN: undefined,
			NODEBB_PACKAGES_PARENT_CID: undefined,
			COMMUNITY_URL: undefined,
		});
	});

	it("creates a category and rescinds topic-create privileges", async () => {
		const calls: Array<{ url: string; method: string; body?: string }> = [];
		globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = String(input);
			calls.push({
				url,
				method: init?.method ?? "GET",
				body: init?.body?.toString(),
			});
			if (url.endsWith("/api/v3/categories/")) {
				return new Response(
					JSON.stringify({
						payload: { cid: 42, name: "beskid.http", slug: "beskid-http" },
					}),
					{ status: 200 },
				);
			}
			if (url.includes("/privileges/groups:topics:create/registered-users")) {
				return new Response("{}", { status: 200 });
			}
			return new Response("", { status: 404 });
		}) as typeof globalThis.fetch;

		const { createPackageSubforum } = await importNodebb();
		const result = await createPackageSubforum({ packageName: "beskid.http" });

		expect(result.cid).toBe(42);
		expect(result.slug).toBe("beskid-http");
		expect(result.url).toBe(
			"https://community.beskid-lang.org/category/beskid-http",
		);

		const createCall = calls.find((c) => c.url.endsWith("/api/v3/categories/"));
		expect(createCall?.method).toBe("POST");
		expect(createCall?.body).toContain('"parentCid":5');
		expect(createCall?.body).toContain('"name":"beskid.http"');

		const privCall = calls.find((c) =>
			c.url.includes("/privileges/groups:topics:create/registered-users"),
		);
		expect(privCall?.method).toBe("PUT");
	});

	it("throws when the admin token is not configured", async () => {
		setEnv({ NODEBB_ADMIN_TOKEN: undefined });
		const { createPackageSubforum, NodebbError } = await importNodebb();
		await expect(
			createPackageSubforum({ packageName: "x" }),
		).rejects.toBeInstanceOf(NodebbError);
	});

	it("throws when NodeBB returns a non-ok response", async () => {
		globalThis.fetch = (async () =>
			new Response("{}", { status: 500 })) as typeof globalThis.fetch;
		const { createPackageSubforum, NodebbError } = await importNodebb();
		await expect(
			createPackageSubforum({ packageName: "x" }),
		).rejects.toBeInstanceOf(NodebbError);
	});
});

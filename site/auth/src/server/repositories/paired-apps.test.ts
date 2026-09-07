import { beforeEach, describe, expect, it, vi } from "vitest";

const { activeRows } = vi.hoisted(() => ({
	activeRows: [] as Array<Record<string, string | null>>,
}));

vi.mock("#/env.server", () => ({
	env: {
		AUTH_HUB_PUBLIC_URL: "https://auth.beskid-lang.org:8090",
	},
}));

vi.mock("#/server/db/index", () => ({
	getAuthDatabase: () => ({
		query: () => ({
			all: () => activeRows,
		}),
	}),
	getEncryptedHubSetting: vi.fn(),
	setEncryptedHubSetting: vi.fn(),
}));

import { listEnabledApps } from "#/server/repositories/paired-apps";

describe("listEnabledApps", () => {
	beforeEach(() => {
		activeRows.length = 0;
	});

	it("omits retired service rows left behind in the database", async () => {
		activeRows.push(
			{
				id: "platform-spec",
				public_url: "https://spec.beskid-lang.org:8460",
				handoff_secret_hash: "legacy",
				service_token_hash: "legacy",
				status: "active",
				paired_at: "2026-01-01T00:00:00Z",
				approved_by_login: "admin",
			},
			{
				id: "tracker",
				public_url: "https://tracker.beskid-lang.org:8080",
				handoff_secret_hash: "current",
				service_token_hash: "current",
				status: "active",
				paired_at: "2026-01-02T00:00:00Z",
				approved_by_login: "admin",
			},
		);

		await expect(listEnabledApps()).resolves.toEqual([
			{
				id: "tracker",
				label: "Beskid Tracker",
				description: "Kanban delivery tracking and issue management.",
				publicUrl: "https://tracker.beskid-lang.org:8080",
				finishUrl: "https://tracker.beskid-lang.org:8080/api/auth/hub-finish",
				loginUrl: "https://auth.beskid-lang.org:8090/login?app=tracker",
			},
		]);
	});
});

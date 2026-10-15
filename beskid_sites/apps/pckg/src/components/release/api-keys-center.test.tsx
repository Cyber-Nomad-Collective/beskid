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
import type { ApiKey, CreatedApiKey } from "#/lib/pckg-api";
import { ApiKeysCenter } from "./api-keys-center";
import type { ReleaseCenterApi } from "./release-page";

const activeKey: ApiKey = {
	id: "key-1",
	name: "CI release key",
	prefix: "bpk_0a1b2c3d",
	scopes: ["publish"],
	createdAtUtc: "2026-07-16T10:00:00Z",
	revokedAtUtc: null,
};
const revokedKey: ApiKey = {
	id: "key-2",
	name: "Old laptop",
	prefix: "bpk_ffffffff",
	scopes: ["read", "publish"],
	createdAtUtc: "2026-07-01T10:00:00Z",
	revokedAtUtc: "2026-07-10T10:00:00Z",
};
const secret =
	"bpk_0a1b2c3d0a1b2c3d0a1b2c3d0a1b2c3d9f9f9f9f9f9f9f9f9f9f9f9f9f9f9f9f";

function fakeApi(keys: ApiKey[] = [activeKey, revokedKey]) {
	let current = [...keys];
	const api = {
		listApiKeys: vi.fn(async () => current),
		createApiKey: vi.fn(
			async (input: {
				name: string;
				scopes: string[];
			}): Promise<CreatedApiKey> => {
				const key: ApiKey = {
					id: `key-${current.length + 1}`,
					name: input.name,
					prefix: "bpk_11111111",
					scopes: input.scopes,
					createdAtUtc: "2026-07-20T10:00:00Z",
					revokedAtUtc: null,
				};
				current = [...current, key];
				return { key, plainTextKey: secret };
			},
		),
		revokeApiKey: vi.fn(async (id: string) => {
			current = current.map((key) =>
				key.id === id ? { ...key, revokedAtUtc: "2026-07-21T10:00:00Z" } : key,
			);
		}),
		listPackages: vi.fn(async () => []),
		listPackageVersions: vi.fn(async () => []),
		yankVersion: vi.fn(),
		unyankVersion: vi.fn(),
	};
	return api as unknown as ReleaseCenterApi & typeof api;
}

function renderCenter(api: ReleaseCenterApi) {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return render(
		<QueryClientProvider client={client}>
			<ApiKeysCenter api={api} />
		</QueryClientProvider>,
	);
}

describe("ApiKeysCenter", () => {
	afterEach(cleanup);

	it("lists keys with prefix, scopes, created date and status, active first", async () => {
		renderCenter(fakeApi());
		expect(
			screen.getByRole("status", { name: "Loading API keys" }),
		).toBeInTheDocument();

		const rows = await screen.findAllByRole("row");
		// header + two keys
		expect(rows).toHaveLength(3);
		const active = rows[1];
		expect(within(active).getByText("CI release key")).toBeInTheDocument();
		expect(within(active).getByText("bpk_0a1b2c3d…")).toBeInTheDocument();
		expect(within(active).getByText("publish")).toBeInTheDocument();
		expect(
			within(active).getByText("16 Jul 2026, 10:00 UTC"),
		).toBeInTheDocument();
		expect(within(active).getByText("Active")).toBeInTheDocument();
		expect(
			within(active).getByRole("button", { name: "Revoke CI release key" }),
		).toBeInTheDocument();

		const revoked = rows[2];
		expect(within(revoked).getByText("Revoked 10 Jul 2026")).toBeInTheDocument();
		expect(within(revoked).queryByRole("button")).toBeNull();
	});

	it("shows an empty state that opens the create dialog", async () => {
		const user = userEvent.setup();
		renderCenter(fakeApi([]));
		await user.click(
			await screen.findByRole("button", { name: "Create your first key" }),
		);
		expect(
			screen.getByRole("dialog", { name: "Create API key" }),
		).toBeInTheDocument();
	});

	it("reports a load failure with a retry action", async () => {
		const api = fakeApi();
		api.listApiKeys.mockRejectedValueOnce(new Error("registry offline"));
		renderCenter(api);
		const alert = await screen.findByRole("alert");
		expect(alert).toHaveTextContent("Could not load your API keys");
		expect(alert).toHaveTextContent("registry offline");
		await userEvent
			.setup()
			.click(within(alert).getByRole("button", { name: "Try again" }));
		expect(await screen.findByText("CI release key")).toBeInTheDocument();
	});

	it("creates a key and reveals the secret exactly once with copy feedback", async () => {
		// user-event installs its own clipboard stub; observe writes through it.
		const user = userEvent.setup();
		const writeText = vi.spyOn(navigator.clipboard, "writeText");
		const api = fakeApi();
		renderCenter(api);
		await screen.findByText("CI release key");

		await user.click(screen.getByRole("button", { name: "Create key" }));
		const dialog = screen.getByRole("dialog", { name: "Create API key" });
		await user.type(within(dialog).getByLabelText("Name"), "Laptop");
		// Drop the read scope; publish stays selected.
		await user.click(within(dialog).getByRole("checkbox", { name: "Read" }));
		await user.click(within(dialog).getByRole("button", { name: "Create key" }));

		expect(api.createApiKey).toHaveBeenCalledWith({
			name: "Laptop",
			scopes: ["publish"],
		});
		const reveal = await screen.findByRole("dialog", { name: "Key created" });
		expect(
			within(reveal).getByText("This key is shown only once"),
		).toBeInTheDocument();
		expect(within(reveal).getByTestId("created-api-key")).toHaveTextContent(
			secret,
		);
		expect(within(reveal).getByText("publish")).toBeInTheDocument();
		expect(within(reveal).queryByRole("button", { name: "Close" })).toBeNull();

		await user.click(within(reveal).getByRole("button", { name: "Copy key" }));
		expect(writeText).toHaveBeenCalledWith(secret);
		expect(
			await within(reveal).findByRole("button", { name: "Copied" }),
		).toBeInTheDocument();

		// Escape does not dismiss the reveal; only the explicit confirmation does.
		await user.keyboard("{Escape}");
		expect(
			screen.getByRole("dialog", { name: "Key created" }),
		).toBeInTheDocument();

		await user.click(
			within(reveal).getByRole("button", { name: "Done, I saved it" }),
		);
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
		expect(screen.queryByText(secret)).toBeNull();
		expect(await screen.findByText("Laptop")).toBeInTheDocument();

		// Reopening starts from a clean form, never from the previous secret.
		await user.click(screen.getByRole("button", { name: "Create key" }));
		expect(
			screen.getByRole("dialog", { name: "Create API key" }),
		).toBeInTheDocument();
		expect(screen.queryByText(secret)).toBeNull();
		expect(screen.getByLabelText("Name")).toHaveValue("");
	});

	it("requires a name and at least one scope before creating", async () => {
		const user = userEvent.setup();
		const api = fakeApi();
		renderCenter(api);
		await screen.findByText("CI release key");
		await user.click(screen.getByRole("button", { name: "Create key" }));
		const dialog = screen.getByRole("dialog", { name: "Create API key" });
		const submit = within(dialog).getByRole("button", { name: "Create key" });
		expect(submit).toBeDisabled();
		await user.type(within(dialog).getByLabelText("Name"), "x");
		expect(submit).toBeEnabled();
		await user.click(within(dialog).getByRole("checkbox", { name: "Read" }));
		await user.click(within(dialog).getByRole("checkbox", { name: "Publish" }));
		expect(
			within(dialog).getByText("Select at least one scope."),
		).toBeInTheDocument();
		expect(submit).toBeDisabled();
		expect(api.createApiKey).not.toHaveBeenCalled();
	});

	it("revokes a key only after confirmation", async () => {
		const user = userEvent.setup();
		const api = fakeApi();
		renderCenter(api);
		await user.click(
			await screen.findByRole("button", { name: "Revoke CI release key" }),
		);

		const confirm = screen.getByRole("alertdialog", {
			name: "Revoke CI release key?",
		});
		await user.click(within(confirm).getByRole("button", { name: "Cancel" }));
		expect(api.revokeApiKey).not.toHaveBeenCalled();
		await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());

		await user.click(
			screen.getByRole("button", { name: "Revoke CI release key" }),
		);
		await user.click(
			within(screen.getByRole("alertdialog")).getByRole("button", {
				name: "Revoke key",
			}),
		);
		expect(api.revokeApiKey).toHaveBeenCalledWith("key-1");
		await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
		expect(await screen.findByText("Revoked 21 Jul 2026")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Revoke CI release key" }),
		).toBeNull();
	});
});

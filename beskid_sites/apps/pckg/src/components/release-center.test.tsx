import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ApiKey } from "#/lib/pckg-api";
import { ReleaseCenter } from "./release-center";

const key: ApiKey = {
	id: "key-1",
	name: "local",
	prefix: "bsk_live_",
	scopes: ["publish"],
	createdAtUtc: "2026-01-01T00:00:00Z",
	revokedAtUtc: null,
};

describe("ReleaseCenter", () => {
	it("explains the canonical CLI release flow and shows active keys", () => {
		render(
			<ReleaseCenter keys={[key]} onCreateKey={() => {}} onRevokeKey={() => {}} />,
		);
		expect(
			screen.getByRole("heading", { name: "Release center" }),
		).toBeInTheDocument();
		expect(screen.getByText(/beskid pckg publish/)).toBeInTheDocument();
		expect(screen.getByText("local")).toBeInTheDocument();
	});
});

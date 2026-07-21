import { describe, expect, it, vi } from "vitest";

describe("auth-app-meta", () => {
	it("authAppLabel falls back to app id when meta is missing", async () => {
		vi.resetModules();
		vi.doMock("@beskid/auth-client", () => ({
			AUTH_APP_IDS: ["tracker", "nexus", "pckg", "platform-spec"] as const,
			AUTH_APP_META: {
				tracker: { label: "Beskid Tracker", description: "t" },
				nexus: { label: "Beskid Nexus", description: "n" },
				pckg: { label: "pckg registry", description: "p" },
				// platform-spec intentionally absent — mirrors prod mismatch
			},
		}));

		const { authAppLabel, pairingAppOptions, defaultPairingAppId } =
			await import("./auth-app-meta");

		expect(authAppLabel("platform-spec")).toBe("platform-spec");
		expect(authAppLabel("tracker")).toBe("Beskid Tracker");

		const options = pairingAppOptions();
		expect(options.map((o) => o.id)).toEqual(["tracker", "nexus", "pckg"]);
		expect(() =>
			options.map((o) => {
				if (!o.label) throw new Error("missing label");
				return o.label;
			}),
		).not.toThrow();
		expect(defaultPairingAppId(options)).toBe("tracker");
	});

	it("pairingAppOptions includes every catalogued meta entry", async () => {
		vi.resetModules();
		vi.doUnmock("@beskid/auth-client");
		const { pairingAppOptions, authAppLabel } = await import("./auth-app-meta");
		const { AUTH_APP_IDS, AUTH_APP_META } = await import("@beskid/auth-client");

		const options = pairingAppOptions();
		expect(options.length).toBeGreaterThan(0);
		expect(AUTH_APP_IDS).toContain("platform-spec");
		expect(AUTH_APP_META["platform-spec"]?.label).toBe("Platform Spec Editor");
		expect(options.map((o) => o.id)).toContain("platform-spec");
		for (const id of AUTH_APP_IDS) {
			if (AUTH_APP_META[id]) {
				expect(options.some((o) => o.id === id)).toBe(true);
				expect(authAppLabel(id)).toBe(AUTH_APP_META[id].label);
			}
		}
	});
});

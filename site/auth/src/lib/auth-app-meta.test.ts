import { AUTH_APP_IDS, AUTH_APP_META } from "@beskid/auth-client";
import { describe, expect, it } from "vitest";
import {
	authAppLabel,
	defaultPairingAppId,
	pairingAppOptions,
} from "./auth-app-meta";

describe("auth-app-meta", () => {
	it("authAppLabel falls back to an uncatalogued app id", () => {
		expect(authAppLabel("retired-service")).toBe("retired-service");
		expect(authAppLabel("tracker")).toBe("Beskid Tracker");
	});

	it("pairingAppOptions exposes exactly the active service catalog", () => {
		const options = pairingAppOptions();
		expect(AUTH_APP_IDS).toEqual(["tracker", "nexus", "pckg", "learn"]);
		expect(options.map((o) => o.id)).toEqual([
			"tracker",
			"nexus",
			"pckg",
			"learn",
		]);
		for (const id of AUTH_APP_IDS) {
			if (AUTH_APP_META[id]) {
				expect(options.some((o) => o.id === id)).toBe(true);
				expect(authAppLabel(id)).toBe(AUTH_APP_META[id].label);
			}
		}
		expect(defaultPairingAppId(options)).toBe("tracker");
	});
});

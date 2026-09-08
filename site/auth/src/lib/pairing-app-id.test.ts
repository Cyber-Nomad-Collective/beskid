import { describe, expect, it } from "vitest";
import { pairingAppIdSchema } from "./pairing-app-id";

describe("pairingAppIdSchema", () => {
	it("accepts Learn because it is a catalogued consumer app", () => {
		expect(pairingAppIdSchema.safeParse("learn").success).toBe(true);
	});

	it("rejects unknown consumer app ids", () => {
		expect(pairingAppIdSchema.safeParse("unknown").success).toBe(false);
	});

	it("rejects the retired platform-spec service id", () => {
		expect(pairingAppIdSchema.safeParse("platform-spec").success).toBe(false);
	});
});

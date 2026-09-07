import { expect, test } from "vitest";

import {
	assertTrackerSpecLink,
	isPublicDeliveryVersion,
} from "./delivery-contract";

test("requires a stable spec identifier and catalog revision", () => {
	expect(() =>
		assertTrackerSpecLink({ standardId: "", catalogRevision: "" }),
	).toThrow();
});

test("allows only released public versions to be latest", () => {
	expect(
		isPublicDeliveryVersion({ status: "Released", visibility: "public" }),
	).toBe(true);
	expect(
		isPublicDeliveryVersion({ status: "Planned", visibility: "public" }),
	).toBe(false);
});

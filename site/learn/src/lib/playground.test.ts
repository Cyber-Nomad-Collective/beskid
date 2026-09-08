import { describe, expect, it } from "vitest";

import {
	getPlaygroundCode,
	getPlaygroundExercise,
} from "./playground";

describe("playground editor integration", () => {
	it("uses Monaco's current model value when it is newer than React state", () => {
		expect(
			getPlaygroundCode(
				{ getValue: () => "use System;\nunit Run() {}" },
				"",
			),
		).toBe("use System;\nunit Run() {}");
	});

});

describe("playground request metadata", () => {
	it("accepts the playground as an analyze-only check target", () => {
		expect(getPlaygroundExercise("playground")).toMatchObject({
			id: "playground",
			command: "analyze",
		});
	});

	it("does not treat lesson ids as the playground", () => {
		expect(getPlaygroundExercise("01_hello_beskid")).toBeUndefined();
	});
});

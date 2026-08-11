import { describe, expect, it } from "vitest";
import { validateSourceStep } from "./steps";

describe("validateSourceStep", () => {
	it("passes when the required source fragment is present", () => {
		expect(
			validateSourceStep(
				{ id: "return", title: "Return a value", body: "", check: { kind: "source", expectedText: "return 0;" } },
				"i32 Main() {\n  return 0;\n}",
			),
		).toEqual({ ok: true, message: "Step complete." });
	});

	it("fails with an actionable message when source is missing", () => {
		expect(
			validateSourceStep(
				{ id: "return", title: "Return a value", body: "", check: { kind: "source", expectedText: "return 0;" } },
				"i32 Main() {\n}",
		),
		).toEqual({ ok: false, message: "Add `return 0;` to continue." });
	});

	it("does not gate steps without a source check", () => {
		expect(validateSourceStep({ id: "read", title: "Read", body: "" }, "")).toEqual({
			ok: true,
			message: "Step complete.",
		});
	});
});

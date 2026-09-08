import { describe, expect, it } from "vitest";
import { readPlaygroundHandoff } from "./playground-handoff";

describe("playground handoff", () => {
	it("opens the playground with code supplied by a website link", () => {
		expect(readPlaygroundHandoff("?code=unit%20Main%28%29%20%7B%7D")).toEqual({
			code: "unit Main() {}",
			openPlayground: true,
		});
	});

	it("keeps the normal lesson workspace when no handoff is present", () => {
		expect(readPlaygroundHandoff("")).toEqual({ code: "", openPlayground: false });
	});
});

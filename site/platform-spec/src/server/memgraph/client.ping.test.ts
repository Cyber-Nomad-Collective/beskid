import neo4j from "neo4j-driver";
import { describe, expect, it } from "vitest";

import { isMemgraphPingValue } from "./client";

describe("isMemgraphPingValue", () => {
	it("accepts boolean true from RETURN true AS ok", () => {
		expect(isMemgraphPingValue(true)).toBe(true);
		expect(isMemgraphPingValue(false)).toBe(false);
	});

	it("accepts neo4j Integer without strict === 1", () => {
		const value = neo4j.int(1);
		expect(value === 1).toBe(false);
		expect(isMemgraphPingValue(value)).toBe(true);
		expect(isMemgraphPingValue(neo4j.int(0))).toBe(false);
	});

	it("accepts plain number 1", () => {
		expect(isMemgraphPingValue(1)).toBe(true);
		expect(isMemgraphPingValue(0)).toBe(false);
	});
});

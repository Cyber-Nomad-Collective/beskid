import fs from "node:fs";
import path from "node:path";
import { createElement, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
	SpecViewModeProvider,
	useSpecViewMode,
} from "#/components/reader/spec-view-mode";

function ModeProbe() {
	const { mode } = useSpecViewMode();
	return createElement("span", { "data-mode": mode }, mode);
}

describe("useSpecViewMode", () => {
	it("throws outside SpecViewModeProvider", () => {
		expect(() => renderToString(createElement(ModeProbe))).toThrow(
			/useSpecViewMode must be used within SpecViewModeProvider/,
		);
	});

	it("reads default browse mode inside SpecViewModeProvider", () => {
		const html = renderToString(
			createElement(
				SpecViewModeProvider,
				null,
				createElement(ModeProbe) as ReactNode,
			),
		);
		expect(html).toContain('data-mode="browse"');
		expect(html).toContain(">browse<");
	});
});

describe("ReaderChrome provider wiring", () => {
	it("wraps chrome with SpecViewModeProvider so document routes share the shell", () => {
		const source = fs.readFileSync(
			path.join(import.meta.dirname, "reader-chrome.tsx"),
			"utf8",
		);
		expect(source).toContain("SpecViewModeProvider");
		expect(source).toMatch(/<SpecViewModeProvider>[\s\S]*<ReaderTopBarActions/);
	});
});

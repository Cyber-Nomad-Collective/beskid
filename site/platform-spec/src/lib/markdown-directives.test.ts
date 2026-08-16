import { describe, expect, it } from "vitest";

import {
	parseBeskidDirective,
	transformBeskidDirectives,
} from "./markdown-directives";

describe("Beskid Markdown directives", () => {
	it("parses typed directive fields", () => {
		expect(
			parseBeskidDirective(
				"spec",
				"ref: compiler--pipeline--aot#artifact\ntitle: AOT artifact",
			),
		).toEqual({
			kind: "spec",
			ref: "compiler--pipeline--aot#artifact",
			title: "AOT artifact",
		});
	});

	it("keeps readable fallback content in a custom element", () => {
		const html = transformBeskidDirectives(
			"```book\nref: 14-from-source-to-runs\ntitle: Build chapter\n```",
		);
		expect(html).toContain('<beskid-doc-embed kind="book"');
		expect(html).toContain(">Build chapter</a>");
	});

	it("renders inline author graphs as author-graph embeds", () => {
		const html = transformBeskidDirectives(
			"```graph\ntitle: Fiber scheduler data flow\nnodes: scheduler, fiber, channel, gc\nedges: scheduler->fiber:spawns, fiber->channel:reads, fiber->gc:roots\n```",
		);
		expect(html).toContain('<beskid-doc-embed kind="author-graph"');
		expect(html).toContain('data-graph="');
		expect(html).toContain("Fiber scheduler data flow");
	});

	it("falls back to ref-based graph directive when no inline nodes/edges", () => {
		const html = transformBeskidDirectives(
			"```graph\nref: compiler\ntitle: Compiler map\n```",
		);
		expect(html).toContain('<beskid-doc-embed kind="graph"');
		expect(html).toContain('ref="compiler"');
	});

	it("forwards editable/height/traversal fields on inline author graphs", () => {
		const html = transformBeskidDirectives(
			"```graph\ntitle: Fiber scheduler data flow\nnodes: scheduler, fiber\nedges: scheduler->fiber:spawns\neditable: true\nheight: 320\ntraversal: build\n```",
		);
		expect(html).toContain('data-editable="true"');
		expect(html).toContain('data-height="320"');
		expect(html).toContain('data-traversal="build"');
	});

	it("renders GitHub code directives with line ranges", () => {
		const html = transformBeskidDirectives(
			"```code\nrepo: Cyber-Nomad-Collective/beskid\npath: compiler/crates/beskid_isle/isle/expressions.isle\nlines: 1-26\nlang: rust\n```",
		);
		expect(html).toContain('<beskid-doc-embed kind="github-code"');
		expect(html).toContain('repo="Cyber-Nomad-Collective/beskid"');
		expect(html).toContain(
			'path="compiler/crates/beskid_isle/isle/expressions.isle"',
		);
		expect(html).toContain('start-line="1"');
		expect(html).toContain('end-line="26"');
		expect(html).toContain('lang="rust"');
		expect(html).toContain("expressions.isle · L1–26");
		expect(html).toContain(
			"https://github.com/Cyber-Nomad-Collective/beskid/blob/main/compiler/crates/beskid_isle/isle/expressions.isle#L1-L26",
		);
	});

	it("accepts explicit startLine/endLine and branch/showLineNumbers fields", () => {
		const html = transformBeskidDirectives(
			"```code\nrepo: Cyber-Nomad-Collective/beskid\npath: src/main.rs\nstartLine: 10\nendLine: 20\nbranch: dev\nshowLineNumbers: false\n```",
		);
		expect(html).toContain('start-line="10"');
		expect(html).toContain('end-line="20"');
		expect(html).toContain('branch="dev"');
		expect(html).toContain('show-line-numbers="false"');
		expect(html).toContain("/blob/dev/src/main.rs#L10-L20");
	});

	it("defaults branch to main and showLineNumbers to true", () => {
		const html = transformBeskidDirectives(
			"```code\nrepo: Cyber-Nomad-Collective/beskid\npath: src/main.rs\n```",
		);
		expect(html).toContain('branch="main"');
		expect(html).toContain('show-line-numbers="true"');
	});

	it("auto-detects language from path when lang omitted", () => {
		const html = transformBeskidDirectives(
			"```code\nrepo: Cyber-Nomad-Collective/beskid\npath: src/main.rs\n```",
		);
		expect(html).toContain('lang="rust"');
		expect(html).toContain('start-line=""');
		expect(html).toContain('end-line=""');
	});

	it("keeps the legacy ref-based code directive when repo/path absent", () => {
		const html = transformBeskidDirectives(
			"```code\nref: beskid:expression\ntitle: Expression\n```",
		);
		expect(html).toContain('<beskid-doc-embed kind="code"');
		expect(html).toContain('ref="beskid:expression"');
		expect(html).not.toContain('kind="github-code"');
	});
});

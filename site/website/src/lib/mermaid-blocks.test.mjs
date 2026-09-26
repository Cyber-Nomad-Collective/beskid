import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

// Static guards for the Mermaid mistakes that have actually shipped. They need no
// browser and no Mermaid runtime; a full parse and render check lives outside CI.
const contentRoot = new URL('../content/', import.meta.url).pathname;
const DIAGRAM_TYPE =
	/^\s*(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|journey|mindmap|timeline|gitGraph|C4\w+|quadrantChart|xychart-beta|block-beta|architecture-beta|requirementDiagram|sankey-beta)\b/;
const ACCESSIBILITY = /^\s*(accTitle|accDescr)\b/;
// Words the flowchart grammar reserves; using one as a node id is a parse error.
const RESERVED_NODE_IDS = ['graph', 'end', 'subgraph', 'style', 'class', 'click', 'default'];

function* markdownFiles(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) yield* markdownFiles(path);
		else if (/\.mdx?$/.test(entry.name)) yield path;
	}
}

function* mermaidBlocks() {
	for (const file of markdownFiles(contentRoot)) {
		const lines = readFileSync(file, 'utf8').split('\n');
		for (let i = 0; i < lines.length; i += 1) {
			if (!lines[i].trim().startsWith('```mermaid')) continue;
			const body = [];
			let j = i + 1;
			while (j < lines.length && !lines[j].trim().startsWith('```')) body.push(lines[j++]);
			yield { where: `${file.replace(contentRoot, '')}:${i + 1}`, body };
			i = j;
		}
	}
}

test('every diagram declares its type before any accessibility line', () => {
	for (const { where, body } of mermaidBlocks()) {
		const type = body.findIndex((line) => DIAGRAM_TYPE.test(line));
		assert.notEqual(type, -1, `${where}: no recognised diagram type`);
		const firstAccessibility = body.findIndex((line) => ACCESSIBILITY.test(line));
		assert.ok(
			firstAccessibility === -1 || firstAccessibility > type,
			`${where}: accTitle/accDescr must come after the diagram type line`,
		);
	}
});

test('no flowchart node uses a reserved word as its id', () => {
	const idPattern = new RegExp(
		`(^|[\\s>|-])(${RESERVED_NODE_IDS.join('|')})(?=\\s*(\\[|\\(|\\{|-->|---|-\\.|==>|$))`,
		'i',
	);
	for (const { where, body } of mermaidBlocks()) {
		const type = body.findIndex((line) => DIAGRAM_TYPE.test(line));
		if (!/^\s*(flowchart|graph)\b/.test(body[type] ?? '')) continue;
		body.slice(type + 1).forEach((line, offset) => {
			if (/^\s*(subgraph|end|style|class|classDef|click|direction|accTitle|accDescr)\b/.test(line)) return;
			assert.ok(!idPattern.test(line), `${where}:${type + offset + 2}: reserved word used as a node id: ${line.trim()}`);
		});
	}
});

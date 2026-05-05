#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parseMermaidC4ToGraph } from './architecture-graph-c4.mjs';

function usage() {
	console.error(
		[
			'Usage:',
			'  node scripts/convert-architecture-graph-mermaid.mjs --in <input.mmd> --out <output.json> [--title "Graph title"] [--description "Graph description"]',
			'',
			'Converts Mermaid C4 syntax to ArchitectureGraphShell payload:',
			'  { title?, description?, groups?, nodes[], edges[] }',
		].join('\n'),
	);
}

function parseArgs(argv) {
	const out = {};
	for (let i = 0; i < argv.length; i += 1) {
		const token = argv[i];
		if (!token.startsWith('--')) continue;
		const key = token.slice(2);
		const value = argv[i + 1];
		if (!value || value.startsWith('--')) {
			out[key] = true;
			continue;
		}
		out[key] = value;
		i += 1;
	}
	return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.in || !args.out) {
	usage();
	process.exit(1);
}

const inputPath = path.resolve(process.cwd(), String(args.in));
const outputPath = path.resolve(process.cwd(), String(args.out));
const source = await fs.readFile(inputPath, 'utf8');
const { graph, diagnostics } = parseMermaidC4ToGraph(source, {
	title: typeof args.title === 'string' ? args.title : undefined,
	description: typeof args.description === 'string' ? args.description : undefined,
});

if (diagnostics.length) {
	console.error('C4 conversion diagnostics:');
	for (const issue of diagnostics) console.error(`- ${issue}`);
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(graph, null, 2)}\n`, 'utf8');
console.log(`Wrote architecture graph JSON to ${outputPath}`);

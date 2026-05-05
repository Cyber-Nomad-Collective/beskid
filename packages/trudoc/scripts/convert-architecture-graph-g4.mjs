#!/usr/bin/env node
console.error(
	[
		'Not implemented yet.',
		'Planned usage:',
		'  node scripts/convert-architecture-graph-g4.mjs --in <grammar.g4> --out <output.json>',
		'Converter target format: { title?, description?, groups?, nodes[], edges[] }.',
		'Run this as build-time tooling only; do not ship parser runtime to the browser.',
	].join('\n'),
);
process.exit(2);

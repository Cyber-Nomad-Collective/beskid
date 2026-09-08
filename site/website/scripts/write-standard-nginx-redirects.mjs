#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
	loadStandardRouteProjection,
	renderNginxStandardRedirects,
} from '../src/lib/standard-routes.mjs';

const outputArgument = process.argv[2];
if (!outputArgument) {
	console.error('Usage: node scripts/write-standard-nginx-redirects.mjs <output-file>');
	process.exitCode = 2;
} else {
	const outputPath = path.resolve(process.cwd(), outputArgument);
	await mkdir(path.dirname(outputPath), { recursive: true });
	await writeFile(outputPath, renderNginxStandardRedirects(loadStandardRouteProjection()), 'utf8');
	console.log(`Generated Nginx Standard redirects: ${outputPath}`);
}

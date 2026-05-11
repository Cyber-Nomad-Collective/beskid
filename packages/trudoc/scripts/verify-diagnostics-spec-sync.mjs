import fs from 'node:fs';
import path from 'node:path';
import { getWebsiteRoot } from './lib/website-root.mjs';

const root = getWebsiteRoot(import.meta.url);
const diagnosticsFile = path.join(
	root,
	'..',
	'..',
	'compiler',
	'crates',
	'beskid_analysis',
	'src',
	'analysis',
	'diagnostic_kinds.rs',
);
const specFile = path.join(
	root,
	'src',
	'content',
	'docs',
	'platform-spec',
	'compiler',
	'semantic-pipeline',
	'diagnostic-code-registry',
	'index.mdx',
);

function read(p) {
	return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

const diagnosticsSrc = read(diagnosticsFile);
const specSrc = read(specFile);

const codeMatches = [...diagnosticsSrc.matchAll(/=>\s*"([EW]\d+)"/g)];
const uniqueCodes = new Set(codeMatches.map((m) => m[1]));

if (uniqueCodes.size === 0) {
	console.error('verify:diagnostics-spec-sync: no diagnostic codes found in compiler source');
	process.exit(1);
}

if (!specSrc.includes('SemanticIssueKind::code()')) {
	console.error('verify:diagnostics-spec-sync: spec registry page is missing SemanticIssueKind::code() anchor');
	process.exit(1);
}

console.log(
	`verify:diagnostics-spec-sync: compiler defines ${uniqueCodes.size} diagnostic code(s); registry page anchor present.`,
);

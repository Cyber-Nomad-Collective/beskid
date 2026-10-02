import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Refresh provenance only; command inventory remains independently reviewed.
const root = path.resolve(process.argv[2] ?? fileURLToPath(new URL('../../../', import.meta.url)));
const compiler = path.join(root, 'compiler');
const git = (directory, ...args) => execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8' }).trim();
const entry = git(root, 'ls-tree', 'HEAD', '--', 'compiler');
const pinned = /^160000 commit ([0-9a-f]{40})\tcompiler$/.exec(entry)?.[1];
if (!pinned) throw new Error('root HEAD has no compiler gitlink');
const revision = git(compiler, 'rev-parse', 'HEAD');
if (revision !== pinned) throw new Error('compiler HEAD does not match root gitlink');
const output = path.join(root, 'site/website/src/data/pinned-cli-reference.json');
const original = readFileSync(output, 'utf8');
const snapshot = JSON.parse(original);
if (!snapshot.sourceBlobs || !Object.keys(snapshot.sourceBlobs).length) {
	throw new Error('CLI reference has no source blob inventory');
}
const sourceBlobs = Object.fromEntries(Object.keys(snapshot.sourceBlobs).map((source) => [
	source, git(compiler, 'rev-parse', `${revision}:${source}`),
]));
// Preserve the reviewed inventory's physical formatting as well as its values.
const refreshed = original
	.replace(/("sourceRevision"\s*:\s*)"[^"]*"/, (_, prefix) => prefix + JSON.stringify(revision))
	.replace(/("sourceBlobs"\s*:\s*\{)([^}]*)(\})/, (_, prefix, entries, suffix) =>
		prefix + entries.replace(/("([^"]+)"\s*:\s*)"[^"]*"/g, (match, keyPrefix, key) =>
			Object.hasOwn(sourceBlobs, key) ? keyPrefix + JSON.stringify(sourceBlobs[key]) : match) + suffix);
if (JSON.stringify(JSON.parse(refreshed)) !== JSON.stringify({ ...snapshot, sourceRevision: revision, sourceBlobs })) {
	throw new Error('CLI provenance refresh could not preserve the inventory');
}
writeFileSync(output, refreshed);
console.log(`CLI reference provenance refreshed: ${revision} (${Object.keys(sourceBlobs).length} source blobs)`);

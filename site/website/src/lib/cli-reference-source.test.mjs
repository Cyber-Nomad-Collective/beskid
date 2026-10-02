import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const generator = fileURLToPath(new URL('../../scripts/refresh-cli-reference-source.mjs', import.meta.url));
function fixture() {
	const root = mkdtempSync(path.join(tmpdir(), 'beskid-cli-reference-source-'));
	const compiler = path.join(root, 'compiler');
	mkdirSync(compiler);
	const git = (directory, ...args) => execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8' }).trim();
	for (const directory of [root, compiler]) git(directory, 'init', '-q');
	writeFileSync(path.join(compiler, 'command.rs'), 'pub enum Commands { Graph }\n');
	git(compiler, 'add', 'command.rs');
	git(compiler, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture');
	const revision = git(compiler, 'rev-parse', 'HEAD');
	const blob = git(compiler, 'rev-parse', 'HEAD:command.rs');
	git(root, 'update-index', '--add', '--cacheinfo', `160000,${revision},compiler`);
	git(root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'pin fixture');
	const output = path.join(root, 'site/website/src/data/pinned-cli-reference.json');
	mkdirSync(path.dirname(output), { recursive: true });
	const snapshot = { sourceRevision: 'old', sourceBlobs: { 'command.rs': 'old' }, commands: [{ name: 'graph', flags: ['--tui'] }] };
	writeFileSync(output, JSON.stringify(snapshot));
	return { root, compiler, git, output, snapshot, revision, blob };
}

test('refresh derives source identities from the pinned compiler and preserves inventory', () => {
	const f = fixture();
	const result = spawnSync(process.execPath, [generator, f.root], { encoding: 'utf8' });
	assert.equal(result.status, 0, result.stderr);
	assert.deepEqual(JSON.parse(readFileSync(f.output, 'utf8')), {
		...f.snapshot, sourceRevision: f.revision, sourceBlobs: { 'command.rs': f.blob },
	});
});

test('refresh refuses an unpinned compiler checkout without changing the fixture', () => {
	const f = fixture();
	writeFileSync(path.join(f.compiler, 'command.rs'), 'pub enum Commands { New }\n');
	f.git(f.compiler, 'add', 'command.rs');
	f.git(f.compiler, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'unpinned');
	const before = readFileSync(f.output, 'utf8');
	const result = spawnSync(process.execPath, [generator, f.root], { encoding: 'utf8' });
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /compiler HEAD does not match root gitlink/);
	assert.equal(readFileSync(f.output, 'utf8'), before);
});

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { AssertCleanDistrib, AssertNoPrerequisitesLockOverride } from '../package-source-authority.mjs';

function Git(directory, ...args) {
  const result = spawnSync('git', args, { cwd: directory, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}

test('distribution source must be completely clean, including ignored inputs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'beskid-package-source-'));
  try {
    Git(directory, 'init', '-q');
    Git(directory, 'config', 'user.name', 'Release Test');
    Git(directory, 'config', 'user.email', 'release-test@example.invalid');
    writeFileSync(join(directory, '.gitignore'), 'ignored.lock\n.DS_Store\n');
    writeFileSync(join(directory, 'tracked.lock'), 'pinned\n');
    Git(directory, 'add', '.');
    Git(directory, 'commit', '-qm', 'fixture');

    assert.doesNotThrow(() => AssertCleanDistrib(directory));
    writeFileSync(join(directory, 'tracked.lock'), 'changed\n');
    assert.throws(() => AssertCleanDistrib(directory), /distribution checkout is not clean/);
    Git(directory, 'restore', 'tracked.lock');

    writeFileSync(join(directory, 'untracked.lock'), 'new\n');
    assert.throws(() => AssertCleanDistrib(directory), /distribution checkout is not clean/);
    rmSync(join(directory, 'untracked.lock'));

    writeFileSync(join(directory, '.DS_Store'), 'Finder metadata\n');
    assert.doesNotThrow(() => AssertCleanDistrib(directory));

    writeFileSync(join(directory, 'ignored.lock'), 'shadow\n');
    assert.throws(() => AssertCleanDistrib(directory), /distribution checkout is not clean/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('Windows release packaging rejects even an empty prerequisite-lock override', () => {
  assert.doesNotThrow(() => AssertNoPrerequisitesLockOverride({}));
  assert.throws(
    () => AssertNoPrerequisitesLockOverride({ BESKID_PREREQUISITES_LOCK: '/tmp/alternative.json' }),
    /BESKID_PREREQUISITES_LOCK is forbidden/,
  );
  assert.throws(
    () => AssertNoPrerequisitesLockOverride({ BESKID_PREREQUISITES_LOCK: '' }),
    /BESKID_PREREQUISITES_LOCK is forbidden/,
  );
  assert.throws(
    () => AssertNoPrerequisitesLockOverride({ beskid_prerequisites_lock: '/tmp/alternative.json' }),
    /BESKID_PREREQUISITES_LOCK is forbidden/,
  );
});

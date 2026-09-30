// Release installers must be derived only from the pinned distribution commit.
import { spawnSync } from 'node:child_process';

export function AssertCleanDistrib(distrib) {
  const result = spawnSync('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored', '--'], {
    cwd: distrib,
    encoding: 'utf8',
  });
  if (result.error || result.status !== 0) {
    throw new Error(`cannot inspect distribution checkout: ${result.error?.message || result.stderr}`);
  }
  const nonMetadataChanges = result.stdout.split('\0').filter(Boolean).filter((entry) => {
    // Finder may add this ignored metadata to a macOS worker checkout. It is
    // never an input to the packaging scripts; all other ignored files fail.
    return !entry.startsWith('!! ') || !/(^|\/)\.DS_Store$/.test(entry.slice(3));
  });
  if (nonMetadataChanges.length !== 0) {
    throw new Error('distribution checkout is not clean (tracked, untracked, or ignored files)');
  }
}

export function AssertNoPrerequisitesLockOverride(environment) {
  if (Object.keys(environment).some((key) => key.toUpperCase() === 'BESKID_PREREQUISITES_LOCK')) {
    throw new Error('BESKID_PREREQUISITES_LOCK is forbidden for source-bound release packaging');
  }
}

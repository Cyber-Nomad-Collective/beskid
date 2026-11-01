## Why

Every prepared project copied the Corelib packages into `obj/beskid/deps`. One exercise wrote 6.4 MB, and the beskid-lings course held 173 MB of copies. The copies add time and disk and drift from the toolchain. A project should read the Corelib of its toolchain in place.

## What Changes

- A toolchain provides one sealed Corelib bundle. Projects read it in place and never copy it.
- A seal check fails with E3032 when the bundle does not match its fingerprint.
- `Project.lock` format 3 records a Corelib dependency by its bundle-relative path. Formats 1 and 2 are retired.
- `beskid check --all-members` checks all members of a workspace in one process.

## Capabilities

### Modified Capabilities
- `compiler--resolution-and-projects--workspace-and-lock-contracts`, `tooling--cli--command-surface`, `compiler--semantic-pipeline--diagnostic-code-registry`.

## Impact

Project preparation, lock file, language server scan, Corelib lock files. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. A lock file of format 1 or 2 is not replayed. An old lock with only Corelib dependencies regenerates automatically; another retired lock fails with E3024 until an explicit migration.

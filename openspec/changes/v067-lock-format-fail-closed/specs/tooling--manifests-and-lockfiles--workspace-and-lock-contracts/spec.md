## REMOVED Requirements

### Requirement: Explicit lock migration and strict read-only policy
**Reason**: No lock file of an older format exists, because no users exist. A lock that is not in the current format fails closed with **E3025** (`compiler--resolution-and-projects--workspace-and-lock-contracts`, "Lock file format 3"); no command migrates it.
**Migration**: None. Delete the old lock file and write a new one.

## ADDED Requirements

### Requirement: Strict read-only lock policy
Tooling SHALL NOT migrate a lock file from an older format. A present lock file that is not in the current format SHALL fail with **E3025** in every command and in the language server, and no command SHALL change its bytes. A malformed lock file in the current format SHALL fail. A valid but stale lock SHALL NOT be silently repaired by a consumer other than `beskid dev project lock` and an explicitly scoped `beskid update <package>` or `beskid update --all`. `--locked` and `--frozen` SHALL never write or rewrite a lock; they SHALL reject a missing, unsupported or stale lock before they write any preparation output. When no lock exists, a normal unlocked build MAY create a lock from the current graph.

Required declared registry dependencies SHALL fail ordinary and strict application preparation when unavailable. An existing lock without a pin for a declared registry package SHALL remain unchanged until an explicit lock mutation resolves the missing pin. A declared registry package without a pin SHALL fail strict preparation before materialization.

#### Scenario: Older lock is not migrated
- **GIVEN** a present lock file whose first line is `# Project.lock v1`
- **WHEN** `beskid dev project lock`, `beskid update --all`, `build`, `run`, `test` or the language server reads the project
- **THEN** each fails with **E3025** and the lock file bytes do not change

#### Scenario: Strict command rejects a missing or invalid lock
- **GIVEN** `--locked` or `--frozen` and a missing, unsupported or stale lock
- **WHEN** the command starts project preparation
- **THEN** it fails before creating preparation output or changing lock bytes

#### Scenario: Strict command accepts a valid lock without writing it
- **GIVEN** `--locked` or `--frozen` and a valid lock matching the current graph
- **WHEN** the command resolves and prepares the project
- **THEN** it may use the locked graph but leaves the lock bytes and file metadata unchanged

#### Scenario: Strict preparation requires a registry pin
- **GIVEN** a declared registry package has no pin in an existing lock
- **WHEN** `--locked` or `--frozen` starts preparation
- **THEN** it fails before materializing the package or changing the lock

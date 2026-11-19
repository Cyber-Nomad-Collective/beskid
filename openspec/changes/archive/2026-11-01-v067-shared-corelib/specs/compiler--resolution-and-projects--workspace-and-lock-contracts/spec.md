## ADDED Requirements

### Requirement: Shared Corelib
A toolchain SHALL provide exactly one Corelib, a sealed bundle identified by its fingerprint. A project SHALL read Corelib packages from that bundle in place. Preparation SHALL NOT copy a Corelib package into the project and SHALL NOT write any file below the bundle root. Each installed toolchain SHALL have its own Corelib bundle, and a project SHALL use the Corelib of the toolchain that prepares it. A Corelib root without a fingerprint is a developer checkout, and its packages SHALL be treated as path dependencies. A diagnostic in a Corelib unit SHALL name the file in the shared bundle.

#### Scenario: No copy
- **GIVEN** a project that depends on Corelib packages
- **WHEN** the project is prepared
- **THEN** no Corelib file is written below `obj/beskid/` and no file is written below the bundle root

### Requirement: Corelib seal
Before any Corelib unit is used, the toolchain SHALL verify that the content of the bundle matches its fingerprint. When it does not match, preparation SHALL fail with **E3032** and SHALL NOT repair the bundle.

#### Scenario: Modified bundle
- **GIVEN** a Corelib bundle with one modified file
- **WHEN** a project is prepared
- **THEN** preparation fails with **E3032**

### Requirement: Copies in obj/beskid
Preparation SHALL copy the host sources and each path dependency into `obj/beskid/`, and SHALL extract each registry package into `obj/beskid/deps/src/`. Preparation SHALL remove every other entry of `obj/beskid/deps/src/`. A diagnostic in a copied unit SHALL name the authored file when the authored file still has the same text.

#### Scenario: Stale dependency entry
- **GIVEN** `obj/beskid/deps/src/` holds an entry that no dependency needs
- **WHEN** the project is prepared
- **THEN** the entry is removed

### Requirement: Lock file format 3
`Project.lock` format 3 SHALL record a Corelib dependency with `source=corelib`, its project path relative to the Corelib bundle root, its manifest and its source root. It SHALL NOT record a materialized root, a toolchain path, a version or a fingerprint for it. A path or registry dependency SHALL record its materialized root below `obj/beskid/deps/src/`. A lock file in format 1 or 2 SHALL NOT be replayed. Ordinary preparation SHALL regenerate a format 2 lock file whose every dependency is a Corelib dependency. For any other retired lock file, preparation SHALL fail with **E3024** until an explicit migration (`beskid dev project lock` or `beskid update --all`) rewrites it. `--locked` and `--frozen` SHALL NOT rewrite a retired lock file.

#### Scenario: Corelib-only old lock
- **GIVEN** a format 2 lock file whose dependencies are all Corelib dependencies
- **WHEN** the project is prepared
- **THEN** the lock file is regenerated in format 3

#### Scenario: Old lock with other dependencies
- **GIVEN** a format 2 lock file with a registry dependency
- **WHEN** the project is prepared without a migration
- **THEN** preparation fails with **E3024**

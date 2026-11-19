## MODIFIED Requirements

### Requirement: Lock file format 3
`Project.lock` format 3 SHALL record a Corelib dependency with `source=corelib`, its project path relative to the Corelib bundle root, its manifest and its source root. It SHALL NOT record a materialized root, a toolchain path, a version or a fingerprint for it. A path or registry dependency SHALL record its materialized root below `obj/beskid/deps/src/`. The first line of a format 3 lock file SHALL be `# Project.lock v3`. When the first line of a present lock file is different (format 1, format 2 or an unknown header), every consumer SHALL fail with **E3025** before it writes preparation output. No command SHALL read, regenerate or rewrite such a file: ordinary preparation, `--locked`, `--frozen`, `beskid dev project lock`, `beskid update` and the language server SHALL leave its bytes unchanged. The user deletes the file, and the next preparation that may write a lock writes format 3.

#### Scenario: Older lock format
- **GIVEN** a lock file whose first line is `# Project.lock v2`, and whose dependencies are all Corelib dependencies
- **WHEN** the project is prepared, with or without `beskid dev project lock`
- **THEN** preparation fails with **E3025** and the lock file bytes do not change

#### Scenario: Unknown header
- **GIVEN** a lock file whose first line is `# Project.lock v9`
- **WHEN** a build, a check or the language server reads the project
- **THEN** each fails with **E3025** and no file is written

#### Scenario: Deleted lock
- **GIVEN** the user deleted a lock file that failed with **E3025**
- **WHEN** `beskid dev project lock` runs
- **THEN** it writes a format 3 lock file from the current manifests

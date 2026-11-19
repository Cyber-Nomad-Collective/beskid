## ADDED Requirements

### Requirement: api.json paths are artifact-relative
Every path in a packed `api.json` SHALL be relative to the artifact root of the package that declares the item. The root `source` field and each item `location.file` SHALL use forward slashes and SHALL match the path of the file inside the published `.bpk`. A path SHALL NOT be a host absolute path and SHALL NOT start at `obj/beskid`. When an item has `declaringPackage`, its `location.file` SHALL be relative to the artifact root of that package, not to the package that publishes the `api.json`.

#### Scenario: Path of an item in the publishing package
- **GIVEN** a package whose source file is `src/Main.bd` inside its `.bpk`
- **WHEN** `beskid doc --project` writes `api.json`
- **THEN** `location.file` of an item declared in that file is `src/Main.bd`

#### Scenario: Path of an item from a dependency
- **GIVEN** an item with `declaringPackage` set to a dependency package
- **WHEN** `beskid doc --project` writes `api.json`
- **THEN** `location.file` is relative to the artifact root of that dependency, and no path is absolute or starts at `obj/beskid`

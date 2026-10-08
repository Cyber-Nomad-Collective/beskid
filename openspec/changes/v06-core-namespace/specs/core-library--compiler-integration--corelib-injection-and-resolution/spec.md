## ADDED Requirements

### Requirement: Reserved Core dependency label
The resolver SHALL attach the implicit Corelib dependency under the label `Core`. A manifest MAY declare the `Core` label explicitly. The `Core` label SHALL be reserved for the Corelib aggregate project `corelib`: a `Core` dependency SHALL use `source = path`; without `path` it SHALL select the installed Corelib aggregate; with `path` the target project SHALL be the Corelib aggregate, or graph resolution SHALL fail. An explicit `Core` dependency SHALL replace the implicit attachment. Dependency labels SHALL NOT become module path segments, so the `Core` label and a module path that starts with `Core` SHALL NOT collide. A path dependency labeled `Std` without `path` SHALL fail manifest validation, and the error SHALL name the `Core` label.

#### Scenario: Implicit Corelib uses the Core label
- **GIVEN** an App manifest without a `Core` dependency and an installed Corelib
- **WHEN** the compiler builds the compile plan
- **THEN** the plan contains a dependency labeled `Core` and no dependency labeled `Std`

#### Scenario: The Core label cannot name another package
- **GIVEN** an App manifest with `dependency "Core" { source = path path = "../Shared" }` and `../Shared` declares project `Shared`
- **WHEN** the compiler builds the project graph
- **THEN** resolution fails and states that the `Core` label is reserved for the Corelib aggregate

#### Scenario: The Core label requires a path source
- **GIVEN** an App manifest with a registry dependency labeled `Core`
- **WHEN** the manifest is validated
- **THEN** validation fails and states that the `Core` label requires `source = path`

#### Scenario: A path-less Std dependency names the Core label
- **GIVEN** an App manifest with `dependency "Std" { source = path }`
- **WHEN** the manifest is validated
- **THEN** validation fails and the error states that the installed Corelib dependency is named `Core`

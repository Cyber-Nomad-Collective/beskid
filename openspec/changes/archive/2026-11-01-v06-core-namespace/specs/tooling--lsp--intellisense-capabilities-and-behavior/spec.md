## MODIFIED Requirements

### Requirement: Completion and project-aware IntelliSense
Completion SHALL be provided for `.bd`, `.bproj`, and `.bws` documents. `.bd` candidates SHALL come from `beskid_queries::completion_candidates`; `.bproj` and `.bws` completion SHALL include manifest keywords and enum-like value suggestions. Project-backed `.bd` IntelliSense SHALL assemble the current in-memory entry buffer through the shared `ProgramAssembly` prepare spine and expose generation-bound syntax facts for the resolved project. After a trailing `.` following a registered `use` alias, completion SHALL list public members from the aliased module path. While the member identifier is only partially typed, matching members SHALL remain available from a bounded owned dependency surface even when semantic lowering reports the expression as incomplete. A retained surface SHALL match both the current import's exact logical module path and its local binding; changing an import target while retaining its alias SHALL NOT expose members from the former target. The fallback surface SHALL be used only for imported-member completion; document symbols SHALL come from the recoverable current buffer, and diagnostics, rename, formatting, semantic tokens, navigation, and compilation SHALL NOT treat the fallback surface as current semantic authority. On a `use` line, completion SHALL offer next path segments from assembly-known logical module paths.

#### Scenario: Member completion after use alias
- **GIVEN** a `.bd` buffer with `use Core.Output` and a `CompilationContext` that resolves the project
- **WHEN** the user requests completion after `Output.`
- **THEN** candidates include public members from the aliased module path in the assembly `ModuleGraph`

#### Scenario: Partial imported member keeps current-generation suggestions
- **GIVEN** a `.bd` buffer where `Output.WriteLine` was edited to `Output.Wri`
- **WHEN** the client publishes the changed document and requests completion after `Wri`
- **THEN** candidates include `WriteLine`, document symbols reflect the changed buffer, and no stale dependency fallback is published as diagnostics or other semantic authority

#### Scenario: Editing one open buffer preserves sibling completion
- **GIVEN** two open `.bd` buffers import the same module and one already contains a partial member expression
- **WHEN** the other buffer advances the shared workspace Salsa generation
- **THEN** completion in the partial sibling still lists matching imported members from its owned dependency surface

#### Scenario: Use-path completion offers package-native segments
- **GIVEN** a `.bd` buffer in a project with the `Core` dependency
- **WHEN** the user requests completion after `use Core.`
- **THEN** candidates include the next segment `Output` and no candidate repeats the typed prefix or starts with `Std`

#### Scenario: Retargeted alias rejects former members
- **GIVEN** a `.bd` buffer previously imported `Old.Tools as Api`
- **WHEN** the current buffer changes the declaration to `New.Tools as Api` while semantic preparation is incomplete
- **THEN** completion after `Api.` does not list members retained from `Old.Tools`

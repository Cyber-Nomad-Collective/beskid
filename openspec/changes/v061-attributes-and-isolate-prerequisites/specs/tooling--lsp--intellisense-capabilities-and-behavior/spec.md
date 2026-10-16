## MODIFIED Requirements

### Requirement: Hover, navigation, and references
Hover SHALL return Markdown for resolved `.bd` symbols and `.bproj`/`.bws` manifest tokens; hover ranges SHALL map through generation-bound syntax locations and the declaring unit source. Go to definition SHALL resolve to the declaration span for resolved `.bd` symbols and SHALL navigate manifest `path = "..."` dependencies to the target `.bproj`. Go to declaration SHALL follow the same target resolution contract. Find references SHALL support resolved `.bd` symbols and manifest tokens; with `ProgramAssembly`, workspace references SHALL include non-entry units and SHALL honor `includeDeclaration`.

Hover on an attribute name at any declaration site SHALL resolve to the attribute declaration and show its target list; go to definition on it SHALL navigate to the declaration. Hover on a nominal type name SHALL append one line `transfer class: Shared | Moved | Copied | Never (reason)` from the transfer class query.

#### Scenario: Cross-unit go-to-definition
- **GIVEN** a resolved symbol whose `ItemInfo.source_path` points at a dependency unit
- **WHEN** the client requests go-to-definition at that symbol
- **THEN** the LSP returns a `file://` location for the dependency unit declaration span

#### Scenario: Hover on a parameter attribute
- **GIVEN** `pub attribute Trace(Parameter) { }` and `i64 Add([Trace] i64 left, i64 right)`
- **WHEN** the client hovers `Trace` inside the parameter list
- **THEN** the hover shows the declaration with the target `Parameter`

#### Scenario: Hover shows the transfer class
- **GIVEN** `[Immutable] pub type Job { string id, i64 size }`
- **WHEN** the client hovers `Job` at a use site
- **THEN** the hover contains `transfer class: Shared`

### Requirement: Rename, signature help, symbols, and tokens
Rename and prepare rename SHALL be supported for resolved symbols and manifest tokens with identifier validation (`[A-Za-z_][A-Za-z0-9_]*`); invalid identifiers SHALL return no rename edit. Rename remains single-document per request. Signature help SHALL be supported for `.bd` call sites with one active signature derived from the callable hover payload. Document symbols SHALL be supported for `.bd`, `.bproj`, and `.bws` with stable symbol-kind mapping. Workspace symbols SHALL be supported for indexed `.bd` documents from open buffers plus closed-file workspace snapshots. Semantic tokens SHALL be supported in full-document mode with declaration tagging.

Semantic tokens SHALL tag attribute names at every declaration site (parameters, receivers, lambdas, lambda parameters, type parameters, `let` statements, enum variants, contract members, `impl` blocks, constants, attribute declarations) with the same token type as attributes on items. Completion inside `[` at any declaration site SHALL offer the attributes whose target list admits that site, and completion inside an `AttributeTargetList` SHALL offer the target catalogue.

#### Scenario: Invalid rename identifier rejected
- **GIVEN** a resolved symbol at the cursor
- **WHEN** prepare rename or rename is requested with a new name that fails `[A-Za-z_][A-Za-z0-9_]*`
- **THEN** the server returns no rename edit

#### Scenario: Attribute completion filtered by site
- **GIVEN** `pub attribute Trace(Parameter) { }` and `pub attribute Pure(LambdaExpression) { }`
- **WHEN** completion is requested inside `[` before a lambda
- **THEN** `Pure` is offered and `Trace` is not

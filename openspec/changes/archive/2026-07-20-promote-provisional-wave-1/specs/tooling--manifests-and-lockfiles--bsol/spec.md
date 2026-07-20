## ADDED Requirements

### Requirement: Shared Bsol surface for configuration documents
Bsol (Beskid Structured Object Language) SHALL be the shared meta-language for Beskid configuration documents used by `*.bproj` project manifests, `*.bws` / `workspace.proj` workspace manifests, and `runtime_manifest.bsol`. Surface syntax and the generic AST SHALL be owned by the `beskid_bsol` crate; schema profiles SHALL ship as embedded `*.v1.bsol` / `*.v2.bsol` profiles; manifest semantics MUST remain outside Bsol grammar and in profile-specific lowering.

#### Scenario: Parse project and workspace manifests as Bsol
- **GIVEN** a `*.bproj` or `*.bws` document written in Bsol surface syntax
- **WHEN** `parse_bsol_document` runs
- **THEN** the document parses into a generic `BsolDocument` before any profile-specific lowering

### Requirement: Lexical rules and document shape
Bsol lexing SHALL treat whitespace as insignificant except as a separator; support `#` and `//` line comments; use ASCII identifiers starting with a letter or `_`; treat quoted strings as literal with no escape sequences; and accept bracket lists and `ident = value` assignments. A document SHALL be a sequence of blocks of the form `block_kind optional "label" { ... }`, with optional `@schemaless` capturing the inner body verbatim when the profile allows it. Manifest-specific block kinds MUST NOT be encoded in the grammar and SHALL be defined by schema profiles.

#### Scenario: Schemaless body capture
- **GIVEN** a block annotated `@schemaless` under a profile rule with `schemaless = true`
- **WHEN** the document is parsed
- **THEN** the AST stores the body in `BsolBlock.schemaless_body` instead of parsed `items`

#### Scenario: Unknown block kinds deferred to profiles
- **GIVEN** a Bsol document containing a profile-defined block kind such as `target` or `dependency`
- **WHEN** surface parsing completes
- **THEN** the grammar accepts the block as a generic `BsolBlock` and does not hard-code that kind in `bsol.pest`

### Requirement: Normative reference AST
A successful Bsol parse MUST build the reference AST types `BsolDocument`, `BsolBlock`, `BsolItem`, `BsolAssignment`, `BsolValue`, `BsolQuotedString`, `BsolBracketList`, `BsolListItem`, and `BsolSpan`, with field names stable for tooling, LSP, and test fixtures.

#### Scenario: Stable AST field surface
- **GIVEN** a successfully parsed Bsol document
- **WHEN** tooling inspects the generic AST
- **THEN** root blocks are available as `BsolDocument.blocks` and each block exposes `kind`, optional `label`, optional `schemaless_body`, and `items`

### Requirement: Schema validation and lowering boundary
`beskid_bsol` SHALL expose `parse_bsol_document`, `load_profile`, and `validate` such that validation rejects unknown blocks, missing labels, and invalid field types against the loaded profile. Bsol parsing MUST stop at `BsolDocument`; missing required semantic fields, misplaced nested blocks, meta-contract diagnostics E1801–E1899, and graph/lockfile rules MUST be treated as downstream manifest-contract failures, not Bsol syntax errors.

#### Scenario: Validate then lower
- **GIVEN** a parsed `BsolDocument` and an embedded profile such as `project.v1` or `runtime.v1`
- **WHEN** `validate` succeeds
- **THEN** the result is a `ValidatedDocument` suitable for downstream lowering, and semantic field obligations remain outside Bsol syntax errors

#### Scenario: Semantic failure is not a syntax error
- **GIVEN** a document that parses and passes schema shape checks but omits a required semantic field after the schema pass
- **WHEN** lowering or manifest-contract validation runs
- **THEN** the failure is reported as a manifest contract issue (for example in the E1801–E1899 band) rather than a Bsol surface syntax error

## REMOVED Requirements

### Requirement: Bsol (Beskid Structured Object Language) conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.

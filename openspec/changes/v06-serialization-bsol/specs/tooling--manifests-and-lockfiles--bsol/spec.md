## MODIFIED Requirements

### Requirement: Shared Bsol surface for configuration documents
BSOL SHALL be the shared meta-language for project/workspace/runtime/configuration documents. One OpenSpec syntax/profile contract and shared conformance corpus SHALL govern standalone `beskid_bsol` Rust tooling, tree-sitter/editor tooling and native Beskid corelib BSOL. Rust tooling MAY remain bootstrap host tooling; the native corelib API SHALL execute Beskid lexer/parser/writer/schema/typed mapping without forwarding to a Rust BSOL parser. Manifest-specific semantic lowering SHALL remain outside syntax grammar.

#### Scenario: Parse project and workspace manifests as Bsol
- **GIVEN** an installed Beskid program reads a project/workspace/runtime document
- **WHEN** native Parse/Validate executes
- **THEN** Beskid implementations produce the shared syntax/profile results without a Rust parser import

#### Scenario: Shared tooling surface (BSOL-06-01)
- **GIVEN** one corpus document and its source digest
- **WHEN** Rust/native/tooling process it
- **THEN** all agree on normalized syntax structure and syntax diagnostics before manifest-specific lowering

### Requirement: Lexical rules and document shape
BSOL SHALL treat whitespace as separators and support # and // line comments, ASCII identifiers `[A-Za-z_][A-Za-z0-9_]*`, ordered blocks/assignments and optional quoted block labels. Canonical attribute syntax SHALL be `@Name` with optional nonempty `(key = value, ...)` arguments before blocks or assignments; bracket attribute spelling SHALL reject. `kind optional-label @schemaless { body }` SHALL capture raw inner body when profile permits it. Values SHALL include identifiers, quoted strings, booleans, references, lists, inline maps and numbers; lists SHALL also allow inline blocks and the default marker. Empty maps `{}` SHALL be valid, map/list commas SHALL separate entries with one optional trailing comma. References SHALL use `@label` or `@kind/label` with identifier segments. Quoted strings SHALL decode `\"`, `\\`, `\n`, `\r`, `\t`, `\b`, `\f` and `\uXXXX`; surrogate pairs SHALL combine into one scalar and lone surrogates/unknown/truncated escapes/raw control characters SHALL reject. Numeric grammar SHALL be `-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?`: integer forms retain exact decimal digits, decimal/exponent forms denote finite floats, and NaN/Infinity SHALL reject. Numeric values SHALL be permitted wherever values are permitted, including lists. These corrections SHALL apply equally to standalone and native parsing; legacy unescaped backslash producers SHALL migrate by escaping backslashes.

#### Scenario: Corrected lexical matrix (BSOL-06-09)
- **GIVEN** @ attributes, empty maps, signed/finite exponent numbers in lists and escaped non-BMP strings
- **WHEN** Rust and native parsers run
- **THEN** both accept with equal typed values/spans and canonical writer escapes necessary characters

#### Scenario: Invalid lexical input (BSOL-06-09)
- **GIVEN** bracket attributes, invalid surrogate/escape, leading-zero numbers or nonfinite literals
- **WHEN** parsing runs
- **THEN** both reject with equivalent diagnostic category and byte span

#### Scenario: Schemaless body capture
- **GIVEN** a profile-allowed @schemaless block contains raw content
- **WHEN** parsing and validation run
- **THEN** the exact inner body is stored as schemaless_body rather than ordinary parsed items

#### Scenario: Unknown block kinds deferred to profiles
- **GIVEN** a syntactically valid block kind without a matching profile rule
- **WHEN** parsing and profile validation run
- **THEN** syntax parsing retains the block and the profile validator owns rejection unless extras permit it

### Requirement: Normative reference AST
The reference syntax model SHALL retain stable existing BsolDocument.blocks and BsolBlock.kind/label/schemaless_body/items fields and SHALL represent ordered items, assignment keys, identifiers separately from quoted strings, exact numeric literals, booleans, lists/maps/inline blocks, attributes, references and source byte spans. Native Document/Block/Assignment/Value equivalents SHALL preserve the same distinctions and normalized corpus structure; they SHALL NOT collapse syntax into an unordered dynamic dictionary. Canonical Write SHALL emit two-space indentation, LF line endings and one final LF, preserving block/item declaration order; semantic parse/write roundtrip SHALL preserve syntax values. Comment/format-preserving edits SHALL be a separate contract and SHALL NOT be inferred from canonical Write.

#### Scenario: Syntax distinction (BSOL-06-02)
- **GIVEN** ident/string values, two labeled blocks and assignment attributes/references
- **WHEN** Parse then Write then Parse runs
- **THEN** ordered kinds/labels/attributes/reference paths/value distinctions agree even when whitespace/comments differ

#### Scenario: Stable AST field surface
- **GIVEN** existing Rust/editor clients inspect parsed blocks
- **WHEN** the corrected shared syntax model is loaded
- **THEN** existing field names remain available and additive value/attribute fields carry explicit spans

### Requirement: Schema validation and lowering boundary
Rust tooling and native BSOL SHALL expose parse, profile load and validation operations producing ValidatedDocument. Validation SHALL reject schema shape/type/cardinality/constraint/reference failures with structured code, byte span and field/profile/import path; application manifest semantics and graph/lockfile rules SHALL remain downstream contract diagnostics rather than syntax errors. Native APIs SHALL include Parse(text,limits), Write(document,limits), LoadProfile(document,resolver,limits), Validate(document,profile), ResolveReferences(validated), PlanMigration(document,target), ApplyMigration(document,plan), and typed Read<T>/Write<T>; each fallible operation SHALL return a checked result.

#### Scenario: Validate then lower
- **GIVEN** a parsed project.v1/runtime.v2 document
- **WHEN** profile validation succeeds
- **THEN** a ValidatedDocument is returned for downstream semantic lowering

#### Scenario: Semantic failure is not a syntax error
- **GIVEN** a syntactically valid document violates profile type and a separate document violates downstream manifest semantics
- **WHEN** validation/lowering runs
- **THEN** each failure retains its owning stage and syntax parsing does not claim semantic success

## ADDED Requirements

### Requirement: Complete v1 and v2 profile validation
Native and standalone BSOL SHALL load and validate schema.v1/schema.v2 profiles and the actual embedded project.v1/v2, workspace.v1, runtime.v1/v2, configuration.v1/v2, board.v1/v2/v3, tools.config.v1 and shell.pages.v1 profiles. Profile documents SHALL self-validate against their meta-schema. Rules SHALL implement top/nested scope; keyword/keywords/free_ident matchers and except lists; label required/forbidden/optional; one/many/zero_or_one cardinality; extras/nested_extras/schemaless flags; required fields; quoted/ident/u32/list/loose/enum_or_quoted types and v2 parameterized list/map/ref/union types; variants and payload require lists; defaults, min/max, pattern and required_if constraints. Quoted values MAY satisfy ident/loose only where the declared field type permits; other best-effort coercion SHALL reject. Defaults SHALL be type-checked and apply only to missing fields; duplicate assignment keys SHALL reject with both spans. Pattern validation SHALL use the bounded `Core.Text.Regex` language defined by the shipped `regex.pest`, including its 1 MiB subject limit, and reject unsupported/invalid patterns rather than approximate them. Rust tooling SHALL validate against the same pattern grammar and matching semantics as native corelib; substring or digit-heuristic approximations SHALL NOT authorize validation. Exhausted work budgets SHALL produce checked constraint diagnostics rather than unbounded matching. Pattern matching SHALL begin at the subject start and require a nonempty accepted match; a separate search operation SHALL NOT implicitly authorize a constraint. Optional and zero-or-more pieces SHALL permit zero occurrences, every escape admitted by the shipped grammar SHALL preserve its literal or declared character-class meaning, and greedy repetition SHALL consider acceptance of the remaining sequence within the work budget. The default matching budget SHALL be 16777216 primitive steps, counting each atom/transition/branch before execution; explicit caller limits SHALL be checked and may be lowered or raised within address bounds.

Declared `allowed_attrs` SHALL authorize only the named attributes at its block or field location. An absent or empty allowlist SHALL authorize no attributes. Validators SHALL check assignment attributes against the matched field rule and block attributes against the matched block rule, retaining the offending attribute span on rejection. Attribute permission at one location SHALL NOT grant permission at another.

#### Scenario: Attribute permissions are local and closed (BSOL-06-04)
- **GIVEN** block and field rules have distinct named allowlists and another rule has no allowlist
- **WHEN** allowed, foreign and undeclared attributes occur on blocks or assignments
- **THEN** only the exact local permissions succeed; absent or empty permissions reject attributes with their source span

#### Scenario: Profile self-validation (BSOL-06-03)
- **GIVEN** all shipped profile files including schema.v1/v2
- **WHEN** the native and Rust loaders/validators execute the corpus
- **THEN** every valid profile self-validates and malformed profile constructs fail equally

#### Scenario: Constraints variants (BSOL-06-04)
- **GIVEN** required_if/min/max/pattern/default/variant cases at boundary and violating inputs
- **WHEN** validation executes
- **THEN** declared constraints and payload requirements are enforced with stable field/profile spans; unsupported coercion rejects

#### Scenario: Pattern language parity and bounded work (BSOL-06-04)
- **GIVEN** anchored, alternation, character-class and quantified patterns accepted by the shipped grammar, invalid patterns and subjects exceeding the declared limit
- **WHEN** Rust and native validators apply a pattern constraint
- **THEN** both agree on matching and rejected inputs; invalid grammar, oversized subjects or exhausted work budgets return checked diagnostics

### Requirement: Common bounded pattern accounting
Native and standalone matching SHALL debit owned UTF-8 pattern bytes once before parsing, one step before each emitted NFA state including the initial accepting state, each closure-state visit, each split branch, each matched atom and each inspected character-class range. Grammar-node construction and compiler traversal SHALL NOT debit duplicate steps already bounded by the owned pattern and emitted states. Matching SHALL visit split alternatives in declared order with a LIFO closure stack, stop inspecting a class after its first accepting range, and retain one generation-mark array for state visits across subject scalars. State bookkeeping SHALL remain bounded by the compiled state count without clearing every state per scalar or copying the closure stack on each pop. All inline/default field constraints SHALL consume the same validation budget.

#### Scenario: Shared work and bounded bookkeeping (BSOL-06-04)
- **GIVEN** the literal pattern abcdefgh matches once under a 50-step budget, and two supplied inline or missing-only default fields use that pattern
- **WHEN** native and standalone validators execute
- **THEN** one match succeeds, the pair exhausts the shared budget, and a larger budget succeeds; state marks are allocated once and each class-range inspection is charged before execution

### Requirement: Deterministic profile composition
Profiles SHALL implement import_schema, extends, mixes and extend overlays as declared schema constructs. Composition SHALL resolve bases/traits before overlays, retain declared ordering, detect cycles and reject incompatible duplicate/conflicting field/rule/variant definitions. Identical canonical diamond imports SHALL be deduplicated. An overlay MAY add a new rule/field or refine a constraint; incompatible type/cardinality/label changes SHALL require an explicit versioned migration rather than silent replacement. Schema/profile identity and version SHALL remain explicit through composition.

#### Scenario: Composition diamond and cycle (BSOL-06-04)
- **GIVEN** extends/mixes/extend chains include an identical diamond and a cycle
- **WHEN** profiles compose
- **THEN** the diamond has one canonical base and deterministic result; the cycle fails with its import/profile path

#### Scenario: Conflict rejection (BSOL-06-04)
- **GIVEN** two bases or an overlay assign incompatible types to one field
- **WHEN** composition runs
- **THEN** a conflict diagnostic identifies both definitions and no partially composed profile is exposed

#### Scenario: Value-set refinement and nested definition identity (BSOL-06-04)
- **GIVEN** an enum field declares red/blue and an overlay retains red, or two bases declare a same-name nested rule
- **WHEN** composition resolves the overlay and nested definitions
- **THEN** retaining red narrows the enum constraint, adding green rejects with both definition spans, identical ordered nested definitions coalesce and incompatible nested field types reject with both definition spans

#### Scenario: Aggregate composition search work (BSOL-06-04)
- **GIVEN** a wide profile causes repeated field, rule, variant, attribute or condition searches
- **WHEN** composition processes the profile
- **THEN** every searched entry consumes the shared checked aggregate budget before execution, exhaustion returns a source-spanned diagnostic and no partial profile is published

### Requirement: Controlled locked schema imports

The CLI validation adapter SHALL accept paired explicit `--schema-import-root` and `--schema-import-lock` options. The lock SHALL be a bounded JSON inventory of exact requests, canonical identities, root-relative materialized paths and complete SHA-256 digests. Merely setting a cache directory SHALL NOT grant schema import authority. Bootstrap tooling MAY parse verified owned bytes through its existing parser; native consumers SHALL pass those bytes to native corelib parsing.

#### Scenario: Explicit offline host configuration (BSOL-06-05)
- **GIVEN** an import root and exact request/content lock inventory
- **WHEN** validation resolves a materialized import
- **THEN** reads remain within the opened root capability, content is verified before parsing, and an absent lock, changed content or escaped symlink rejects without fetching

Schema resolution SHALL use an explicit host adapter accepting File(root-relative path), Git(canonical URL, immutable revision, relative path), Registry(package identity, exact version, relative path), and @pckg shorthand plus optional alias. The adapter SHALL return owned UTF-8 source, canonical identity and content digest from materialized locked artifacts; no parser/library operation SHALL perform implicit network access. Imports SHALL enforce configured controlled roots after symlink resolution, reject path traversal/absolute paths/root escape, mutable or missing git revisions, absent registry locks/cache, duplicate aliases, ambiguous identities and cycles. Imported names SHALL resolve through declared aliases; canonical identity/digest and schema version SHALL key caches.

#### Scenario: Offline locked imports (BSOL-06-05)
- **GIVEN** file/git/registry/shorthand imports and aliases have verified materialized locks
- **WHEN** LoadProfile resolves them without network
- **THEN** canonical identity/digest and alias bindings are recorded and repeated diamond imports deduplicate

#### Scenario: Import security failures (BSOL-06-05)
- **GIVEN** an import traverses a root, escapes via symlink, uses mutable revision or has missing lock/cache
- **WHEN** resolution runs
- **THEN** a checked source-spanned import error returns without network fetch or partial profile

#### Scenario: Locked bytes declare a different profile (BSOL-06-05)
- **GIVEN** verified materialized source whose declared profile name differs from the requested import name
- **WHEN** the native or bootstrap resolver prepares that profile
- **THEN** the identity mismatch rejects before composition; an alias does not change the requested declaration identity

#### Scenario: Resolved closure survives validation and migration (BSOL-06-05)
- **GIVEN** a loaded profile contains alias-qualified imported rules and a selected migration definition
- **WHEN** document validation recomposes the profile or migration constructs a fresh stage
- **THEN** schema-owned private resolved-source state is preserved, imported definitions are reconstructed from the verified owned bytes, and mutable caller rule tables do not substitute for that closure

#### Scenario: Imported default arena and root scope (BSOL-06-05)
- **GIVEN** a root rule inherits an alias-qualified imported rule containing a typed default
- **WHEN** the resolved profile composes and is revalidated under caller limits
- **THEN** default and condition node indices refer to the owned rebased source arena, only root-profile declarations become document roots, mutated public tables are reconstructed from verified bytes, and stricter import count or depth limits still reject

#### Scenario: Qualified imported reference syntax (BSOL-06-05)
- **GIVEN** a declared import alias exposes a rule through a dot-separated identifier path
- **WHEN** native or standalone tooling parses `ref(shared.node)`, `inline(shared.node)` or `@shared.node/label`
- **THEN** both parsers preserve the complete qualifier and reject empty, leading, trailing or repeated-dot path segments; reference resolution identifies the same owned imported declaration through every valid diamond alias
- **AND** stage construction leaves the original profile and its migration definitions unchanged

### Requirement: Checked cross-block references
Reference resolution SHALL index block kind/label identities and resolve @kind/label and unqualified @label only when unambiguous. Missing targets, duplicate target identities, ambiguous unqualified labels and incompatible ref(kind) constraints SHALL reject with reference and definition spans. Reference syntax SHALL remain a distinct syntax value; it SHALL NOT become an unchecked raw pointer. Reference cycles MAY exist only as syntax document links where profile permits; typed owned-value expansion SHALL reject cycles through the serialization cycle policy.

Resolved reference bindings SHALL use a typed origin as their sole source authority: DocumentNode(input node index) or DefaultNode(owning checked FieldBinding index, sourceDocument node index). A default origin SHALL NOT reuse its profile node index as an input document index or rely on a sentinel index. Every target SHALL address the validated input document and its proven RuleBinding; kind and rule aliases for the same actual block SHALL count as one target. Default references SHALL be resolved against the same checked input targets and preserve their owning default source spans.

#### Scenario: Default ownership and canonical aliases (BSOL-06-06)
- **GIVEN** a missing typed field materializes a profile-owned default reference and a rule ID differs from its matched block kind
- **WHEN** reference resolution binds the default and either qualified alias
- **THEN** the default has an explicit checked field/sourceDocument origin, the target is input-owned, and both aliases identify the same proven rule binding without duplicate candidates

#### Scenario: Reference resolution (BSOL-06-06)
- **GIVEN** labeled blocks use kind-qualified and unique unqualified links
- **WHEN** ResolveReferences runs
- **THEN** each link binds the expected syntax block and ref(kind) constraint succeeds

#### Scenario: Ambiguous missing wrong kind (BSOL-06-06)
- **GIVEN** links have duplicate labels, missing destination or wrong kind
- **WHEN** resolution runs
- **THEN** the relevant reference diagnostic rejects the document without unsafe typed expansion

### Requirement: Bounded native BSOL and deterministic floating encoding
Default BSOL limits SHALL be 8388608 input/output bytes, nesting 128, aggregate 100000 nodes/entries, scalar 1048576 bytes, 256 imports, import depth 32 and 8388608 total resolved schema bytes. Explicit callers MAY supply documented alternate checked limits. Parsers/resolvers/validators/writers SHALL count before allocation, use checked arithmetic and return LimitExceeded or AllocationFailed without partial results. Typed integer conversions SHALL check exact declared width; integer-to-float precision loss SHALL reject. f32/f64 BSOL output SHALL use the shortest finite decimal that roundtrips to the same width/bits including negative zero; nonfinite values SHALL reject. Unicode SHALL follow strict serialization scalar/UTF-8 policy without normalization.

#### Scenario: Bounds and float precision (BSOL-06-09)
- **GIVEN** limit/+1 documents, exact large integers, negative zero and nonfinite floats
- **WHEN** parse/read/write execute
- **THEN** limits reject atomically, exact integers/finite bits survive and nonfinite or lossy conversion rejects

#### Scenario: Unicode allocation failure (BSOL-06-09)
- **GIVEN** invalid UTF-8/surrogates or injected allocation failure
- **WHEN** native document/value construction executes
- **THEN** a structured checked error returns without partial document or output

### Requirement: Structural versioned migration
Migration SHALL select an unambiguous versioned source→target route using declared detect and when clauses over syntax. profile_version_missing SHALL inspect profile/version assignment nodes, not source substring presence. when clauses SHALL implement block_kind, field, field_value and missing_field; ambiguous/no routes and cyclic chains SHALL reject. Ordered AddField(key,value), RenameField(from,to) and ReplaceValue(from,to) rewrites SHALL operate only on selected matching block/assignment/value nodes; AddField SHALL insert a missing field, RenameField SHALL reject a destination collision, and ReplaceValue SHALL replace exact typed scalar equality, not arbitrary substring matches. Comments, quoted text containing field spellings and unselected blocks SHALL remain semantically unaffected. The complete result SHALL parse/validate/reference-resolve against the target before publication; applying a completed migration again SHALL report AlreadyAtTarget or produce unchanged semantics.

Migration chain discovery and every rewrite stage SHALL debit one aggregate bounded work policy over an explicitly supplied resolved profile closure. The library SHALL privately parse profile sources before using their definition indices, reject duplicate profile identities and all reachable cycles even when a target route exists, and reject multiple source→target paths with related definition spans. Detect clauses SHALL gate when selection conjunctively; block_kind SHALL match block names structurally (the existing block spelling retains identical meaning). Only the final validated/reference-resolved document SHALL be published; intermediate successful stages SHALL NOT mutate the caller document or become observable on a later failure.

#### Scenario: Bounded private migration chain
- **GIVEN** a unique two-stage source→target route and a caller-owned source document
- **WHEN** both stages complete under one work budget
- **THEN** only the final target validated document is returned and the original source remains unchanged
- **AND** adding a reachable cycle or incompatible alternate path rejects with owning and related definition spans

#### Scenario: Safe migration (BSOL-06-07)
- **GIVEN** a selected old-profile block and unrelated comments/quoted/nested content contain the same field spelling
- **WHEN** migration rewrites execute
- **THEN** only selected nodes change and destination profile/reference validation succeeds

#### Scenario: Route collision and atomic failure (BSOL-06-07)
- **GIVEN** two routes match, renamed key exists or target revalidation fails
- **WHEN** migration executes
- **THEN** a checked route/collision/validation error returns without exposing partial migrated output

### Requirement: Precise generic typed BSOL representation
Typed BSOL SHALL use a versioned `serialization.v1` representation with one top-level `serialized "<ShapeId lowercase hex>" { version = 1; value = <V> }` block (semicolons in this description denote separation, not literal tokens). Every V SHALL be an inline block `value "<tag>" { ... }`, permitted wherever a value is accepted. Tags SHALL be unit (empty), bool (`data` boolean), i8/i16/i32/i64/u8/u16/u32/u64 (`data` exact integer), f32/f64 (`data` finite decimal), char (`data` one-scalar string), string (`data` string), bytes (`encoding = base64; data` strict canonical padded RFC4648 base64 string), array/list (`items` list of V), map (`entries` list of `entry "<key>" { value = V }` inline blocks), record (`shape` quoted ShapeId and `fields` list of `field "<declared-name>" { value = V }` inline blocks), variant (`shape` quoted ShapeId, `name` quoted discriminant and `payload` list of V in declared order), and optional (`present` boolean and `value = V` exactly when present). Explicit wire-width word SHALL use its declared fixed-width integer tag. Record fields SHALL follow declaration order, maps SHALL follow ordinal UTF-8 key order, tags/keys/shape identity SHALL be checked and duplicate/unknown/missing/default policies SHALL be Serialization policies. The grammar SHALL admit inline value blocks on assignment RHS as well as inside lists; native and standalone tooling SHALL share this extension. Shape hex SHALL encode the complete registered 256-bit digest; no numeric AST or GC pointer SHALL appear as identity.

#### Scenario: Full typed representation (BSOL-06-08)
- **GIVEN** a registered generic record includes every supported primitive/collection/enum/optional/bytes shape
- **WHEN** Write<T> then Read<T> uses serialization.v1
- **THEN** the precise tagged representation roundtrips values and declared widths with no dictionary inference

#### Scenario: Invalid typed tags shape (BSOL-06-08)
- **GIVEN** tag/shape mismatch, malformed base64, optional false with value or duplicate fields
- **WHEN** typed Read executes
- **THEN** a path/spanned Serialization/Bsol error rejects with no partial T

### Requirement: Profile-aware typed configurations
Native BSOL SHALL additionally map a validated application-profile document to/from T through an explicit generated BsolBinding<T> contract. Each binding SHALL declare root block matcher/label policy, every record field→assignment or nested-block path, scalar encoding, sequence/map/variant/optional representation and permitted extras/defaults; ambiguous implicit inference SHALL reject at generation. Read<T>(text,profile,resolver,limits) SHALL parse/resolve/validate then invoke this typed binding, and Write<T>(value,profile,limits) SHALL validate emitted syntax/references before returning canonical text. serialization.v1 SHALL be the generic binding; real configuration profiles SHALL use explicit application bindings preserving their existing syntax rather than requiring wrapper blocks in .bproj/.bws files.

#### Scenario: Installed generic configuration journey (BSOL-06-08)
- **GIVEN** an installed Beskid example has an explicit config-profile binding for GenericConfig<string>
- **WHEN** it reads/validates/decodes/updates/writes/re-reads a configuration
- **THEN** updated typed values and profile syntax agree and all parsing/mapping executes native Beskid

#### Scenario: Binding ambiguity (BSOL-06-08)
- **GIVEN** two fields bind to one assignment or a field lacks a profile-compatible representation
- **WHEN** generation runs
- **THEN** a source-spanned eligibility/binding diagnostic rejects before lowering

### Requirement: Shared corpus and complete qualification
Rust tooling and native BSOL SHALL consume one digest-identified corpus containing positive/negative syntax, normalized ordered AST, diagnostics/spans, canonical output, schema self-validation/import/reference/composition/constraint/migration and typed shape cases. Required acceptance IDs SHALL be SER-01..06, MOD-06-01/02, DYN-06-01..05 and BSOL-06-01..09. Installed native consumer and corpus execution SHALL pass on Linux x64, macOS arm64 and Windows x64 with exact candidate source/tool/runtime-kit/input/artifact identities. Existing release evidence validation SHALL reject missing, skipped, blocked, timeout or mismatched-source required cells; scalar feasibility milestones SHALL NOT waive final full shape/native BSOL scope.

#### Scenario: Corpus parity (BSOL-06-01..09)
- **GIVEN** identical corpus source/input digests
- **WHEN** Rust and installed native harnesses run on required targets
- **THEN** normalized successful results and rejection categories/spans match and every required case records executed/pass

#### Scenario: Evidence failure closed (BSOL-06-08)
- **GIVEN** one required target/shape/profile case is missing or timeout/source-mismatched
- **WHEN** the release evidence validator runs
- **THEN** qualification rejects the packet without converting the cell into pass


### Requirement: BSOL-06-EMPTY Native empty string composition

The native BSOL implementation SHALL preserve valid empty strings through runtime concatenation. Concatenating two valid empty strings SHALL produce a valid empty string that remains usable as either operand of subsequent concatenations. Zero logical byte length SHALL NOT be represented as an allocation failure.

#### Scenario: Escape starts after an empty raw prefix
- **GIVEN** a quoted BSOL string begins with a valid escape and therefore has an empty raw prefix
- **WHEN** the native decoder concatenates the accumulated empty string with that prefix and then with the decoded scalar
- **THEN** the resulting string contains the scalar's exact UTF-8 bytes and no null string handle is exposed

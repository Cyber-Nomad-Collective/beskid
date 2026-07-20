## ADDED Requirements

### Requirement: Macro definition and invocation syntax
`macro name (fragmentKind param, ...) { ... }` MUST introduce a `MacroDefinition` as an `InnerItem`. Optional `pub` MUST obey modules and visibility rules. Metavariables `$name` MUST reference a parameter and are legal only inside macro definitions. Invocation MUST use postfix `!` on the macro name (`name!()`, `name!(args)`, `name! { block }`). `!` after an identifier is a macro invocation only when a `macro` binding resolves in scope; otherwise the compiler MUST emit **E1901**.

#### Scenario: Unknown macro invocation
- **GIVEN** an identifier followed by `!` with no `macro` binding in scope
- **WHEN** macro resolution runs
- **THEN** the compiler emits **E1901**

### Requirement: Fragment kinds and arity
Macro parameters MUST use the closed v1 fragment-kind vocabulary (`block`, `expression`, `statement`, `type`, `identifier`, `literal`, `pattern`, `path`, `item`, `node`). Mismatch between actual argument shape and declared kind MUST emit **E1903** at the argument span. Expansion MUST validate arity and fragment kinds before substitution.

#### Scenario: Fragment kind mismatch
- **GIVEN** a macro parameter declared as `expression` and an actual argument that is not an expression root
- **WHEN** expansion validates arguments
- **THEN** the compiler emits **E1903** at the argument span

### Requirement: Structural expansion and depth cap
Expansion MUST resolve the invocation, deep-copy captured fragments, substitute every `$param` occurrence (fresh node identities), splice the result in place of the `MacroInvocation`, and repeat until no `!` invocations remain or `maxMacroExpansionDepth` is reached (**E1905**). Default depth cap MUST be 32 per compilation unit generation. Expanded trees MUST pass the same structural checks as authored syntax before semantic analysis. After `mod.generate` re-parses, `macro.expand` MUST run again so mod-emitted code can contain macro invocations. Macro bodies MUST NOT emit source text or interpret arbitrary Beskid statements at compile time.

#### Scenario: Expansion depth exceeded
- **GIVEN** mutually recursive macro invocations that exceed the default depth of 32
- **WHEN** `macro.expand` runs
- **THEN** the compiler emits **E1905** and stops expansion

## REMOVED Requirements

### Requirement: Language macros conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.

## MODIFIED Requirements

### Requirement: Structural expansion and depth cap
Expansion MUST resolve the invocation, deep-copy captured fragments, substitute every `$param` occurrence (fresh node identities), splice the result in place of the `MacroInvocation`, and repeat until no `!` invocations remain or `maxMacroExpansionDepth` is reached (**E1905**). Default depth cap MUST be 32 per compilation unit generation. Expanded trees MUST pass the same structural checks as authored syntax before semantic analysis. After `mod.generate` merges its typed structural contributions, `macro.expand` MUST run again on the merged tree so mod-emitted typed nodes can contain macro invocations. The host MUST NOT parse source text to do this. Macro bodies MUST NOT emit source text or interpret arbitrary Beskid statements at compile time.

#### Scenario: Expansion depth exceeded
- **GIVEN** mutually recursive macro invocations that exceed the default depth of 32
- **WHEN** `macro.expand` runs
- **THEN** the compiler emits **E1905** and stops expansion

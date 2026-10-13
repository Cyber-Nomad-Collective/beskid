## MODIFIED Requirements

### Requirement: Beskid.Syntax traversal and no source emission
`Beskid.Syntax.Nodes.Node` MUST be a contract that is the sole navigation surface for mod traversal via `NodeRef` handles with stable identities per syntax generation. Mod code MUST build and transform trees through declarative fluent APIs with no string formatting or source-text emission. The SDK MUST NOT provide a source-text contribution type: `CodeContribution`, `CodeString`, the `codeOutputs` field and their helpers do not exist. A `Generator` result MUST be a typed structural contribution only, and the host MUST reject a native result that carries any field that is not a typed structural value. The host MUST merge generated nodes without parsing text. Language macros are not Mod contracts; they expand via `macro.expand` before `mod.load`.

#### Scenario: Generator emits typed AST only
- **GIVEN** a `Generator` contract implementation
- **WHEN** it contributes to the host program
- **THEN** the contribution is typed structural AST, never formatted source text, and the host merges it without a text parse and then runs `macro.expand` again on the merged tree

#### Scenario: Native result with a non-typed field is rejected
- **GIVEN** a native `Generator` result that carries a field that is not a typed structural contribution
- **WHEN** the host decodes the result
- **THEN** the host rejects the whole result and merges nothing from it

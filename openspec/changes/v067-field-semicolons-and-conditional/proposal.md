## Why

Two owner rulings of 2026-10-24 change the syntax. First, field declarations in `type` bodies end with `;`, like statements, and not with `,`. Enum variants and literals keep commas, as in C#. Second, the language gets the conditional expression `cond ? a : b` with C# semantics.

## What Changes

- Every field declaration in a `type` body (value field, `inject` field, `event` field) ends with `;`. A comma between fields is a parse error.
- Enum variants, struct literal fields, arguments and array literals keep commas.
- `cond ? a : b` is an expression with a `bool` condition, branches of the same type, lazy evaluation of the chosen branch, right associativity, and the lowest precedence above assignment.

## Capabilities

### Modified Capabilities
- `language-meta--type-system--types`, `language-meta--surface-syntax--lexical-and-syntax`, `language-meta--evaluation--control-flow`, `language-meta--composition--dependency-injection`.

## Impact

Grammar `beskid.pest`, parser, formatter, tree-sitter and editor grammars, Corelib and fixture sources (rewritten by a codemod at integration; examples in specs are not hand-edited). Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. Sources that separate fields with `,` stop parsing. The codemod rewrites repository sources. There is no compatibility path.

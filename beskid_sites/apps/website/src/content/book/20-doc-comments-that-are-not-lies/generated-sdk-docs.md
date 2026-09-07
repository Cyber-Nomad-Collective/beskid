---
title: "Generated SDK docs"
description: Compiler SDK syntax is generated—document semantics and invariants, not obvious identifiers.
tableOfContents: true
---

`Beskid.Compiler.*` SDK sources (including syntax types) are produced by **`beskid_ast_reflect_gen`**, not hand-maintained parallel copies. When you document mirrored declarations:

- Explain semantics and non-obvious invariants.
- Do not restate identifier names and types already visible in the signature.
- Never put `@arg` on struct fields that are not callable parameters.

Mods and analyzers consume the same AST model—lying in SDK docs breaks more than hover text.

## Keep generated and authored material distinct

Treat generated SDK output as a view of the source model. Improve the source comment or generator input when the explanation is wrong; do not patch generated copies that will be replaced on the next run. For the contract that makes generated API information consumable by tools, see [the api.json standard](/platform-spec/tooling/cli/api-json-contract/).

## Next

[Verify docs in CI](/book/20-doc-comments-that-are-not-lies/verify-docs/)

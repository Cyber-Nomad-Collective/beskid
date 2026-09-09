import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



This article documents the **design model** for **Beskid.Compiler.SyntaxMirror facade**.

## Language alignment
**`Beskid.Compiler.Query`** consumes **Syntax** nodes as read-only views during the **`process`** phase; **emit** uses the same node factory family for typed contributions.

## Persistent entities
- **Compilation instance** — implicit handle to the compilation under construction (**[Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/)** / `Beskid.Compiler.Compilation`).
- **Syntax snapshot** — immutable tree with stable node identities suitable for incremental keys.
- **Capability tokens** — host-granted permissions for I/O, diagnostics, and emit operations during mod execution.

## Boundaries
- Mod SDK facades never bypass the host bridge for effects.
- Generation logic in the reference compiler remains Rust-internal; Beskid sees only the generated `Beskid.Compiler.*` projection.

## Anchored code paths
- `corelib` package module **`Beskid.Syntax`** (generated + hand-authored surface; legacy `Beskid.Compiler.Syntax` paths deprecated).
- `compiler/crates/beskid_analysis/src/syntax/` — authoritative internal model to mirror.

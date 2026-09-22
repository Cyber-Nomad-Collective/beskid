## Why

Corelib native services already have two independently protected facts: an
exact compiler-embedded source corpus and ABI-v5 manifest-generated target
bindings. Before this change, module emission retained only an adapter symbol
when it assembled imports. It did not require a single proof that the called
Corelib declaration, its physical source authority, and its selected target
binding still describe the same import.

That gap is especially material for the v0.5 Networking facade. Networking
adds a source-scoped family of native services across Linux, macOS, and
Windows. Those services must not become user `Extern` imports, guessed native
symbols, or a provisional Glue surface. Glue remains deferred to v0.6.

## What Changes

- **MODIFY** `compiler--codegen-and-ir--extern-import-extraction-contract`
  with a Corelib-native-import preflight requirement.
- Require lowering to retain the exact `(source path, service name, adapter)`
  declaration until it is checked against the compiler-minted Corelib source
  capability and the canonical ABI-v5 manifest for the selected target.
- Require exactly one binding for every supported target, a matching adapter
  and implementation, and identical parameter/result shape across targets.
- Require rejection before any JIT or AOT backend artifact is produced when a
  declaration is unknown, source-mismatched, target-incomplete, duplicate, or
  shape-mismatched.
- State expressly that this is not user FFI or Glue: it adds no source syntax,
  foreign library resolver, compatibility alias, Glue runtime, or Glue
  backend.

## Impact

The compiler gains one fail-closed preflight seam between semantic Corelib
service facts and module import assembly. The ABI manifest remains the sole
target-contract source; no generated registry is hand-maintained. Networking
is covered by the same generic rule rather than an independent exception.

## Context

The `extern-import-extraction-contract` spec owns the normative
contract for collecting foreign import metadata during lowering. The
existing contract is CLIF-only: `Extern` imports are collected as
`ExternImport` records (symbol, abi, library) during codegen and
resolved through the platform linker at link time. The Beskid.Glue
model introduced by `add-beskid-glue-0-4` adds two non-CLIF backends
(`RustSource`, `DotNetProject`) that do not lower through CLIF and do
not resolve foreign symbols through the platform linker. A glue
backend resolves a foreign-library import through a `GlueTag` (host
typed tag object carrying the backend kind and library identity) and
an emission path through the seven atomized glue contracts
(`TypeMapping`, `SymbolEmission`, `LinkArgs`, `SignatureReader`,
`SignatureWriter`, `ToolchainProbe`, `StdioBridge`).

Without a normative extraction path for glue backends, a glue backend
has no contract for collecting foreign import metadata, and the
`ExternImport` CLIF path does not apply. This change extends the
extraction contract with a glue path alongside the CLIF path.

Normative behavior remains owned by OpenSpec. The extraction contract
hub owns both paths; the CLIF path is the path for `Extern` imports,
the glue path is the path for `[GlueImport]` imports. The two paths do
not mix for a single import; the one-surface-per-symbol rule is owned
by `reconcile-glue-ffi-extern-0-5`.

## Goals / Non-Goals

**Goals:**

- Extend the extern import extraction contract with a glue-backend
  extraction path: foreign-library-import -> `GlueTag` -> emission.
- Keep the CLIF `ExternImport` path as the path for `Extern` imports.
- Require the two paths to remain disjoint for a single import.

**Non-Goals:**

- Defining the `GlueTag` type or the seven glue contracts (owned by
  `language-meta--interop--beskid-glue`).
- Defining the one-surface-per-symbol rule (owned by
  `reconcile-glue-ffi-extern-0-5`).
- Implementing the glue emission; 0.5 delivers the implementation.
- Changing the CLIF `ExternImport` record shape or the link-time
  resolution contract.

## Decisions

### D-GLUE-EXTRACT-0001: glue backends extract to GlueTag, not ExternImport

A foreign-library import declared with `[GlueImport]` SHALL be
extracted during lowering as a `GlueTag` carrying the backend kind
(`GlueBackendKind::Rust` or `GlueBackendKind::DotNet`) and the library
identity. The `GlueTag` SHALL drive an emission path through the glue
mod contracts. The extraction SHALL NOT produce a link-time
`ExternImport` row for a `[GlueImport]` import.

Alternative considered: reuse the `ExternImport` record with a backend
field. Rejected because `ExternImport` is a link-time resolution record
(symbol, abi, library) and a glue import does not resolve through the
platform linker; conflating the two breaks the one-implementation-path
rule.

### D-GLUE-EXTRACT-0002: the two extraction paths are disjoint

The CLIF extraction path applies to `Extern` imports and produces
`ExternImport` rows. The glue extraction path applies to `[GlueImport]`
imports and produces `GlueTag` records. A single import SHALL use
exactly one path. The one-surface-per-symbol rule
(`reconcile-glue-ffi-extern-0-5`) guarantees no import carries both
`Extern` and `[GlueImport`, so the two paths never meet for a single
import.

## Risks / Trade-offs

- [A glue backend emits an ExternImport row by mistake] -> The
  extraction contract requires a `[GlueImport]` import to produce a
  `GlueTag`, not an `ExternImport`; a conformance fixture asserts the
  record kind.
- [The two paths drift after this change] -> The disjointness rule is
  normative and links to the one-surface-per-symbol rule; future
  changes must preserve it.
- [0.4 ships the contract without the implementation] -> The glue
  extraction path fails closed with `BackendError::NotImplementedFor0_4`
  until 0.5; the CLIF path remains the production path for 0.4.

## Migration Plan

1. Validate this change strictly and validate the repository OpenSpec
   standard without running compiler or Cargo commands.
2. Add a RED test proving the codegen pipeline has no extraction path
   for a `[GlueImport]` import (no `GlueTag` record produced).
3. Add the glue extraction path that produces a `GlueTag` for a
   `[GlueImport]` import and drives the emission path through the glue
   mod contracts; fail closed with `BackendError::NotImplementedFor0_4`
   for 0.4.
4. Add conformance fixtures asserting a `[GlueImport]` import produces
   a `GlueTag` (not an `ExternImport`) and an `Extern` import produces
   an `ExternImport` (not a `GlueTag`).
5. Run focused verification, the OpenSpec standard, and the release
   gates; update catalog/changelog/traceability evidence and run
   GitNexus changed-scope analysis before integration.

Rollback before deletion reverts the glue extraction wave. After
deletion, rollback selects the last complete release bundle. It never
reinstates a CLIF-only extraction contract without a glue path as the
production path for glue backends.

## Open Questions

None. The glue extraction path, the `GlueTag` record kind, and the
disjointness rule are fixed by this change. The exact emission sequence
through the seven glue contracts is implementation detail constrained
by the `language-meta--interop--beskid-glue` contract.

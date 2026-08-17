## Why

The `extern-import-extraction-contract` spec is CLIF-only: it collects
`ExternImport` records during lowering for the platform linker. The
Beskid.Glue model introduced by `add-beskid-glue-0-4` adds glue backends
(`RustSource`, `DotNetProject`) that do not lower through CLIF and do
not resolve foreign symbols through the platform linker. A glue
backend needs a distinct extraction path: a foreign-library import
declared with `[GlueImport]` produces a `GlueTag` (host typed tag
object carrying the backend kind and library identity) and an emission
path through the seven atomized glue contracts, not a link-time
`ExternImport` row. The current spec covers only the CLIF path, so a
glue backend has no normative extraction contract. This change
extends the spec to cover glue backends before 0.5 language-specific
generation lands.

## What Changes

- **MODIFY** `compiler--codegen-and-ir--extern-import-extraction-contract`
  to extend the extraction contract with a glue-backend path: a
  foreign-library import declared with `[GlueImport]` SHALL be
  extracted as a `GlueTag` carrying the backend kind and library
  identity and SHALL drive an emission path through the glue mod
  contracts rather than a link-time `ExternImport` row. The CLIF path
  remains the path for `Extern` imports; the glue path is the path for
  `[GlueImport]` imports. The two paths SHALL NOT mix for a single
  import.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `compiler--codegen-and-ir--extern-import-extraction-contract`:
  glue-backend extraction path (foreign-library-import -> `GlueTag` ->
  emission) alongside the existing CLIF `ExternImport` path.

## Compatibility and migration

This change is spec-only and adds a second extraction path. The
existing CLIF `ExternImport` extraction for `Extern` imports is
unchanged. The glue extraction path applies only to `[GlueImport]`
imports and produces `GlueTag` records, not `ExternImport` rows. 0.4
declares the contract; 0.5 implements the glue emission. No public
standard URL or legacy URL changes.

## Rollback and staged deployment

This contract is staged before 0.5 glue generation. 0.4 ships the
contract; the glue extraction path fails closed with
`BackendError::NotImplementedFor0_4` until 0.5. Reverting a later
implementation restores the prior release as a unit; it does not
reinstate a CLIF-only extraction contract without a glue path as the
production path for glue backends.

## Impact

Spec-only in this change. Follow-on 0.5 work covers the glue
extraction implementation in the codegen pipeline, conformance fixtures
for the `GlueTag` emission path, and traceability evidence in the
extern import extraction verification article.

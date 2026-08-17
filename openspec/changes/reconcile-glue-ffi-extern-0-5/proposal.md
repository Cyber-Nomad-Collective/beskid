## Why

The Beskid.Glue model introduced by `add-beskid-glue-0-4` declares
`[GlueImport]` and `[GlueExport]` attributes as parallel import/export
surfaces alongside the v0.3 `Extern` / `[Export]` surfaces. Both pairs
address foreign interop, but no normative text establishes the
relationship between them. A symbol can today be annotated with both
`Extern` and `[GlueImport]` (or `[Export]` and `[GlueExport]`) without a
diagnostic, leaving the compiler free to lower the same boundary
through two conflicting paths. The v0.3 FFI/extern and
export/callbacks hubs own the direct C ABI surface; the Beskid.Glue hub
owns the glue-mod-driven surface. Without a normative boundary, the
two hubs can drift and a single symbol can produce both a link-time
`ExternImport` row and a glue `GlueTag` binding, which is
non-deterministic at the foreign boundary.

This change establishes the normative relationship before 0.5
language-specific glue generation lands: `Extern` / `[Export]` are the
direct C ABI surfaces for dlopen-able artifacts and link-time binding;
`[GlueImport]` / `[GlueExport]` are the glue-mod-driven surfaces for
the stdio bridge and generated bindings. A symbol uses one surface,
not both, and the reference compiler rejects a conflicting annotation
with a diagnostic.

## What Changes

- **MODIFY** `language-meta--interop--ffi-and-extern` to establish that
  `Extern` is the direct C ABI import surface and that a declaration
  annotated with `Extern` MUST NOT also carry `[GlueImport]`. The
  reference compiler MUST emit a diagnostic when both attributes apply
  to the same contract declaration.
- **MODIFY** `language-meta--interop--export-and-callbacks` to
  establish that `[Export]` is the direct C ABI export surface and that
  a function annotated with `[Export]` MUST NOT also carry
  `[GlueExport]`. The reference compiler MUST emit a diagnostic when
  both attributes apply to the same function declaration.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `language-meta--interop--ffi-and-extern`: normative relationship
  between `Extern` and `[GlueImport]` and the conflict diagnostic.
- `language-meta--interop--export-and-callbacks`: normative
  relationship between `[Export]` and `[GlueExport]` and the conflict
  diagnostic.

## Compatibility and migration

This change is spec-only and adds a conflict diagnostic. Existing
source that uses `Extern` or `[Export]` alone is unchanged. Existing
source that uses `[GlueImport]` or `[GlueExport]` alone is unchanged.
Source that annotates a single declaration with both surfaces is
already non-deterministic and becomes a hard diagnostic. No public
standard URL or legacy URL changes.

## Rollback and staged deployment

This contract is staged before 0.5 glue generation. Reverting a later
implementation restores the prior release as a unit; it does not
reinstate a dual-surface symbol as a valid program. The conflict
diagnostic is the production path; there is no fallback that silently
picks one surface over the other.

## Impact

Spec-only in this change. Follow-on work covers the conflict
diagnostic in the semantic pipeline, conformance fixtures for both
import and export conflicts, and traceability evidence in the FFI and
export verification articles.

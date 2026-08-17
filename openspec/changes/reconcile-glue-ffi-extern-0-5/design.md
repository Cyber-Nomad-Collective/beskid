## Context

Two parallel foreign-interop surfaces coexist without a normative
relationship:

1. The v0.3 direct C ABI surface: `Extern` on `contract` declarations
   produces link-time `ExternImport` rows resolved through the project
   `link` block and `AotBuildRequest::external_libraries`; `[Export]`
   on `pub` functions produces globally linked export symbols. This
   surface is owned by `language-meta--interop--ffi-and-extern` and
   `language-meta--interop--export-and-callbacks` and targets
   dlopen-able artifacts and link-time binding.
2. The Beskid.Glue surface introduced by `add-beskid-glue-0-4`:
   `[GlueImport]` on a contract and `[GlueExport]` on a function drive
   glue-mod generation through the seven atomized glue contracts and
   the stdio bridge fiber. This surface is owned by
   `language-meta--interop--beskid-glue` and targets generated
   bindings (Rust crate emission, .NET project emission) and the
   stdio-protocol runtime.

Both surfaces address foreign interop. Without a normative boundary,
a single declaration can carry both `Extern` and `[GlueImport]` (or
`[Export]` and `[GlueExport]`), and the compiler has no rule that
selects one lowering path. This is non-deterministic at the foreign
boundary and lets the two hubs drift.

Normative behavior remains owned by OpenSpec. The FFI/extern hub owns
the direct C ABI import rules; the export/callbacks hub owns the
direct C ABI export rules; the Beskid.Glue hub owns the glue-mod-driven
rules. This change adds the boundary between them: a symbol uses one
surface, not both, and the reference compiler rejects a conflicting
annotation.

## Goals / Non-Goals

**Goals:**

- Establish `Extern` / `[Export]` as the direct C ABI surfaces for
  dlopen-able artifacts and link-time binding.
- Establish `[GlueImport]` / `[GlueExport]` as the glue-mod-driven
  surfaces for the stdio bridge and generated bindings.
- Require the reference compiler to emit a diagnostic when a single
  declaration carries both surfaces.
- Keep the two hubs as the sole authorities for their respective
  surfaces; this change adds the boundary, it does not redefine either
  surface.

**Non-Goals:**

- Merging the two surfaces into one attribute set.
- Changing the `Extern` attribute shape, the `[Export]` attribute
  shape, the `[GlueImport]` / `[GlueExport]` attribute shapes, or the
  `ExternImport` extraction contract.
- Defining the glue extraction path (covered by
  `extend-extern-import-extraction-glue-0-5`).
- Allocating a new diagnostic code band; the conflict diagnostics
  reuse the existing extern/export diagnostic bands.

## Decisions

### D-GLUE-FFI-0001: `Extern` / `[Export]` = direct C ABI

`Extern` on a `contract` and `[Export]` on a `pub` function are the
direct C ABI surfaces. They produce link-time `ExternImport` rows and
globally linked export symbols resolved through the platform linker.
They target dlopen-able artifacts and link-time binding. This is the
v0.3 Standard surface and is unchanged by the glue model.

Alternative considered: retire `Extern` / `[Export]` in favor of the
glue surfaces. Rejected because the direct C ABI surface is Standard
in v0.3, is implemented for Linux tier-1, and serves embedders and
plugin authors who do not need a glue mod.

### D-GLUE-FFI-0002: `[GlueImport]` / `[GlueExport]` = glue-mod-driven

`[GlueImport]` on a contract and `[GlueExport]` on a function are the
glue-mod-driven surfaces. They drive the seven atomized glue contracts
and the stdio bridge fiber and target generated bindings (Rust crate
emission, .NET project emission) and the stdio-protocol runtime. They
do not produce link-time `ExternImport` rows or globally linked export
symbols. This surface is owned by `language-meta--interop--beskid-glue`.

Alternative considered: make `[GlueImport]` a sub-form of `Extern`.
Rejected because the two surfaces have different lowering paths,
different backends, and different verification anchors; conflating
them breaks the one-implementation-path-per-construct rule.

### D-GLUE-FFI-0003: a symbol uses one surface, not both

A single declaration MUST NOT carry both a direct C ABI attribute
(`Extern` or `[Export]`) and a glue-mod-driven attribute
(`[GlueImport]` or `[GlueExport]`). The reference compiler MUST emit a
diagnostic on the conflicting annotation and MUST NOT lower the
declaration through either path until the conflict is resolved. The
diagnostic is the production path; there is no silent preference.

Alternative considered: let `Extern` win over `[GlueImport]` (or vice
versa) by precedence. Rejected because silent precedence hides the
author's intent and produces a foreign boundary that does not match
either annotation. A hard diagnostic forces the author to pick one
surface.

## Risks / Trade-offs

- [Existing dual-annotated source breaks] -> Such source is already
  non-deterministic; the diagnostic makes the conflict visible. The
  fix is to remove one attribute.
- [The two hubs drift after this change] -> The boundary is normative;
  future changes to either surface must link to this relationship and
  preserve the one-surface-per-symbol rule.
- [Conflict diagnostic collides with existing diagnostics] -> The
  conflict is a distinct condition (both attributes present) and
  reuses the existing extern/export diagnostic bands with a new code
  in order.

## Migration Plan

1. Validate this change strictly and validate the repository OpenSpec
   standard without running compiler or Cargo commands.
2. Add a RED test proving the reference compiler accepts a contract
   annotated with both `Extern` and `[GlueImport]` and a function
   annotated with both `[Export]` and `[GlueExport]` without a
   diagnostic.
3. Add the conflict diagnostic for `Extern` + `[GlueImport]` on a
   contract and `[Export]` + `[GlueExport]` on a function.
4. Add conformance fixtures for both import and export conflicts.
5. Run focused verification, the OpenSpec standard, and the release
   gates; update catalog/changelog/traceability evidence and run
   GitNexus changed-scope analysis before integration.

Rollback before deletion reverts the diagnostic wave. After deletion,
rollback selects the last complete release bundle. It never reinstates
a dual-surface symbol as a valid program.

## Open Questions

None. The surface boundary, the one-surface-per-symbol rule, and the
conflict diagnostic are fixed by this change. The exact diagnostic
code allocation inside the existing extern/export bands is
implementation detail constrained by the in-order allocation rule.

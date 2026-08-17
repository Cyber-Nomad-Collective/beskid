## 1. Validate and establish RED evidence

- [ ] 1.1 Create the proposal, design, tasks, and complete capability
  delta.
- [ ] 1.2 Validate this change strictly and validate the repository
  OpenSpec standard without running compiler or Cargo commands.
- [ ] 1.3 Add a failing test proving the codegen pipeline produces no
  extraction record for a `[GlueImport]` import (no `GlueTag`, no
  glue emission path).

## 2. Introduce the glue extraction path

- [ ] 2.1 Add a glue extraction path that produces a `GlueTag`
  carrying the backend kind (`GlueBackendKind::Rust` or
  `GlueBackendKind::DotNet`) and the library identity for a
  `[GlueImport]` import during lowering.
- [ ] 2.2 Drive the emission path through the seven glue mod contracts
  from the extracted `GlueTag`; fail closed with
  `BackendError::NotImplementedFor0_4` for 0.4.
- [ ] 2.3 Ensure a `[GlueImport]` import does not produce a link-time
  `ExternImport` row and an `Extern` import does not produce a
  `GlueTag`.

## 3. Migrate conformance fixtures

- [ ] 3.1 Add a conformance fixture asserting a `[GlueImport]` import
  produces a `GlueTag` record and not an `ExternImport` row.
- [ ] 3.2 Add a conformance fixture asserting an `Extern` import
  produces an `ExternImport` row and not a `GlueTag`.

## 4. Delete superseded paths

- [ ] 4.1 Delete any ad hoc glue extraction that bypasses the
  `GlueTag` record or mixes the CLIF and glue paths for a single
  import after the disjoint extraction lands.

## 5. Verify

- [ ] 5.1 Make all focused RED suites green through the production
  codegen pipeline.
- [ ] 5.2 Run the extern import extraction verification suite and
  assert no regression for the CLIF `ExternImport` path.
- [ ] 5.3 Run full OpenSpec, compiler workspace, and release gates;
  update catalog/changelog/traceability evidence and run GitNexus
  changed-scope analysis before integration.

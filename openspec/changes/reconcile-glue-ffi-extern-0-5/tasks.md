## 1. Validate and establish RED evidence

- [ ] 1.1 Create the proposal, design, tasks, and complete capability
  deltas.
- [ ] 1.2 Validate this change strictly and validate the repository
  OpenSpec standard without running compiler or Cargo commands.
- [ ] 1.3 Add a failing test proving the reference compiler accepts a
  contract annotated with both `Extern` and `[GlueImport]` without a
  diagnostic.
- [ ] 1.4 Add a failing test proving the reference compiler accepts a
  function annotated with both `[Export]` and `[GlueExport]` without a
  diagnostic.

## 2. Introduce the conflict diagnostics

- [ ] 2.1 Add a semantic diagnostic that rejects a `contract`
  declaration carrying both `Extern` and `[GlueImport]`; allocate the
  code inside the existing extern diagnostic band in order.
- [ ] 2.2 Add a semantic diagnostic that rejects a `pub` function
  carrying both `[Export]` and `[GlueExport]`; allocate the code
  inside the existing export diagnostic band in order.
- [ ] 2.3 Ensure neither lowering path runs for a conflicting
  declaration; the diagnostic is terminal for that declaration.

## 3. Migrate conformance fixtures

- [ ] 3.1 Add conformance fixtures for the import conflict
  (`Extern` + `[GlueImport]`) and the export conflict
  (`[Export]` + `[GlueExport]`).
- [ ] 3.2 Add fixtures proving a declaration carrying only one surface
  still lowers through the correct path unchanged.

## 4. Delete superseded paths

- [ ] 4.1 Delete any ad hoc precedence or silent-preference logic that
  picks one surface over the other for a dual-annotated declaration
  after the diagnostics land.

## 5. Verify

- [ ] 5.1 Make all focused RED suites green through the production
  semantic pipeline.
- [ ] 5.2 Run the FFI and export verification suites and assert no
  regression for single-surface declarations.
- [ ] 5.3 Run full OpenSpec, compiler workspace, and release gates;
  update catalog/changelog/traceability evidence and run GitNexus
  changed-scope analysis before integration.

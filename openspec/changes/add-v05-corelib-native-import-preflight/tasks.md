## 1. ABI preflight

- [x] 1.1 Add one typed Corelib-native-import preflight that joins source
  capability, declaration identity, canonical target manifest, and generated
  target bindings.
- [x] 1.2 Reject unknown declarations, source/adapter mismatches, duplicate or
  incomplete target rows, implementation drift, and target ABI-shape drift.

## 2. Codegen integration

- [x] 2.1 Preserve `CorelibService` facts through module import collection and
  invoke the preflight before an adapter can enter the artifact.
- [x] 2.2 Keep user `Extern` handling and deferred Glue behavior separate.

## 3. Coverage and final verification

- [x] 3.1 Add compiler coverage for all Corelib services, rejected source and
  adapter declarations, and the complete Networking family.
- [ ] 3.2 After every required Beskid implementation surface is present,
  regenerate ABI-v5 contract artifacts from `runtime_manifest.bsol` using the
  canonical generator; do not hand-edit generated outputs.
- [ ] 3.3 Run the final Cargo tests plus Beskid analyze, test, run, and build
  verification wave after regeneration.

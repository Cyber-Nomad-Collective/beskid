## 1. Validate baseline and obligations

- [x] 1.1 Record released/main/draft source identities and one disposition for each historical item. Evidence: "Baseline and preserved work" table in `docs/reports/2026-10-04-v06-decisions.md` (original root and compiler, execution root `f67ae4f2`, released compiler `95c203ff`, corelib, BSOL, distribution, Tracker, VS Code and Glue draft identities, each with a disposition).
- [ ] 1.2 Validate this change and the CLI, serialization/BSOL and Rust Glue deltas; freeze linked requirement/case IDs without reducing scope.
  - Remaining: `openspec validate v06-release-qualification --strict --no-interactive` passes on 2026-10-13. `scripts/ci/release-cases-v06.json` holds 86 mandatory cases (40 `installed_native`, 46 `installed_host_harness`) and 15 `provisional_cases`, but its `state` is `binding_required` and 70 cases have `binding: null`. The fragments under `scripts/ci/release-case-bindings/` cover 66 of those 70; DYN-06-03, DYN-06-04, R4-TOOL-02 and R4-TOOL-04 have no fragment. `scripts/ci/freeze-release-cases-v06.mjs` has not written a frozen manifest.
- [ ] 1.3 Record required channel inventory and revisioned Tracker import/reconciliation plan.
  - Remaining: no channel inventory record or Tracker reconciliation plan for 0.6.0 is retained in the repository.

## 2. Introduce complete acceptance evidence

- [x] 2.1 Add RED evidence-reader tests for missing, skipped, timed out, duplicated, stale-source and incomplete required matrix cells (`scripts/ci/test/v06-release-matrix.test.mjs`, `v06-release-producer.test.mjs`, 2026-10-13).
- [x] 2.2 Extend existing feature/CLI/package readers with version-specific required cases, installed consumers and recursively consumed source identities (schema-2 reader with execution kinds, `woodpecker-release-cases-v06.mjs` producer, `freeze-release-cases-v06.mjs`; 2026-10-13).
- [ ] 2.3 Execute mandatory source tests, native feature fixtures and installed journeys on all three targets; retain exact input/output/tool/artifact evidence.
  - Remaining: requires the frozen manifest and Woodpecker runs on the three targets; no `feature-evidence-v2.json` packet is retained.

## 3. Migrate and delete obsolete release assumptions

- [x] 3.1 Migrate v0.6 aggregation from v0.5 Glue exemptions to complete mandatory scope. Evidence: `validatePlatform` in `scripts/ci/woodpecker-release-evidence.mjs` dispatches schema by release series and rejects `feature-evidence-v1.json` and the Glue `not_applicable` exemption for 0.6; `ValidateV06FeatureEvidence` admits only `not_applicable.dotnet_glue: "stretch"`. Tests: "rejects the historical Glue exemption for 0.6 and later release evidence" (`scripts/ci/test/woodpecker-release-evidence.test.mjs`), "unbound obligations and the v0.5 Glue exemption cannot qualify 0.6" (`scripts/ci/test/v06-release-matrix.test.mjs`).
- [ ] 3.2 Update docs, templates, editor integrations and harness invocations to the canonical CLI; remove old dispatcher paths and obsolete success claims.
  - Remaining: not audited in this change; no completion record is retained.
- [ ] 3.3 Reconcile Tracker delivery links without overwriting independent tasks or closing Cursor-owned children.
  - Remaining: no Tracker reconciliation evidence is retained.

## 4. Verify candidate and publication

- [ ] 4.1 Freeze clean integrated source and qualify exact candidate bytes, target packages and existing channels; obtain completed review evidence.
  - Remaining: release steps 4.1 to 4.4 require a frozen candidate, Woodpecker qualification and manual publication; the repository holds no such evidence.
- [ ] 4.2 Invoke established reviewed manual publication after all required gates pass; verify immutable tags and public asset bytes.
- [ ] 4.3 Run fresh public installed-consumer journeys and verify Homebrew, public first-party package/template consumption, docs and separate editor availability states.
- [ ] 4.4 Close requirements and Tracker records only against retained completed evidence; preserve unresolved stretch items explicitly.

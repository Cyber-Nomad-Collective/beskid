# Release case binding fragments (0.6.0)

One JSON fragment per implementation slice. `scripts/ci/freeze-release-cases-v06.mjs` merges them
into `scripts/ci/release-cases-v06.json`, resolves every declaration to byte offsets in the retained
source and writes the frozen manifest. Only the freeze tool edits `release-cases-v06.json` bindings;
hand edits to the manifest are rejected by the matrix test.

Fragment shape:

```json
{
  "schema_version": 1,
  "slice": "host",
  "cases": {
    "<case id>": {
      "execution": "installed_native" | "installed_host_harness",
      "target": "<corelib_tests target>",            // installed_native only
      "project": "compiler/corelib/beskid_corelib/tests/corelib_tests", // installed_native only
      "harness": "beskid_tests_release",             // installed_host_harness only
      "source_file": "<repo-relative .bd or .rs that declares every required test>",
      "required_test_ids": ["<declaration name>", "..."],
      "input": null | { "id": "bsol-corpus", "source_root": "beskid_bsol", "include": ["conformance", "schemas"], "corpus": "conformance" },
      "fixture": null | "beskid_release_fixture",
      "related_evidence": [ { "kind": "cargo_test", "crate": "...", "test_ids": ["..."] },
                            { "kind": "repository_gate", "path": "scripts/ci/vscode-gate.sh" } ],
      "profile_assertions": [ { "representation": "i8", "implementation": "manual", "direction": "import", "test_id": "..." } ],
      "obligation_assertions": [ { "kind": "ownership", "obligation": "borrowed_call", "test_id": "..." } ]
    }
  }
}
```

Rules enforced by the freeze tool:

- A case appears in exactly one fragment and must exist in the manifest `cases` list with the same
  `execution` kind; provisional ids are rejected.
- `source_file` must contain one declaration per required id: `test <id>` at a line start followed
  by `{` for Beskid, `#[test]` directly above `fn <id>(` with equal indentation for Rust.
- `required_test_ids` are the tests that must execute and pass on every target. Library-level tests
  that never touch the installed prefix belong in `related_evidence`, never in `required_test_ids`.
- A native case names exactly one `target`; a host case names exactly one `harness`.
- `input` names exactly `id`, `source_root`, `include` and `corpus`. Only the `include` top-level
  directories of `source_root` are archived deterministically as `input-<id>.tar`; the test process
  receives `BESKID_BSOL_CORPUS={input_root}/<corpus>`. One input id has one shape across all cases.
  The BSOL corpus input archives `beskid_bsol/conformance` and `beskid_bsol/schemas`, so native tests
  read cases at `$BESKID_BSOL_CORPUS/cases` and profiles at `$BESKID_BSOL_CORPUS/../schemas`.
- `fixture` names the Rust fixture binary exposed as `BESKID_V06_RELEASE_FIXTURE`.

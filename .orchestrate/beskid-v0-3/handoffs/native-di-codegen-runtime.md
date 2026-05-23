# Handoff — native-di-codegen-runtime (subplanner A2)

- **Track**: `native-di-codegen-runtime` (subplanner A2 of `beskid-v0-3`)
- **Branches**:
  - Superrepo: `orch/beskid-v0-3/native-di-codegen-runtime`
  - Compiler submodule: `orch/beskid-v0-3/native-di-codegen-runtime` @ `5b65195`
- **Status**: Done — native DI lowering enabled end-to-end with host launch test coverage.

## What landed

### Compiler (`5b65195`, parent `052d6e2`)

- `RUNTIME_CONTAINER_LOWERING_ENABLED` flipped to `true` in `beskid_codegen/src/lowering/composition_policy.rs`.
- Codegen lowering for `launch` / `with` in `beskid_codegen/src/lowering/composition/` (scope enter/leave, ctor wiring, plural inject).
- Runtime `RuntimeContainer` in `beskid_runtime/src/composition/` with LIFO `init`/`dispose` ordering.
- ABI builtins in `beskid_runtime/src/builtins/composition.rs` + `beskid_abi` symbol/spec registration.
- Tests: `beskid_tests/src/composition/{container,host_e2e,lowering}.rs` — 16 tests under `composition::` filter, including `host_with_two_scopes_plural_inject_reverse_dispose`.

### Superrepo

- Compiler submodule pointer bumped to `5b65195`.
- Platform-spec `language-meta/composition/dependency-injection/index.mdx` Implementation anchors updated to name real modules (no longer "in progress").

## Verification (this session)

```
cd compiler && cargo test -p beskid_tests composition:: -- --test-threads=1
# 16 passed; 0 failed

cd compiler && cargo test -p beskid_codegen -- --test-threads=1
# ok (no unit tests in crate; doc-tests empty)
```

Acceptance spot-checks:

| Criterion | Result |
| --- | --- |
| Lowering gate on; `launch`/`with` emit container setup | `composition::lowering::runtime_container_lowering_gate_is_on` PASS |
| Plural inject + reverse dispose | `composition::container::two_scopes_plural_inject_reverse_dispose` + `host_e2e::host_with_two_scopes_plural_inject_reverse_dispose` PASS |
| Spec Implementation anchors point at real modules | Updated in this commit |
| trudoc verify | Pending Wave-2 verifier run on branch |

## Recommended next step

Run `verify-native-di-codegen-runtime` (Wave 2 verifier) with full trudoc preset on this branch.

# Portable `Project.lock` research

Date: 2026-09-28
Scope: Beskid v0.5 portability design for `Project.lock`; read-only inspection of the compiler implementation and normative OpenSpec, plus first-party package-manager documentation/specifications.

## Finding

`Project.lock` v1 is checkout-specific. The serializer writes `CompilePlan.manifest_path` as `root_manifest`, and path dependencies serialize absolute `manifest`, `project`, and `source_root` values. `materialized_root` is usually relative to the consumer project, but `materialized_dependency_id` hashes the full manifest path, so a moved checkout changes the materialization directory too. Replay resolves relative `root_manifest` against the lock directory, but generated v1 files use absolute paths; ownership is then checked by canonical path equality plus project name. This correctly prevents replaying another project's lock, but makes relocating the same project fail that identity check.

Relevant implementation:

- `crates/beskid_analysis/src/projects/workflow/lockfile.rs`: v1 fields and encoding; strict whole-file parser; plan lock ownership check; frozen/locked synchronization.
- `crates/beskid_analysis/src/projects/workflow/prepare.rs`: serializes absolute path-dependency paths and relative materialization roots.
- `crates/beskid_analysis/src/projects/workflow/filesystem.rs`: materialization id is a hash of `manifest_path.to_string_lossy()` plus sanitized project name.
- Example generated lock: `corelib/beskid_corelib/Project.lock` contains `/Users/mikserek/...` roots from this worktree.

## Current OpenSpec boundary

The normative tooling capability is [`tooling--manifests-and-lockfiles--workspace-and-lock-contracts/spec.md`](../../openspec/specs/tooling--manifests-and-lockfiles--workspace-and-lock-contracts/spec.md). Its normative hub decisions say the hub owns workspace/lock rules and CLI lock mutations go through the CLI resolver. The detailed lock field and edge-case prose found in its embedded migrated article is explicitly marked informative source provenance; it describes v1 header/required fields, replay roots, duplicate rejection, and stable materialization for a given lock on a machine class, but is not itself a SHALL requirement.

The compiler capability is [`compiler--build-pipeline--dependency-workspace/spec.md`](../../openspec/specs/compiler--build-pipeline--dependency-workspace/spec.md). Its normative decision says the feature hub and articles are the primary contract; migrated article text says lock pins drive resolution and strict lock mode rejects missing/stale locks. [`compiler--resolution-and-projects--workspace-and-lock-contracts/spec.md`](../../openspec/specs/compiler--resolution-and-projects--workspace-and-lock-contracts/spec.md) likewise says lock pins are honored before CLI overrides. The tooling design-model article says path dependencies normalize under the consumer project root and that LSP may replay roots from a lock, but that article is also migrated provenance, not independently normative.

Therefore, making locks portable should be specified as an observable contract change in OpenSpec before implementation. Keep the existing guarantees that pins drive resolution, strict modes fail closed, the CLI is the mutation authority, and malformed/duplicate entries are rejected. Add explicit SHALL scenarios for relocation, path identity, source mutation/digest policy, and allowed path boundaries.

## First-party ecosystem facts

- Cargo says local `path` dependencies are relative to the manifest where declared and must identify the exact dependency manifest directory; its lockfile preserves resolved versions and `--locked`/`--frozen` prevent lock updates. Sources: [Cargo path dependencies](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html#specifying-path-dependencies), [Cargo dependency resolution and lock behavior](https://doc.rust-lang.org/cargo/reference/resolver.html#lock-file).
- Go's module reference makes local replacement paths explicit `./` or `../` paths, interpreted as the replacement module root, and requires a module manifest there. The same reference explains that `go.sum` authenticates downloaded module archive/content hashes, while local directory replacements may leave it absent. Source: [Go Modules Reference: replace, workspaces, and go.sum](https://go.dev/ref/mod#replace-directive).
- pnpm's workspace protocol makes workspace membership explicit and fails resolution if a requested workspace package is absent or the version does not match. Its lockfile v9 model separates relative-path importers from package resolution records. Sources: [pnpm workspaces](https://pnpm.io/workspaces), [pnpm lockfile v9 specification](https://github.com/pnpm/spec/blob/master/lockfile/9.0.md).
- npm's first-party package-lock documentation says lockfile package locations are relative to the project root; registry/git resolutions have stable source identifiers and integrity/commit data, while link entries represent links separately. Source: [npm package-lock.json format](https://github.com/npm/cli/blob/latest/docs/lib/content/configuring-npm/package-lock-json.md).

These sources establish ecosystem conventions, not a Beskid requirement. Inference: the common portable shape is stable dependency identity plus root-relative package locations and content/version provenance where the source is immutable. None of these sources demonstrates that a generated compiler/cache directory belongs in a portable lock; npm's own separation between root-relative lock package keys and local install tree is a relevant precedent.

## Recommended v0.5 path and identity rules

1. Treat the lock file's directory (the project root) as the sole path base. Encode the root manifest as a normalized relative path such as `corelib.bproj`; never serialize the checkout's absolute root. Define `/` as the lockfile separator on every host and normalize `.` segments when writing.
2. Identify dependencies by logical name plus source kind and canonical manifest-relative identity. For path dependencies, store a normalized path relative to the consumer project root (or a declared workspace root if workspace identity is intended), then resolve it against that root on load. For registry dependencies, use registry identity, package identity, resolved version, and artifact digest. Do not use absolute paths as identity or as hash input.
3. Derive materialization destinations from stable logical identity (dependency name plus source identity, or a stable digest of that identity), under a compiler-owned relative directory such as `obj/beskid/deps/src/`. The destination must remain inside that directory after normalization and symlink checks. Location-dependent build output should remain derived state, not source identity.
4. Define the portability boundary for path dependencies. A relative path remains portable when the project and dependency preserve that relative layout; it cannot make an external dependency available in a fresh checkout. Prefer failing closed when a lock names a missing path or when recomputed manifest resolution disagrees with the lock. Do not silently fall back from a missing pinned path to registry resolution.
5. Treat `Project.lock` as untrusted input. Parse a versioned schema strictly (unknown version/key, duplicate fields, invalid encoding, or malformed entries fail); recompute expected dependency identities from manifests and compare before replay. Reject absolute paths in portable fields; reject destination traversal; canonicalize source paths and apply the documented source-root boundary policy before reading/copying. A lockfile cannot authorize arbitrary filesystem reads/copies.
6. Decide whether local path sources are mutable. A path alone pins location, not bytes. If reproducibility requires byte identity, record a deterministic tree digest over the declared package inputs (with explicit exclusions and symlink treatment) and fail on mismatch; otherwise document that path dependencies are live workspace source and the lock only pins graph identity. Registry artifacts should continue to require cryptographic digest verification.
7. Preserve ownership without binding to machine paths. A relative root-manifest identity plus project/workspace name and manifest-derived dependency graph can identify the lock owner across relocation. If protection against a copied lock from a same-name project is required, use a stable manifest/workspace identity digest over normalized manifest inputs, not a filesystem location.

## v1 compatibility decision

Do not interpret an old absolute-path v1 lock as portable by guessing the relocation. For a versioned transition, either regenerate v1 from manifests in update mode or introduce a new format version whose portable identity rules are explicit. Under `--locked`/`--frozen`, missing, stale, incompatible, or mismatched lock identity should remain a hard error. This is an inference from the existing strict-mode contract and package-manager versioning patterns, not a direct ecosystem mandate.

## Sources

All external evidence above is first-party: Rust Cargo Book, Go Modules Reference, pnpm's documentation and lockfile specification, and npm CLI documentation. The recommendations are design inferences for Beskid and should be promoted through OpenSpec changes before implementation.

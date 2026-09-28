# Portable Project.lock v2 design

Date: 2026-09-28

## Intent and boundary

A committed `Project.lock` must retain the same meaning when the whole checkout
is moved and when it is used on Linux, macOS, or Windows with the verified
Corelib installed at a different machine-local path. This includes the Corelib
and test-project locks in the v0.5 source tree. Independently moved external
path dependencies remain portable only if their declared relative layout is
preserved; a missing dependency is an error, not a reason to select a registry
package instead. Local path sources remain live source, not byte-pinned
archives. Registry artifacts are immutable inputs pinned by version and SHA-256.

The current v1 serializer records absolute checkout and Corelib paths, and its
materialization ID hashes an absolute manifest path. A source relocation thus
rewrites tracked locks and prevents source-bound release attestation. The
analysis and first-party package-manager precedents are in
[`docs/research/2026-09-28-portable-project-locks.md`](../../research/2026-09-28-portable-project-locks.md).
This design uses relative project/workspace identity like the documented
[npm lock format](https://docs.npmjs.com/files/package-lock.json/) and explicit
local-path resolution like [Go modules](https://go.dev/ref/mod#replace-directive)
and [pnpm workspaces](https://pnpm.io/workspaces). Those are precedents, not
Beskid authorities; OpenSpec will define the Beskid contract.

## Approaches considered

1. **Reinterpret v1 paths.** This requires the least code but makes an old
   absolute-path v1 lock ambiguous after relocation and silently changes the
   meaning of the existing format. Rejected.
2. **Versioned v2 with source anchors (selected).** Preserve the lock's
   materialized-root hint and graph check, but replace machine paths with
   explicit source kind and portable path identity. Old v1 is migrated only by
   an explicit lock/update operation.
3. **Identity-only lock.** Re-resolve every source path from manifests on each
   use. This removes the LSP materialized-root replay contract and requires a
   broader resolver rewrite. Deferred.

## On-disk contract

The first line is exactly `# Project.lock v2`. The lock contains
`root_manifest`, `project_name`, and sorted dependency entries. Each entry has
`name`, `source` (`path`, `corelib`, or `registry`), `project`, `manifest`,
`source_root`, and `materialized_root`. Registry entries additionally require
`registry`, `resolved_version`, and `artifact_digest=sha256:<64 lowercase hex>`.
The existing line-oriented representation is retained. Values encode UTF-8
bytes: ASCII letters, digits, and `._/:-@+` appear literally; every other
byte is `%HH` with uppercase hex. The parser rejects malformed UTF-8,
unnecessary escapes of literal-safe bytes, lowercase hex escapes, raw
delimiters, duplicate/unknown fields, and any noncanonical value.
Serialization is deterministic. The v2 parser never silently treats a v1
entry as v2.

All v2 file paths use `/` separators, independent of host OS. `root_manifest`
is relative to the lock directory and may not escape it. `project` is relative
to the lock directory for `path` and `registry`, or to the verified installed
Corelib workspace root for `corelib`. `manifest` and `source_root` are relative
to that resolved project. `materialized_root` is relative to the lock directory
and must resolve beneath `obj/beskid/deps/src`. Absolute paths, drive prefixes,
UNC roots, empty path segments, and unsafe traversal are rejected. A `path`
project may contain normalized `..` segments to reach an explicitly declared
external dependency; the resolver must still match the current manifest graph
and require the target to exist. The `corelib` source kind is minted only for
dependencies actually resolved from the verified canonical Corelib installation,
not from a lockfile claim or a directory with a matching name.

The `project`/`manifest`/`source_root` triple is a portable description, not a
grant of filesystem authority. On load, resolve it against its declared base,
canonicalize existing paths, compare to the current `CompilePlan`, and reject
any discrepancy before replay or copying. Materialized source roots are used
only after canonical containment beneath the compiler-owned dependencies
directory. Symlinks cannot turn a relative lock path into an outside source or
destination. A copied same-name lock can be used only if its whole dependency
identity matches the newly resolved graph; it cannot authorize Corelib service
code or other privileged sources.

## Materialization and registry resolution

The materialized directory name is derived from a canonical logical tuple:
dependency name, source kind, and normalized portable source identity. SHA-256
of a length-delimited encoding of that tuple supplies a stable 128-bit suffix;
the preparation step rejects any duplicate destination in a single graph.
Neither machine paths nor Rust's process/platform-dependent `DefaultHasher`
enter the identity. Registry identity additionally includes registry alias,
package name, resolved version, and artifact digest. Build output locations
remain derived state, not identity.

When a valid v2 lock exists, ordinary and strict resolution prefer its pinned
registry version and verify the downloaded artifact's SHA-256 before
extraction. An unavailable or mismatched pinned artifact fails closed; it does
not fall back to a newer version. `beskid update` deliberately selects new
versions and rewrites the lock. A path dependency's contents may change without
a lock change, as with a live workspace source; its manifest-derived identity
and relative location remain checked. Any future byte pinning of local source
trees requires a separate explicit contract.

## Migration and command behavior

`beskid lock` and `beskid update` re-resolve manifests and can replace an
existing v1 lock with v2. They do not infer a new path from a stale v1 absolute
path; they use the current graph. `build`, `run`, `test`, LSP replay, and other
non-update consumers do not silently migrate v1. A present v1 lock causes an
actionable migration diagnostic; `--locked` and `--frozen` fail before writing.
Unknown headers and malformed v2 locks always fail. A valid v2 lock that no
longer matches the graph is stale: non-update consumers do not repair it
silently, and strict modes remain read-only. If no lock exists, a normal
unlocked build may create v2 from the current graph; `--locked` and `--frozen`
still reject a missing lock. CLI commands are the only lock mutation
authority.

LSP may replay a v2 materialized root only after ownership, graph identity,
and containment checks. If the materialized directory is absent, it falls
back to current resolved source roots rather than claiming a cache hit. The
project explorer displays resolved current paths, not raw anchor tokens.

## Error handling and verification

The compiler should distinguish old-version migration, malformed encoding,
stale graph, missing declared path, unavailable pinned registry artifact,
digest mismatch, and outside-root materialization. Each error names a safe
remedy without echoing credentials or treating a lock as trusted authority.

The test-first implementation will prove: deterministic v2 serialization;
stable materialization identity after relocating the same checkout; one v2
lock working with distinct verified Corelib roots; Linux/macOS/Windows path
handling; explicit v1 migration and read-only strict-mode rejection; pinned
registry version and digest verification; rejection of copied, traversing,
symlink-escaping, duplicate, and malformed locks; and safe LSP fallback.
Fixtures will exercise real `beskid lock`, `build`, `run`, and `test` flows where
applicable. The final gate is the compiler workspace, Corelib/runtime matrices,
strict OpenSpec validation, and exact-source three-platform release evidence.

## Specification and rollout

Before implementation, add normative SHALL requirements and scenarios to the
OpenSpec workspace/lock capability. The capability must describe v2 identity,
relocation, canonical Corelib anchoring, registry pinning, strict migration,
and replay safety; v1 provenance remains historical, not an accepted portable
format. Regenerate the catalog only in the authorized integrated release
branch and run strict validation. Commit compiler and Corelib fixture changes
on their isolated branches, then update the superrepo gitlinks and run the
release matrix on the exact resulting commits. No merge to main or publication
is implied by this design document alone.

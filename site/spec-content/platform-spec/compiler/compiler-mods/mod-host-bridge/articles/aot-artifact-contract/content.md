---
title: Mod host bridge - AOT artifact contract
description: On-disk mod artifact layout, cache keys, export descriptor schema,
  and load-failure diagnostics.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-20
---

This article is the normative **AOT artifact contract** for `type: Mod` packages. It complements **[Mod host bridge / design model](./design-model/)** lifecycle steps and **[Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/)** contract discovery.

## Artifact directory layout

Hosts **must** store each built mod artifact under the workspace **object store** using a content-addressed layout:

```text
<workspaceRoot>/.beskid/obj/mods/<packageId>/<artifactKey>/<targetTriple>/
  mod.o              # or platform archive (mod.a / mod.so) — native object for AOT load
  mod.descriptor.json
```

| Path segment | Meaning |
| --- | --- |
| `<packageId>` | Stable package identity from lock/manifest (normalized, case-sensitive as resolved). |
| `<artifactKey>` | Lowercase hex SHA-256 of the **cache key tuple** (see below). |
| `<targetTriple>` | LLVM-style triple string for the built artifact (e.g. `aarch64-apple-darwin`). |

Registry-fetched mods use the same layout under the workspace object store after materialization; global package caches **may** mirror the tuple but the host **must** treat the workspace path above as authoritative for an active compilation.

## Cache key tuple

Rebuild is required when any component of the tuple changes:

| Field | Source |
| --- | --- |
| `lock_hash` | Hash of relevant lockfile bytes for the mod package slice. |
| `mod_source_hash` | Hash of mod project sources + `Project.proj` / `project.mod` bytes. |
| `target_triple` | Active host target for AOT link/load. |
| `compiler_version` | Reference compiler version token (CLI `--version` / embedded build id). |

**`artifactKey`** = `SHA256(canonical_json({ lock_hash, mod_source_hash, target_triple, compiler_version }))`.

`beskid mod rebuild` **must** invalidate entries whose tuple diverges; `beskid mod clean` **must** remove `.beskid/obj/mods/` (or the documented subset for named projects).

## Export descriptor (`mod.descriptor.json`)

The sidecar **must** be UTF-8 JSON. Hosts **must** reject artifacts when the descriptor is missing, unreadable, or fails schema validation (**E1821–E1835**).

### Schema (v1)

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `schemaVersion` | integer | yes | Must be `1` for this contract revision. |
| `packageId` | string | yes | Matches resolved package id. |
| `packageVersion` | string | no | Registry-assigned version when known. |
| `modSourceHash` | string (hex) | yes | Must match cache tuple `mod_source_hash`. |
| `lockHash` | string (hex) | yes | Must match cache tuple `lock_hash`. |
| `targetTriple` | string | yes | Must match directory `<targetTriple>`. |
| `compilerVersion` | string | yes | Must match cache tuple `compiler_version`. |
| `objectFile` | string | yes | Relative path within the artifact directory (typically `mod.o`). |
| `registrations` | array | yes | Contract export table (may be empty only when the mod exports no contracts). |

Each **`registrations[]`** element:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `contractId` | string | yes | Stable contract name (e.g. `Beskid.Compiler.Collect.Collector`). |
| `typeId` | string | yes | Public Beskid type implementing the contract in the mod assembly. |
| `entrySymbol` | string | yes | AOT export symbol used to invoke the contract entrypoint. |

Example:

```json
{
  "schemaVersion": 1,
  "packageId": "compiler_sdk_test_mod",
  "packageVersion": "0.0.0-local",
  "modSourceHash": "a1b2…",
  "lockHash": "c3d4…",
  "targetTriple": "aarch64-apple-darwin",
  "compilerVersion": "0.2.0-dev",
  "objectFile": "mod.o",
  "registrations": [
    {
      "contractId": "Beskid.Compiler.Collect.Collector",
      "typeId": "TestMod.DemoCollector",
      "entrySymbol": "beskid_mod_entry_TestMod_DemoCollector"
    }
  ]
}
```

Hosts **may** also read an embedded export table inside the native object, but **`mod.descriptor.json` is authoritative** for discovery when present.

## Load sequence (`mod.load`)

1. Resolve transitive `Mod` nodes from `CompilePlan`.
2. Locate artifact directory for `(packageId, artifactKey, targetTriple)`.
3. Verify `modSourceHash`, `lockHash`, `targetTriple`, and `compilerVersion` against the active tuple.
4. Load native object and parse `registrations`.
5. Bind `(contractId, typeId, entrySymbol)` tuples into the mod host schedule before `mod.collect`.

Any failure **must** emit a diagnostic from **E1821–E1835** and **must not** partially schedule contracts.

## Load-failure diagnostics (**E1821–E1835**)

| Code | When emitted |
| --- | --- |
| **E1821** | Artifact directory or `objectFile` missing. |
| **E1822** | `mod.descriptor.json` missing or not valid UTF-8 JSON. |
| **E1823** | `schemaVersion` unsupported or required field absent. |
| **E1824** | `modSourceHash` or `lockHash` does not match active cache tuple (stale artifact). |
| **E1825** | `targetTriple` does not match host compilation target. |
| **E1826** | `compilerVersion` does not match active compiler build. |
| **E1827** | Native object load/link failed (platform loader error). |
| **E1828** | `entrySymbol` not found in loaded object export table. |
| **E1829** | Duplicate `(contractId, typeId)` registration in one artifact. |
| **E1830** | `registrations` empty but mod package declared required contracts in manifest metadata. |
| **E1831** | Capability required at load time not granted in `project.mod.capabilities`. |
| **E1832** | `maxGeneratorRounds` exceeded during host compilation (runtime policy). |
| **E1833** | Sandbox / FFI bridge violation during mod bootstrap. |
| **E1834** | Artifact built for different `packageId` than resolved graph node. |
| **E1835** | Catch-all mod-host bootstrap failure when no more specific **E1821–E1834** code applies. |

Register each code in `diagnostic_kinds.rs` when implementation lands; extend this table if new load paths need distinct identities.

## Scheduling-conflict diagnostics (**E1851–E1870**)

After **`mod.load`** but **before** **`mod.collect`**, the host **must** validate cross-artifact and cross-registration consistency. Failures in this band short-circuit scheduling and are reported as **`ModHostDiagnostics`** in `compiler/crates/beskid_analysis/src/mod_host/diagnostics.rs`.

| Code | When emitted |
| --- | --- |
| **E1851** | Same `(contractId, typeId)` is provided by multiple mod artifacts. |
| **E1852** | Two distinct artifacts export the same `entrySymbol` for different `(contractId, typeId)` tuples. |
| **E1853** | Unknown `contractId` value in a registration (not a recognized SDK contract suffix: `Collector`, `Generator`, `AttributeGenerator`, `Analyzer`, `Rewriter`). |
| **E1854** | `Rewriter` registration without an attached `Analyzer` registration in the same artifact. |
| **E1855** | Catch-all scheduling-stage failure when no narrower **E1851–E1870** code applies. |
| **E1856–E1870** | Reserved for future scheduling-stage failures. |

These diagnostics carry artifact-level locations (descriptor sidecar path or manifest path) rather than Beskid source spans because the conflict is detected on the loaded registration table, not on user source. Implementations **must** report **all** issues found in a single load pass deterministically before aborting.

## Related contracts

- **[Contract discovery](./design-model/#contract-discovery)** — how registrations map to host scheduling.
- **[Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/design-model/)** — full **E1801–E1899** band.
- **[Workspace resolution](/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/design-model/)** — graph discovery before load.

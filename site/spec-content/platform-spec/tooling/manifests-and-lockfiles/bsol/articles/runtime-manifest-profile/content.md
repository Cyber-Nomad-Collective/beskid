---
title: Runtime manifest profile
description: Schema profile and authority for compiler/runtime_manifest.bsol.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-07
---

## Authority

The compiler runtime ABI tables are authored in **`compiler/runtime_manifest.bsol`**. This file replaces the former `runtime_manifest.toml` format (hard cutover).

Build-time consumers load the manifest via `beskid_manifest::load_manifest`, which:

1. Parses Bsol surface syntax (`parse_bsol_document`)
2. Validates against embedded profile **`runtime.v1`**
3. Lowers to `ManifestRoot` for codegen into ABI, host, runtime, and analysis registries

## Profile rules (`runtime.v1`)

| Block kind | Cardinality | Purpose |
| --- | --- | --- |
| `manifest` | exactly one | `abi_version` (u32) |
| `profile "name"` | many | Runtime profile owners (`minimal`, `std`, …) |
| `kernel` | many | Kernel symbol registration |
| `dispatch_usize` / `dispatch_ptr` / `dispatch_unit` / `dispatch_i64` | many | Typed dispatch table entries |
| `intrinsic` | many | Intrinsic symbol paths |

Schema source: `compiler/crates/beskid_bsol/schemas/runtime.v1.bsol`.

## Example

```bsol
manifest {
  abi_version = 4
}

profile "minimal" {
  owners = [language]
}

kernel {
  symbol = alloc
  name = Alloc
  params = [usize, ptr]
  returns = ptr
  injected = true
  beskid_path = [__alloc]
}

dispatch_i64 {
  tag = 1
  dispatch_key = print_i64
  name = PrintI64
  params = [i64]
  returns = unit
  injected = true
  beskid_path = [__print_i64]
  owner = language
}
```

## Generated artifacts

`beskid_manifest` codegen emits Rust sources consumed by:

- `beskid_abi` (dispatch tags, symbols, builtins)
- `beskid_analysis` (builtins registry)
- `beskid_host`, `beskid_runtime`, `beskid_engine`, `beskid_runtime_bridge`

Generated file banners reference `runtime_manifest.bsol` as the source of truth.

## Verification

```bash
cd compiler && cargo test -p beskid_manifest
cd compiler && cargo test -p beskid_tests abi::contracts
```

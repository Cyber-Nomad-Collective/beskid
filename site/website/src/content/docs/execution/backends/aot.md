---
title: "AOT backend specification"
description: AOT object emission, runtime bundling, and linker behavior.
---

## Purpose
This chapter defines AOT backend responsibilities in Beskid's execution stack.
It focuses on architecture boundaries, not toolchain automation policy.

## AOT scope
- Consume lowered artifacts produced by shared frontend/lowering.
- Emit target object code through `ObjectModule` semantics.
- Orchestrate runtime bundling and final linkage for production artifacts.
- Respect runtime ABI ownership and boundary invariants.

## AOT pipeline model
1. Build target ISA from target triple.
2. Declare runtime ABI imports from the shared runtime symbol surface.
3. Define lowered functions and data objects.
4. Emit object file.
5. Link final output (exe/shared/static) with bundled runtime.

## Runtime bundling policy
- Final executable and library outputs bundle Beskid runtime components.
- Runtime bundling is part of AOT backend behavior, not userland feature logic.
- Runtime ABI version and symbol surface remain authoritative for compatibility.

## Output and export rules
- Export behavior is derived from language visibility and explicit export policy.
- Internal symbols are not part of public runtime ABI.
- Entrypoint requirements are backend policy and must align with architecture boundary docs.

## Non-goals
- Defining language-level semantics (owned by `docs/spec`).
- Defining platform syscall policy (owned by runtime boundary docs).
- Defining memory model internals (owned by `docs/execution/memory`).

## See also
- `docs/execution/architecture/jit-aot-boundary.md`
- `docs/execution/runtime/syscalls-and-abi-boundary.md`
- `docs/execution/ir-and-lowering/clif-lowering.md`

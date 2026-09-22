## Context

An executable has two different boundaries that must not be conflated:

1. A logical Beskid application function selected by the AOT request. The
   language default remains `Main`.
2. A target-native CRT startup function. The runtime-kit adapter owns `main`
   for Linux x86-64 and macOS arm64, and `wmain` for Windows x86-64.

The selected logical function must be made reachable through the one private
host-facing boundary named `beskid_program_main`. The target adapter performs
CRT-required setup, including the existing argument handoff, and invokes that
private boundary. It is not a user interop export.

## Decisions

### One private executable boundary

AOT executable lowering maps exactly one selected logical application function
to `beskid_program_main`. That symbol is private to generated code and the
validated runtime-kit adapter. The program function is neither a generated
`main`/`wmain` implementation nor an implicit `[Export]` function.

The adapter record is authoritative for the target-native startup spelling and
the private program boundary. A record with any other `program_entry` value is
incompatible with ABI-v5 and is rejected before object publication or native
linking. The compiler must not guess from a target triple, synthesize a
fallback alias, or silently substitute a requested entry function.

### CRT ownership

For executable output, the installed ABI-v5 runtime kit owns the target CRT
entrypoint and calls `beskid_program_main` after its mandated initialization.
On Linux x86-64 and macOS arm64 that symbol is `main`; on Windows x86-64 it is
`wmain`. Beskid-generated application objects must not define either native
startup symbol. This avoids duplicate-definition behavior and leaves ABI- and
platform-specific startup mechanics in one target adapter.

### Public exports stay public-policy controlled

`[Export]` remains the only path that asks the compiler to publish a user
function as a public interop symbol. A selected logical application entry has
no implied public linkage, and an explicit export remains subject to the
normal export attribute, ABI, signature, and symbol-collision policy. AOT
entry adaptation must not use the public-export table as a substitute for the
private `beskid_program_main` boundary.

### Custom Start is an AOT request only

The existing AOT API may accept an explicit request for `Start`; it selects a
function named `Start` for that compilation only. It does not change the
language default from `Main`, introduce a source-level alias, affect JIT
entry selection, or request a native `Start` linker symbol. Missing or
incompatible requested entries fail with a diagnostic; they must not fall back
to `Main` or another alias.

## Rejected alternatives

- Emitting generated `main` or `wmain`: duplicates the CRT-owned target
  startup boundary and splits ownership of initialization.
- Treating `Start` as a language-level synonym for `Main`: makes ordinary
  source resolution depend on an AOT-only compatibility choice.
- Publishing `beskid_program_main` through the user export mechanism: exposes
  a host boundary as application interop and bypasses public export policy.
- Accepting a mismatched adapter program alias: permits a runtime kit and
  generated executable to disagree about the callable boundary.

## Migration and rollback

Implement the contract by validating the manifest adapter record, emitting the
private program boundary once for executable AOT output, and auditing the
generated object plus runtime-kit symbols. Remove any native-startup emission
or alias fallback only after replacement coverage proves the adapter path on
all supported targets. If a runtime kit cannot satisfy this contract, that
target must remain unavailable for executable AOT; rollback is to a coherent
prior toolchain release, never to a compatibility alias.

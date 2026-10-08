## Why

The spec makes items private to their module by default, but it does not state the scope of a struct field. Before this change the compiler read a field without `pub` from any source unit, and it rejected only a short list of runtime fields (process resources, the `Deadline` sample and socket handles). The Book says that members are private by default. The coordinator ruled on 2026-10-07 that a field follows the item rule: a field without `pub` is private to its declaring module. A module is the logical module of the source file, so the declaring source unit is the privacy boundary.

## What Changes

- A field without `pub` is readable and constructible only in the source unit that declares its type. The inline methods of the type are in that unit.
- A read, a projection chain (`a.b.c`) or a struct literal in another source unit that uses such a field fails with **E1211** "inaccessible struct field". The help tells the author to mark the field `pub` in its declaring type.
- A struct literal in another source unit cannot build a type that has a private value field, because the literal must supply every field.
- `extend type` bodies keep **E1511** for private fields of the extended type.
- Exact compiler-owned exceptions stay: the canonical Network facade and Process source read `Deadline.monotonicNanos`; the canonical Network resource authority builds the `handle` of the canonical socket types; the canonical Mutex facade builds and reads `MutexGuard.mutexHandle`. The compiler proves each exception from attested source identity, never from a type name alone.
- Compiler SDK request, workspace, compilation, catalog and generated syntax-node fields that Mods read or build are now `pub`. Corelib data records that other Corelib units read or build are now `pub`.
- **BREAKING**: source that reads or builds a non-`pub` field of a type from another source unit stops compiling.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `language-meta--program-structure--modules-and-visibility`: adds the default field privacy requirement.

## Impact

Compiler: `beskid_queries` uses one field visibility predicate for field reads, projection chains and struct literals; member legality reports E1211 first. `beskid_analysis` reports the same E1211 in the front-end checker. `beskid_abi` attests the extra canonical Network and Mutex units. `beskid_ast_reflect_gen` emits `pub` fields for syntax-node mirrors and query records.

Corelib: compiler SDK and shared data records get `pub` fields. The Network resource and Mutex guard internals stay private.

Migration: mark a field `pub` when another source file must read it or build the type. Keep implementation detail fields private and expose a function instead.

Catalog: run `validate-standard` and regenerate `openspec/catalog.json` after this change is applied.

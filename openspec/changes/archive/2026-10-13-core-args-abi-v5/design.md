## Context

The canonical `Core.Args` specification still described the retired
`__args_all` builtin. ABI-v5 needs a minimal, private service boundary that
provides executable arguments without making the host process, a Rust runtime
router, or a JIT global ambient authority. This change defines the contract
before implementation so Corelib, manifest generation, native adapters, and
execution engines share one source of truth.

## Source of truth and security boundary

`openspec/specs/core-library--foundation-and-primitives--core-args/spec.md` is
the sole normative source after this change is applied. This change directory
is a proposed delta, and `openspec/catalog.json` is generated provenance only.

The only private Core.Args services are exactly
`__args_count() -> i64` and `__args_get(i64) -> string`. Their authority is
granted only to byte-identical `Core/Args/Args.bd` at the canonical physical
Foundation path. The compiler must reject copied, symlinked, altered, and
user-authored sources without emitting an ABI import or choosing a runtime
fallback. The services are manifest-owned ABI-v5 adapter bindings, not generic
intrinsics: ISLE special cases, JIT host registrations, Rust routers, raw
imports, and ambient globals are prohibited.

This makes process arguments a narrow Corelib capability rather than an
unbounded host authority. It also preserves the single implementation path:
canonical source authority produces generated ABI facts, which select generated
target adapters.

## Data ownership and bounds

`__args_count` describes one immutable ordered vector. `__args_get` accepts
only an index in `0..count`; a direct invalid generated binding reports the
stable `Core.Args argument index is out of range` failure. `Core.Args.Get`
checks its public optional-access bounds before calling the private service and
returns `None` for invalid indices.

Every valid get result is a managed UTF-8 string independent of native scratch
storage and later calls. `All` enumerates `0..Count()` through the count/get
pair and may retain every result. Returning a borrowed native buffer, reusing a
managed value whose contents can change, or reintroducing `__args_all` would
violate this ownership boundary.

## AOT and JIT execution architecture

For AOT executables, a manifest-owned target entry adapter captures the process
vector before Beskid `Main` runs and publishes it only to the generated Args
services. The production lowering remains `TypedProgram → CodegenInput → ISLE
→ verifier-clean CLIF`; this change adds no alternate lowering or dispatch
route.

For JIT, the public execution API explicitly receives the argument vector
before an entrypoint that uses `Core.Args` can execute. Missing injection fails
with `Core.Args requires explicit JIT arguments`; host-process inheritance,
ambient state, and empty-vector substitution are forbidden. Shared and library
outputs cannot truthfully provide executable arguments and fail with
`Core.Args requires executable arguments` rather than fabricate a vector.

## Target semantics and provenance

Linux x86-64 and macOS arm64 preserve the native ordered process arguments.
Windows x86-64 decodes its command line from UTF-16 to UTF-8 with an explicit
per-unpaired-code-unit policy: scan left to right, consume an immediately
following high/low surrogate pair as one scalar, and replace every high or low
surrogate not consumed by such a pair with one U+FFFD. Every code unit is
consumed exactly once; it is neither dropped nor interpreted as bytes. The
multi-unit fixture `[0x0041, 0xD800, 0xD800, 0xDC00, 0xDC00, 0x0042]` therefore
produces `A\u{FFFD}\u{10000}\u{FFFD}B` (UTF-8 bytes
`41 EF BF BD F0 90 80 80 EF BF BD 42`). All executable vectors include `argv[0]`.

The ABI-v5 manifest generates exactly one binding for each selected service on
each of Linux x86-64, macOS arm64, and Windows x86-64. A claimed target requires
installed debug and release kit evidence that the generated binding and target
provenance agree. Handwritten allowlists, inferred bindings, and undeclared
imports are rejected.

## Observability and testing

Conformance tests must cover source-authority denial (copied, symlinked,
altered, and user sources), public and direct private bounds behavior, managed
value retention, `argv[0]`, Windows replacement conversion, explicit and
missing JIT injection, shared/library denial, and generated debug/release kit
provenance on all three targets. Compiler and kit evidence should identify the
canonical source authority, selected ABI binding, target, profile, and manifest
provenance without logging process argument contents.

## Rollback and deleted legacy path

The contract is staged before compiler/runtime delivery. If a target cannot
meet it, the target remains unsupported for Core.Args and must not publish a
fallback. A later rollback restores a complete prior toolchain release; it does
not reintroduce `__args_all`, a raw import, an ambient vector, or an
undocumented compatibility adapter.

After the direct ABI-v5 replacements and their behavior/provenance tests pass,
implementation deletes the legacy `__args_all` ABI declaration, generated
adapter/import paths, and all compatibility fallbacks. The task list keeps that
deletion separate from this contract change so no legacy path is removed before
the new path is proven.

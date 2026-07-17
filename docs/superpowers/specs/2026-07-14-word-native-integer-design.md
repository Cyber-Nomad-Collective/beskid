# `word` Native Integer Design

**Decision:** Beskid source uses the lowercase primitive `word` for an unsigned pointer-width machine value. ABI-v5 metadata, generated C headers, and Rust implementation details retain `usize` as their established wire/layout spelling.

## Boundary

`word` is a source-language primitive, not a new runtime ABI type. Semantic typing maps it to the target pointer width, and ISLE maps it to the target native integer CLIF type. Manifest declarations that currently expose `usize` continue to describe the same width and layout; the compiler translates the canonical runtime source spelling at the typed intrinsic boundary.

## Trusted runtime use

Canonical runtime code may use `word` in approved intrinsic declarations and calls such as allocation sizes, pointer offsets, root counts, and trap message lengths. User packages cannot declare or invoke runtime intrinsics, regardless of whether they can use `word` in ordinary typed code.

## Compatibility and verification

Existing primitive spellings remain unchanged. Parsing, stale-generation semantic facts, ABI signature checking, ISLE lowering, and runtime-kit metadata tests must prove that `word` is pointer-width on each supported target while the generated ABI continues to use `usize`.

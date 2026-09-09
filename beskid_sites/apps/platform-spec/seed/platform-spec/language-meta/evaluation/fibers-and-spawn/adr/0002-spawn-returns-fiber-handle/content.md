import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Authors need a single cooperative concurrency entry keyword with an explicit handle for cancellation and join.

## Decision

| Rule | Detail |
| --- | --- |
| Keyword | `spawn` introduces a child fiber |
| Type | Expression **must** type-check to a `Fiber<T>` handle for the entry return type `T` (not `T` directly) |
| Result | `spawn` **must not** return the entry value; use `Join` for `Result<T, FiberError>` |
| Contract | The handle shape is the `corelib_concurrency` `Fiber<T>` type required by lowering |

## Consequences

Parser, semantic analysis, and codegen share one spawn contract with the concurrency package.

## Verification anchors

`compiler/crates/beskid_analysis/`; `compiler/crates/beskid_codegen/` spawn lowering; [Concurrency package](/platform-spec/core-library/concurrency/concurrency-package/).

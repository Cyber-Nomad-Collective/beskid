import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Developers run from superrepo, installed CLI, or CI without divergent roots.

## Decision

| Rule | Detail |
| --- | --- |
| `BESKID_CORELIB_ROOT` | Points at root containing `beskid_corelib/Project.proj` |
| Walk | Ancestor search for `compiler/corelib/beskid_corelib` |
| Bundle | `beskid_cli` `ensure_corelib_ready` materializes embedded tree |

## Consequences

Missing roots fail fast with resolver diagnostics.

## Verification anchors

`corelib_runtime.rs`; `resolver.rs` tests.

import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

IDE analysis must match CLI compilation attachment.

## Decision

| Rule | Detail |
| --- | --- |
| CLI | `ensure_corelib_ready` before commands |
| LSP | `CompilationContext::try_for_analysis_path_with_graph_options` |

## Consequences

Diagnostic drift between CLI and LSP indicates a resolver bug.

## Verification anchors

LSP workspace tests; `corelib/compile.rs`.

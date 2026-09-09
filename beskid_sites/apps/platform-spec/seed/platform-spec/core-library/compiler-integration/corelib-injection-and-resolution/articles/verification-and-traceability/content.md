import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Test matrix

| Requirement | Location |
| --- | --- |
| Host compile with implicit corelib | `compiler/crates/beskid_tests/src/projects/corelib/compile.rs` |
| Workspace layout / shards | `compiler/crates/beskid_tests/src/projects/corelib/layout.rs`, `mod.rs` |
| Parser opt-out rejection | `projects/parser.rs` tests |
| Resolver path fallback | `resolver.rs` + graph integration tests |

## Traceability

Changes to `ENV_CORELIB_ROOT`, discovery walk, or shard cycle guards **must** update this bundle and **[Corelib discovery and packaging](/platform-spec/core-library/compiler-integration/corelib-discovery-and-packaging/)** together.

## CI

Compiler pipeline publishes **`corelib`** to pckg using the same aggregate tree injection relies on—publish failures often indicate layout drift before host apps break.

import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



High-level semantic algorithm:

1. Collect resolved declarations and references from resolver outputs.
2. Execute staged semantic rules over definitions, expressions, and contract items.
3. Normalize findings into issue kinds from `diagnostic_kinds.rs`.
4. Attach source location and contextual message payloads.
5. Emit diagnostics through analysis services to CLI/LSP pipelines.

The deterministic contract is important for test stability: the same input project must produce the same set and ordering of semantic diagnostics.

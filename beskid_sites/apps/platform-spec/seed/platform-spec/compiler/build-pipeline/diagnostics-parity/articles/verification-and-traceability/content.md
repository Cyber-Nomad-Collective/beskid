import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



Implementation anchors:

- `compiler/crates/beskid_cli/src/frontend.rs`
- `compiler/crates/beskid_codegen/src/services.rs`
- `compiler/crates/beskid_lsp/src/diagnostics.rs`
- `compiler/crates/beskid_analysis/src/services/`

Verification strategy should compare fixture diagnostics across CLI and LSP cold/warm paths.

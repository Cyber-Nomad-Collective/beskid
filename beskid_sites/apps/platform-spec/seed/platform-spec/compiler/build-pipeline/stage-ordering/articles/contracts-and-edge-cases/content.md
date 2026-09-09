import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



- Build and run command paths must use the same lowering order for parity.
- Semantic error diagnostics must stop lowering before backend code generation.
- Parse diagnostics source naming differences must be documented (`path` vs `"<memory>"`).
- Entrypoint lookup must use post-resolution typed metadata from the same lowering result.

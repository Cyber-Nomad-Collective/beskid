import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



- Missing or malformed project manifests must produce stable project diagnostics, not parser panics.
- Unresolved dependencies must follow the selected policy and remain observable in command output.
- Explicit source-file input takes precedence over workspace target inference.
- Resolution must preserve deterministic target selection for identical manifests and lockfiles.

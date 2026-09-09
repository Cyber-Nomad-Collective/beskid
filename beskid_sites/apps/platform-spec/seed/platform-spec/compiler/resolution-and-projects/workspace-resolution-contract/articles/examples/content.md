import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



- **Single project:** `Project.proj` with one target yields one-entry `CompilePlan`; `resolve_input` points directly to that entry file.
- **Workspace with deps:** root target depends on local and registry packages; graph includes both, unresolved optional packages are reported according to policy.
- **Explicit file compile:** `beskid run Src/Main.bd` bypasses target inference and resolves directly from the provided file path.

import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



This article documents **flow and algorithms** for **Syntax domain model generation**.

## Primary flow
1. Materialize or refresh the syntax snapshot for the active compilation generation.
2. Classify meta contributors vs read-only inspectors (language-meta classification carries through here).
3. Execute host policy checks before surfacing Mod SDK calls.
4. Commit outputs atomically per scheduling round (see incremental scheduling feature).

## Ordering constraints
- No meta body runs before a parseable syntax model exists for its lexical scope.
- Semantic queries that depend on staged rules must declare the minimal snapshot version they require; the host may defer or rerun automatically.

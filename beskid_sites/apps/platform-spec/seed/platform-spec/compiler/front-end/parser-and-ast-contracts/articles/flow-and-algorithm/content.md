import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



The parsing flow is intentionally linear:

1. Read source units from project services.
2. Execute grammar entry points from `beskid.pest`.
3. Convert parse tree fragments into syntax item/type nodes in `src/syntax`.
4. Emit parser diagnostics for malformed input and continue when recovery is defined.
5. Hand syntax trees to resolver (`src/resolve`) and semantic passes (`src/analysis`).

Algorithmically, the important invariant is determinism: identical source text must produce identical syntax node graphs and stable diagnostic ordering.

import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



- **Successful run:** parse + rules + typing succeed; artifact is sent to JIT and executed.
- **Build with semantic error:** rules emit an error; lowering exits before object emission.
- **Parse failure:** parse stage emits diagnostics and no HIR or backend stages run.

import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



1. CLI parse path converts parser errors using file-path source labels.
2. Lowering path parses and can emit diagnostics with `"<memory>"` labels.
3. Lowering runs semantic rules when diagnostics are enabled and aborts on errors.
4. LSP cold path parses, maps parse errors, then runs semantic rules.
5. LSP warm path reuses analyzed snapshots and reruns rule checks without reparsing.

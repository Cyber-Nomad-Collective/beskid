import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



- **Syntax error in file:** CLI points to file path; LSP cold path may show `source.bd`, but location/rule category should match.
- **Semantic rule violation:** both CLI-lowering and LSP report equivalent rule failures.
- **Manifest error:** CLI and LSP project parsing surfaces report project diagnostics, not code syntax diagnostics.

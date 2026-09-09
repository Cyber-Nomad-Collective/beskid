import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



Example A: duplicate symbol definition

1. Resolver exposes two declarations with the same identity in one scope.
2. Definition-stage rule reports a duplicate-definition issue kind.
3. CLI and LSP render different message shells but reference the same issue code.

Example B: invalid method signature usage

1. Parsed node is syntactically valid.
2. Semantic rule validates contract/method constraints against resolved type context.
3. Failure emits a semantic diagnostic code with spans pointing to the offending signature and related declaration.

import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



## Why did `beskid run` and `beskid build` fail at different points?
Check whether both paths enabled diagnostics and used the same source input path.

## Why do parse source names differ in output?
Lowering can report parse diagnostics with `"<memory>"`, while CLI parse uses file paths.

## Can I skip semantic stages for faster compile?
Not for normative build/run behavior; skipping semantics is outside this contract.

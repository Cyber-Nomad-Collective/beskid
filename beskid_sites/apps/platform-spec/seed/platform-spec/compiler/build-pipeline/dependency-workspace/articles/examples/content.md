import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



- **Fresh install:** no lockfile, normal mode creates `Project.lock v1`.
- **CI locked mode:** `--locked` fails if dependency versions differ from lockfile.
- **Frozen release mode:** `--frozen` compiles only when current lockfile already matches graph.
- **Registry outage:** optional dependency fetch failure is surfaced according to unresolved policy.

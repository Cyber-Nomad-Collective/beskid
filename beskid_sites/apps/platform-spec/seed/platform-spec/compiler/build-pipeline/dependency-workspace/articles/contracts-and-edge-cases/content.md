import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



- `--locked` must reject missing or out-of-date lockfiles.
- `--frozen` must reject changes that require writing lockfile updates.
- Registry dependency materialization failures must report stable project errors.
- Workspace prep must not silently change selected compile target.

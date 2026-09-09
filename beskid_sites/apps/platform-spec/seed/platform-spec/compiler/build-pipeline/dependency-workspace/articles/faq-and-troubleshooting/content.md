import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



## Why did lock command update files unexpectedly?
Run with `--frozen` to prevent lockfile writes; normal mode allows synchronization.

## Why does locked mode fail in CI but not locally?
Local dependency graph or manifest may differ from committed lockfile.

## Where are dependency sources materialized?
Under the workspace object tree (for example `obj/beskid/deps/src`) managed by workflow services.

# spec CLI

Local platform-spec directory management. No network auth in this release.

```bash
bun run spec init
bun run spec validate
bun run spec import-mdx --from site/website/src/content/docs/platform-spec
bun run spec node create --path platform-spec/compiler --level domain --title Compiler
```

The web app at `spec.beskid-lang.org` clones git repos with this structure and syncs JSON to Memgraph.

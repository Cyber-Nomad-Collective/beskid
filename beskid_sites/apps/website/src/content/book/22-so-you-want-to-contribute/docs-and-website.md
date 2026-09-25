---
title: "Docs and website"
description: Where the Book and platform-spec live, and how to run the website app locally.
tableOfContents: true
---

Public docs are split across two reader areas:

- **[Platform specification](/platform-spec/)** — normative
- **[Beskid Book](/book/)** — informative tutorial (this file tree)

Use **pnpm** for local workflows on the Book's website app:

```bash
cd beskid_sites/apps/website
pnpm dev
pnpm test
pnpm build
```

Book chapter order comes from `book/nav.order.json`; the content manifest reads every `.md`/`.mdx` file under `src/content/book/` directly. Platform-spec navigation comes directly from root `openspec/catalog.json`; the website does not generate or own normative content.

## Book vs spec

If two reviewers would argue about observable behavior, the argument belongs in **platform-spec** first. The book explains how to apply the rule. Chapter 12 exists because we learned this the hard way.

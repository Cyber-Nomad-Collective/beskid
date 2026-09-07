---
title: "Docs and website"
description: Astro site, informative Book content, and canonical OpenSpec links.
tableOfContents: true
---

Public docs live in **`site/website`**. Two reader areas only:

- **[Platform specification](/platform-spec/)** — normative
- **[Beskid Book](/book/)** — informative tutorial (this file tree)

Use **Bun** for local workflows:

```bash
cd site/website
bun run dev
bun run test:docs-links
bun run build
```

Book nav comes from `book/nav.order.json` → `generate:book-nav-tree`. Platform-spec navigation comes directly from root `openspec/catalog.json`; the website does not generate or own normative content.

## Book vs spec

If two reviewers would argue about observable behavior, the argument belongs in **platform-spec** first. The book explains how to apply the rule—chapter 12 exists because we learned this the hard way.

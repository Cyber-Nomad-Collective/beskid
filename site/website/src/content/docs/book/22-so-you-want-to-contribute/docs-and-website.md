---
title: "Docs and website"
description: Astro site, informative Book content, and canonical OpenSpec links.
tableOfContents: true
---

Public docs live in **`site/website`**. Two reader areas only:

- **[Platform specification](/docs/standard/)** — normative
- **[Beskid Book](/book/)** — informative tutorial (this file tree)

Use **pnpm** for local workflows:

```bash
cd site/website
pnpm dev
pnpm test:docs-links
pnpm build
```

Book navigation comes from `book/nav.order.json` through `generate:book-nav-tree`. Standard navigation comes from root `openspec/catalog.json`; the website does not own normative content.

## Book vs spec

If two reviewers would argue about observable behavior, the change belongs in **OpenSpec** first. The Book explains how to apply the rule. Use [Documentation authoring](/docs/contributing/documentation/) for the current checks.

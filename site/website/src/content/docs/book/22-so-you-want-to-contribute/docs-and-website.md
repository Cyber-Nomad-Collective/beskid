---
title: "Docs and website"
description: Astro site, book vs platform-spec, and trudoc verification commands.
tableOfContents: true
---

Public docs live in **`site/website`**. Two reader areas only:

- **[Platform specification](/platform-spec/)** — normative
- **[Beskid Book](/book/)** — informative tutorial (this file tree)

Use **Bun** for local workflows:

```bash
cd site/website
bun run dev
bun run verify:trudoc -- --preset ci
```

Book nav comes from `book/nav.order.json` → `generate:book-nav-tree`. Platform-spec nav is generated separately—do not hand-edit JSON trees in `src/generated/` and call it a day.

## Book vs spec

If two reviewers would argue about observable behavior, the argument belongs in **platform-spec** first. The book explains how to apply the rule—chapter 12 exists because we learned this the hard way.

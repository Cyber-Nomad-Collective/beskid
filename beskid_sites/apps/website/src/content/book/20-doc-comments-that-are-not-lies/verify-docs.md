---
title: "Verify docs in CI"
description: What the site build actually catches, what it does not, and why OpenSpec edits belong in the same change set as behavior.
tableOfContents: true
---

`pnpm build` in `beskid_sites/apps/website` builds the Book and Docs pages and will fail on a broken MDX file or a bad frontmatter field, but Book pages resolve through a splat route at request time, so a dead `/book/...` link is a 404 a reader finds, not something the build catches for you. Read your own links before you ship them. `pnpm test` runs the site's vitest suite. Normative changes are validated separately from the repository root with `openspec validate --all --strict`.

Run the checks that match the change: the site build for rendered Book/Docs pages, standard validation for changes to the normative corpus. A passing documentation build does not validate a changed language rule; that is what `openspec validate` is for.

## Contributor loop

1. Change behavior, then update platform-spec if it is observable.
2. Update `///` comments and run `beskid doc` (or `beskid pckg pack`) for packages you publish.
3. Run the checks above before claiming green CI.

If a rendered guide and the standard disagree, update or clarify the guide and keep the standard link visible. Do not copy a requirement into the Book merely to make the page self-contained.

## Related standard pages

- [Documentation comments](/platform-spec/language-meta/surface-syntax/documentation-comments/)
- [Specification authority and decisions](/platform-spec/community/spec-maintenance/spec-authority-and-decisions/)

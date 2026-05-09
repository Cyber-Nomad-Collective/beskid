---
title: GitHub-managed docs feedback
description: Configure comments and edit suggestions for docs using GitHub Discussions and pull requests.
---

This site supports fully GitHub-managed feedback for docs pages:

- **Suggest edits** uses Starlight `editLink` to open the source file on GitHub.
- **Comments** use giscus, backed by GitHub Discussions.

## Repository setup

1. Enable **Discussions** in `Cyber-Nomad-Collective/beskid`.
2. Install the [giscus GitHub App](https://github.com/apps/giscus).
3. Create a dedicated Discussions category for docs comments.
4. Use [giscus.app](https://giscus.app/) to obtain:
   - `repoId`
   - `categoryId`

## Website configuration

Set the following public env vars in deployment (or local `.env`):

- `PUBLIC_GISCUS_REPO`
- `PUBLIC_GISCUS_REPO_ID`
- `PUBLIC_GISCUS_CATEGORY`
- `PUBLIC_GISCUS_CATEGORY_ID`
- `PUBLIC_GISCUS_MAPPING` (recommended: `pathname`)
- `PUBLIC_GISCUS_STRICT` (recommended: `1`)
- `PUBLIC_GISCUS_REACTIONS_ENABLED`
- `PUBLIC_GISCUS_INPUT_POSITION`
- `PUBLIC_GISCUS_LANG`
- `PUBLIC_GISCUS_EMIT_METADATA` (usually `0`)
- `PUBLIC_GISCUS_THEME` — `sync` follows the site theme toggle; or set e.g. `preferred_color_scheme` to match the snippet from giscus.app

Reference defaults are in `site/website/.env.example`.

## Commenting on a specific passage

giscus maps **one discussion thread per page** (with `pathname` mapping). It does not support anchored comments inside the page like a PDF reviewer.

On platform-spec pages, select text in the article: a **Copy quote for discussion** control appears. It copies a Markdown blockquote plus the page URL (with a `#heading-id` when possible). Paste that into the giscus comment box so thread readers see exactly what you mean.

## Verification checklist

- Open any `/platform-spec/...` page:
  - confirm **Edit page** opens the expected file path in GitHub,
  - confirm **Discuss this page** loads giscus.
- If `PUBLIC_GISCUS_THEME=sync`, toggle light/dark and verify giscus follows the site. If you use `preferred_color_scheme`, giscus follows the OS/browser scheme instead.
- Select a sentence, use **Copy quote for discussion**, paste into the comment field, and confirm the quote and link look right.
- Submit a test comment and confirm it appears in the chosen Discussions category.

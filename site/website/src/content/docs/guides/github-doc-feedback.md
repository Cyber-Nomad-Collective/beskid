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

Reference defaults are in `site/website/.env.example`.

## Verification checklist

- Open any `/platform-spec/...` page:
  - confirm **Edit page** opens the expected file path in GitHub,
  - confirm **Discuss this page** loads giscus.
- Toggle light/dark theme and verify giscus theme follows the site theme.
- Submit a test comment and confirm it appears in the chosen Discussions category.

---
title: "Stable vs internal"
description: Not everything in a public repo is a public API—tiers matter for corelib and your packages.
tableOfContents: true
---

**Stable** means you expect downstream breakage to hurt real users and you will update platform-spec / semver policy before changing behavior. **Internal** means "I can rename this Tuesday."

Corelib documents stability tiers under [Stability and API shape](/platform-spec/core-library/stability-and-api-shape/). Your application packages should copy the *discipline*, not necessarily the same tier names.

## API checklist

- Export only symbols you want to support long-term.
- Keep internal modules private unless they are intended extension points.
- Prefer one public boundary file per subsystem.

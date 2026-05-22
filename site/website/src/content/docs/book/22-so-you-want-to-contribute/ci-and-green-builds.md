---
title: "CI and green builds"
description: GitHub Actions across superrepo and submodules, and how to triage failures from logs.
tableOfContents: true
---

CI runs per repo and submodule. When red, use GitHub CLI before guessing:

```bash
gh run list --limit 5
gh run view <run-id> --log-failed
```

Superrepo changes often need commits in **`compiler`**, **`pckg`**, or **`beskid_vscode`** first, then a submodule pointer bump—pushing only the parent repo is a classic way to achieve "green locally, red everywhere."

## Website CI

`site/website` prebuild runs trudoc verify with CI preset. Container builds may skip verify with `BESKID_SKIP_TRUDOC_VERIFY=1`—do not treat that as permission to skip verify on your laptop.

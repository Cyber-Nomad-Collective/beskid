---
title: "The pckg CLI"
description: Publish, login, and dry-run flows through beskid pckg—not a second package manager hiding in the bushes.
tableOfContents: true
---

`beskid pckg` is the toolchain entry for registry operations: authentication, dry-run validation, publish, and related workflows implemented in the **`beskid_pckg`** crate and the **pckg** service.

Scaffolding templates use **`beskid new`**, not `pckg`—do not cargo-cult npm commands that never existed here.

## Commands you will actually use

```bash
beskid pckg login
beskid pckg whoami
beskid pckg publish --dry-run
beskid pckg publish
```

## Reference

- [pckg command reference](/book/reference/cli/commands/pckg/)
- [Registry client](/platform-spec/tooling/registry-client/)
- [pckg client contract](/platform-spec/tooling/registry-client/pckg-client-contract/)

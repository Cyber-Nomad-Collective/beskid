---
title: "Foreign libraries"
description: Import native libraries through tooling contracts, not random linker flags in a README footnote.
tableOfContents: true
---

Native dependencies enter through **foreign library import** tooling: manifest `link` entries, a CLI import flow, and platform-spec contracts that keep Windows/Linux/macOS differences out of your application's soul.

```bash
beskid import lib pthread
```

That resolves `pthread` through the default `c-posix` provider and writes a `link` entry into the manifest. Add `--dry-run` to see the resolution without touching the manifest, or `--provider` to pick a different provider.

## Interop overlap

FFI *language* rules are chapter 21; this section is *packaging and linking* policy: how a native library gets into your build graph, not how you declare the function signature that calls into it. Mixing the two in one angry Slack thread is optional but not recommended.

## See also

- [Foreign library import](/platform-spec/tooling/foreign-library-import/)
- [Project link libraries](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/project-link-libraries/)
- [CLI import-lib command](/platform-spec/tooling/foreign-library-import/cli-import-lib-command/)

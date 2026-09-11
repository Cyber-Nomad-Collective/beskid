# GitHub-native workflows

Root validation and native target builds run in Woodpecker, while stable
publication is a separately reviewed manual operation. This directory is
intentionally limited to operations whose external authority is a GitHub or
editor-marketplace API.

| Workflow | Purpose |
|----------|---------|
| `publish-open-vsx.yml` | Explicitly build and publish the multi-platform VS Code extension to Open VSX from a full `main` commit SHA and stable release version |
| `publish-zed-extension.yml` | Verify and submit a tagged Zed extension release |

Compiler binaries, installer packages, platform images, and production
promotion must not be added here. Repository-owned scripts under
[`scripts/ci/`](../scripts/ci/) remain callable by Woodpecker and by a release
operator without depending on GitHub workflow transport.

## Marketplace publication

Open VSX publication is an explicit dispatch. The supplied source SHA must be
a full commit reachable from `main`; the job builds each native LSP and assigns
the supplied stable version to the extension package. `OVSX_TOKEN`,
`COMPILER_SUBMODULE_TOKEN`, and `BESKID_VSCODE_SUBMODULE_TOKEN` remain scoped to
that marketplace workflow.

Zed publication starts from a version tag, verifies the extension manifest and
the stable LSP release assets, then submits the pinned extension source through
the upstream registry action.

## Local validation

```bash
actionlint .github/workflows/*.yml
bash scripts/ci/test/open-vsx-publish.test.sh
bash scripts/ci/test/zed-extension-package.test.sh
bash scripts/ci/test/zed-language-assets.test.sh
```

## Learned User Preferences
- User often asks to execute implementation plans exactly as provided, including continuing through all listed tasks without stopping early.
- User frequently wants git work carried through end-to-end: commit and push fixes, often to `main`, across relevant submodules and the superrepo.
- User prioritizes CI reliability and repeatedly asks to diagnose failing GitHub Actions runs from logs and ensure pipelines are green.
- User prefers practical deployment-oriented fixes (especially for Coolify/container setups) over abstract guidance.
- User sometimes asks to push Git commits to every configured remote, not only the default.
## Learned Workspace Facts
- This workspace is an aggregate superrepo where core code lives in submodules, especially `compiler` and `pckg`.
- The standard library is expected to be sourced via nested submodule layout under `compiler/corelib` rather than a top-level superrepo submodule.
- The `pckg` service is deployed in containers with compose-managed database connectivity, HTTP port binding, artifact storage paths, and optional captcha keys; when no users exist yet, the first administrator is created through the interactive in-app onboarding flow.
- Prebuilt Beskid CLI binaries are published from the `compiler` repo CI to **GitHub Releases** on the rolling tag `cli-latest` (install scripts under `site/website/public/` point at those URLs; user-facing download docs may also reference `cdn.beskid-lang.org` under the `beskid-lang.org` domain).

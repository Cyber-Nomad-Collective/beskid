## Status

Closed

## Assignee

Wayfinder agent (2026-09-07)

## Question

Which unintegrated root and submodule changes belong to the v0.4 release closure, which repository owns each change, and what focused verification, commit, merge, and push order is required before the release gates can be trusted?

## Acceptance

- Every modified root path and dirty submodule is attributed to a release-owned change set or explicitly excluded.
- Each retained change set has an owning repository, branch/commit target, and focused verification command.
- The integration order preserves submodule commit reachability before the superproject pointer update.
- No unrelated or unverified working-tree change is staged, committed, merged, or pushed.

## Resolution

**Resolved 2026-09-07.** The v0.4.0 tag is already an ancestor of `main` (338 subsequent commits), so the active work is a post-tag release-closure stream, not an initial 0.4 cut.

- The root diff combines CLI documentation, pckg Rust cutover wiring, website legacy-document removal, CI-contract changes, and metadata noise. It fails `git diff --check` and the standard catalog check reports `AGENTS.md` drift.
- `compiler` contains 76 tracked and four untracked source-file changes across generic contracts, CLI/package/publish, ABI/runtime, ISLE, and semantic-query work. The branch has no upstream and no reachable commit, so its pointer cannot yet be integrated safely.
- `pckg` has 48,141 local deletions for a .NET-to-Rust cutover while `pckg/Dockerfile` is absent even though the release workflow hard-gates that image. This must be completed and proven before root CI assumptions are changed.
- Other dirty submodules contain mixed or unrelated local work (including generated artifacts and format-only edits). They are excluded from release integration until a dedicated verified ticket owns them.

The release route is three independently owned slices: prove and commit the pckg Rust image cutover; split and validate the compiler changes into releasable commits; then integrate their reachable pointers with root CI/docs/catalog validation. The final corelib/kit/CI evidence remains blocked on those slices.

## Status

Closed

## Question

How should the current compiler working tree be partitioned into independently verified, reachable commits so release-critical fixes can be integrated without accidentally shipping unproven generic-contract or CLI behavior changes?

## Acceptance

- Each source group is classified as release-critical, separately feature-scoped, or excluded.
- Retained commits have focused tests, a clean diff, and a remote branch/commit reachable by the superproject.
- `.opencode` output and other local artifacts are excluded.
- The compiler CLI, analysis, queries, ABI, ISLE, and codegen validation results are recorded against their specific commits.

## Resolution

**Resolved 2026-09-07.** The 76-file compiler working tree is not a releasable unit. Its branch has no upstream/reachable commit and contains four untracked entries, including local `.opencode` output.

The first candidate v0.4 slice is unit-payload enum layout behavior: the unit-payload hunks in `beskid_queries` enum layout, its two scalar-payload regression tests, and the coupled ISLE enum context. It must gain an end-to-end ISLE lowering fixture before commit. ABI-v5 service exports are a second atomic runtime-kit slice; memory comparison and generic enum specialization require independent reproductions; generic contracts/`This`/associated types and the CLI command-tree migration are outside the current v0.4 integration path.

No superproject compiler pointer may advance until a selected slice has passed focused tests and been pushed to the compiler remote.

# Beskid worktree audit — 2026-09-22

Read-only audit. Snapshot time: 2026-09-22 22:00 CEST. "origin/main" below refers to each repo's own remote main tip at audit time.

Legend: **ahead** = `git rev-list --count origin/main..HEAD`; **absorbed** = HEAD is an ancestor of origin/main (all committed work already in main); **uncommitted** = `git status --porcelain` counts; **merge-tree** = `git merge-tree --write-tree origin/main HEAD` (clean tree hash only = clean; `CONFLICT` lines = conflicting).

Classes: MERGEABLE (new, merges cleanly) · NEEDS-REBASE (new, conflicts) · SUPERSEDED (all work already in main) · ABANDONED (scratch/obsolete) · LIVE (active, do not touch).

## Root repo (`/Users/mikserek/Projects/beskid`)

| Path | Branch | Last commit | Ahead | Uncommitted | Newest file mtime | Merge-tree | Class | Evidence |
|---|---|---|---|---|---|---|---|---|
| `/private/tmp/beskid-f6-source-origin-openspec` | codex/f6-source-origin-openspec-delta | 2026-09-21 22:40 | 2 | none | — | clean | **MERGEABLE** | 2 commits (`29b9f88c`, `2ef24763`) define "Corelib source authority" OpenSpec text, not present in main's `openspec/changes/`; merges without conflict. |
| `.codex/worktrees/5eff/beskid` | detached `af94776f` | 2026-09-21 22:22 | 0 (absorbed) | 3M+7?? | 2026-09-22 13:21 | n/a (absorbed) | **SUPERSEDED** | Committed part already in main. Uncommitted draft duplicates the glue-v0.5 conformance spec effort (untracked `openspec/changes/glue-v05-conformance/{tasks.md,specs/...ffi-and-extern,...export-and-callbacks}`), but the real version of that work was properly committed on `codex/glue-v05-conformance` (`2ffa7d70`, different file layout: `specs/language-meta--interop--beskid-glue/spec.md`). CHANGELOG/GLOSSARY additions here are an earlier draft superseded by main's current CHANGELOG entries. |
| `.codex/worktrees/8d44/beskid` | detached `fac40595` | 2026-08-14 22:17 | 0 (absorbed) | 1M | — | n/a | **ABANDONED** | Sole uncommitted change is a 1-line compiler submodule pointer drift. No real content. |
| `.codex/worktrees/beskid-pckg-rust-delivery` | codex/pckg-rust-delivery | 2026-09-09 13:14 | 8 | 1D+31M+5?? | 2026-09-09 11:00 | **conflict** (submodules `compiler`, `beskid_vscode`, `beskid_distrib`; files incl. `.github/README.md`, `.github/actionlint.yaml`, `.github/actions/setup-beskid/README.md`) | **NEEDS-REBASE** | Substantial pckg/release-distribution test and doc work (scripts/ci tests, `docs/.../18-release-distribution-and-pckg-promotion.md`), 13 days stale, heavy conflict surface. Highest-value NEEDS-REBASE candidate but costly to rebase. |
| `.codex/worktrees/community-deployment-contract/beskid` | detached `18217e63` | 2026-09-21 22:52 | 1 | none | — | conflict: `CHANGELOG.md` only | **NEEDS-REBASE** | Single commit "fix(deploy): make community NodeBB reproducible"; only conflicts on CHANGELOG.md — trivial to rebase. |
| `.codex/worktrees/f3d6/beskid` | detached `8530e7f4` | 2026-09-14 02:10 | 0 (absorbed) | 12M | 2026-09-15 17:38 | n/a | **SUPERSEDED** | Committed history absorbed into main; uncommitted diff is deploy-compose/authentik-branding tweaks + submodule pointer bumps, 7 days stale, no new commits — treat as leftover scratch state of an already-absorbed branch. |
| `.codex/worktrees/f6-native-descriptor-contract/beskid` | detached `7f82ada2` | 2026-09-21 10:49 | 1 | none | — | **conflict**: `openspec/changes/beskid-v0-5-foundations/{design.md,tasks.md}` | **NEEDS-REBASE** (likely superseded) | Single commit "define native descriptor contract" edits the same `beskid-v0-5-foundations` tasks/design that main has since revised further (see v05-foundations-spec row) and that the LIVE worktree is actively implementing. Diff against main shows main's task list is already more advanced/detailed in the same sections — treat as probably superseded by newer text, confirm before reusing. |
| `.codex/worktrees/glue-v05-conformance/beskid` | codex/glue-v05-conformance | 2026-09-22 13:50 | 1 | 5M | 2026-09-22 14:13 (~7.7h old) | conflict: `compiler` submodule ("commits not present" — local fetch gap, not a real conflict); CHANGELOG/GLOSSARY auto-merge clean | **NEEDS-REBASE** | This IS the properly-committed glue-v0.5 conformance spec (`openspec/changes/glue-v05-conformance/`, not in main yet). Genuinely new and valuable; blocked only by a stale local `compiler` submodule ref, not a real content conflict — fetch/update the submodule ref and retry. Uncommitted changes (catalog.json, design.md, spec.md, tasks.md) are live in-progress edits on top. |
| `.codex/worktrees/learn-curriculum/beskid` | codex/learn-curriculum | 2026-09-22 12:01 | 0 (absorbed) | 2M | 2026-09-22 12:00 | n/a | **ABANDONED** | Committed work absorbed. Uncommitted diff is only a GitNexus symbol-count churn line in AGENTS.md/CLAUDE.md — stale index metadata, not real work. |
| `.codex/worktrees/pckg-nodebb-auth-topics/beskid` | detached `f63c0e7a` | 2026-09-22 10:29 | 2 | none | — | conflict: `CHANGELOG.md`, `compiler` submodule (local ref gap) | **NEEDS-REBASE** | Commit `f63c0e7a` "feat(community): connect NodeBB to Authentik and pckg" is genuinely new feature work (not just the shared reproducibility fix also on community-deployment-contract). Worth rebasing. |
| `.worktrees/authelia-integration` | codex/authelia-integration | 2026-09-08 07:16 | 0 (absorbed) | 4M+1?? | 2026-09-08 07:31 | n/a | **ABANDONED**-leaning (real but stale/mislabeled) | Committed history absorbed. Uncommitted diff is a real, different design for `BlogPostCard.tsx`/`ReleaseBlogIndex.astro` (image caption/category vs main's source-link/caption), but branch name references Authelia while content is blog-card UI — looks like a stale/mislabeled 2-week-old draft superseded by main's current blog card design. Preserve as patch before removing. |
| `.worktrees/licensing-policy` | codex/licensing-policy | 2026-09-08 11:41 | 0 (absorbed) | none | — | n/a | **SUPERSEDED** | Fully absorbed, nothing outstanding. |
| `.worktrees/manual-release-0.4.744` | codex/manual-release-0.4.744 | 2026-09-11 01:59 | 2 | 1?? | 2026-09-11 02:19 | conflict: `compiler`, `beskid_distrib` submodules | **ABANDONED** | Both commits (`4734e423` "pin x64 Windows installer fix", `9b7928cc` "pin compiler for 0.4.744 stable release") are shared with the woodpecker-* worktrees below and were manual-release pins for a release already shipped; the lone untracked item is `release-output/aggregate/*version.txt` build artifacts, not source. |
| `.worktrees/root-appveyor-rustup-bootstrap` | codex/appveyor-macos-cross-validation | 2026-09-10 12:23 | 6 | none | — | conflict: `CHANGELOG.md`, `appveyor.yml`, `compiler` submodule | **ABANDONED** | All 6 commits are AppVeyor bootstrap/toolchain work (`fix(ci): bootstrap AppVeyor Rust toolchains`, etc.) plus two `TEMP pin ...` diagnostic-probe commits. `appveyor.yml` no longer exists in main at all — the project has moved fully to Woodpecker (confirmed: AGENTS.md and main's `.woodpecker/` directory are the live CI). This entire line of work targets a retired CI system. |
| `.worktrees/v05-foundations-spec` | codex/v05-foundations-spec | 2026-09-20 14:42 | 5 | none | — | conflict: `openspec/changes/beskid-v0-5-foundations/{design.md,tasks.md,specs/core-library--concurrency--concurrency-package/spec.md}` | **SUPERSEDED** | Diffed `tasks.md` against main: main's current text for tasks 2.3–2.5 and 3.4/3.6 is a more precise rewrite of the same requirements, and main additionally has tasks 2.7–2.9 and 5.6–5.8 that don't exist in this worktree at all. This branch's spec draft (Sep 20) has been overtaken by newer spec work already merged (commits `38e32ec8`, `0be1669d`, plus later same-day edits). |
| `.worktrees/woodpecker-migration` | codex/woodpecker-migration | 2026-09-14 02:10 | 0 (absorbed) | none | — | n/a | **SUPERSEDED** | Fully absorbed, nothing outstanding. |
| `.worktrees/woodpecker-openspec` | codex/woodpecker-openspec | 2026-09-11 02:32 | 3 | none | — | conflict: `compiler`, `beskid_distrib` submodules, `openspec/catalog.json` | **SUPERSEDED** | Shares 2 commits with manual-release-0.4.744; its one distinct commit `e83d1da7` "remove delivery automation policy" is early-stage Woodpecker-migration policy doc work. Main's `.woodpecker/` setup (7 workflow files incl. Open VSX publisher with 5+ follow-up fixup commits, e.g. `21f5e3c1`) is materially further along — this branch's intent is already delivered, more completely, in main. |
| `.worktrees/woodpecker-pipeline` | codex/woodpecker-pipeline | 2026-09-11 02:39 | 3 | none | — | conflict: `.woodpecker/{linux,macos,windows}.yml`, `beskid_distrib` | **SUPERSEDED** | Distinct commit `f6963132` "ci: add minimal Woodpecker build workers" — an early skeleton of the pipeline main now runs in full (with subsequent Open VSX/publisher fixes). Same conclusion as woodpecker-openspec. |
| `.worktrees/woodpecker-provider-purge` | codex/woodpecker-provider-purge | 2026-09-11 02:39 | 3 | none | — | conflict: `.github/README.md`, `.github/workflows/publish-open-vsx.yml`, `AGENTS.md` | **SUPERSEDED** | Distinct commit `56646622` "refactor(ci): purge superseded providers" — main's `.github/workflows/` is now empty except editor-marketplace/repo-native work (per AGENTS.md policy), i.e. the purge already happened more thoroughly in main. |
| `.worktrees/zed-extension-sdk` | codex/linux-fiber-frame-pointers | 2026-09-10 13:28 | 4 | 4M (submodule pointer bumps only) | — | conflict: `CHANGELOG.md`, `appveyor.yml`, `compiler` submodule | **ABANDONED** | Directory name doesn't match branch; commits are `TEMP pin/harden Linux scheduler crash probe` diagnostic probes plus an AppVeyor lint tweak — obsolete CI target (see root-appveyor row) and debug scratch commits. |

## `compiler` submodule

| Path | Branch | Last commit | Ahead | Uncommitted | Newest file mtime | Merge-tree | Class | Evidence |
|---|---|---|---|---|---|---|---|---|
| `/private/tmp/f6-cranelift-baseline-bcd36d29/compiler` | detached `bcd36d29` | 2026-09-21 18:03 | 0 (absorbed) | none | — | n/a | **SUPERSEDED** | Fully absorbed, nothing outstanding. |
| `.codex/worktrees/beskid-abi-targets` | codex/refactor-abi-target-resolution | 2026-09-07 14:51 | 1 | 8M | 2026-09-07 14:42 | conflict: `CHANGELOG.md` only (code in `runtime_kit/discovery.rs`, `runtime_provenance.rs` auto-merges clean) | **NEEDS-REBASE** | Real refactor ("centralize target resolution") plus uncommitted LSP/tests-projects follow-up edits; 15 days stale but only a CHANGELOG conflict blocks it — cheap rebase, worth checking relevance against the newer ABI-v5 work in the LIVE compiler worktree before reusing. |
| `.codex/worktrees/beskid-associated-type-ref` | codex/associated-type-ref | 2026-09-07 15:43 | 0 (absorbed) | 2M | 2026-09-07 15:28 | n/a | **ABANDONED** | Absorbed; only uncommitted change is a corelib pointer bump plus a regenerated `Project.lock` fixture (9 lines both ways) — lockfile churn, not source work. |
| `.codex/worktrees/beskid-codegen-signatures` | codex/refactor-codegen-signatures | 2026-09-07 14:49 | 1 | none | — | **conflict**: `CHANGELOG.md`, `crates/beskid_codegen/src/module_emission/trampolines.rs`, `.../tests/isle_adapter/module_emission_specialization.rs` | **NEEDS-REBASE** | Real refactor ("centralize trampoline signature mapping") with genuine code conflicts against main's codegen — needs a real rebase, not just a CHANGELOG fixup. |
| `.codex/worktrees/beskid-parse-recovery` | codex/refactor-parse-recovery | 2026-09-07 14:49 | 1 | none | — | conflict: `CHANGELOG.md` only | **NEEDS-REBASE** | Real refactor ("centralize recovery insertion positioning"); only CHANGELOG conflicts — cheapest rebase in this repo. |
| `.worktrees/compiler-f6-native-descriptor-contract` | codex/f6-native-descriptor-contract | 2026-09-22 20:25 | 0 (absorbed) | 32M+3?? | 2026-09-22 21:51 (**< 3h old**) | n/a | **LIVE** — do not remove | This is the user-designated live v0.5 release worktree with active agents. Files were modified as recently as 21:51, well inside the 3-hour window; heavy uncommitted work in `runtime/beskid/src/Runtime/Mem/Gc/Sweep.bd`, GC/scheduler tests, `runtime_manifest.bsol`, `beskid_abi` headers, `beskid_manifest/src/v5/render.rs`. Report state only, per instructions. |
| `.worktrees/compiler-linux-spawn-trap` | codex/diagnose-linux-fiber-main | 2026-09-10 16:57 | 3 | none | — | **clean** | **MERGEABLE** (mixed value) | 3 commits: one real ("Split native runtime kit staging phases", `8f5362bc`) plus two `TEMP` diagnostic-probe commits (`d6abddf9`, `c58929c8`). Merges cleanly, but the TEMP commits look like debug scratch that should be squashed/dropped before merging, not shipped as-is. |
| `.worktrees/compiler-typechecker-repair` | codex/typechecker-repair | 2026-09-10 10:24 | 0 (absorbed) | 7M+1?? | 2026-09-11 14:54 | n/a | **ABANDONED**-leaning | Absorbed; uncommitted diff spans LSP session-lifecycle tests, `workspace_scan.rs`, `json_rpc_intellisense.rs`, `semantic_tokens.rs` (146 insertions/35 deletions total). Spot-checked `workspace_scan.rs`: the only diff vs main is one blank line — mostly minor/leftover test tweaks 11+ days old. Preserve as a patch, but low confidence it's worth recovering. |
| `compiler-v05-foundations-runtime` (root project dir, untracked in root `git status`) | codex/v05-foundations-runtime | 2026-09-21 10:09 | 0 (absorbed) | 4M+24?? | 2026-09-21 18:51 (**~3h09m old — borderline, treat with caution**) | n/a | **SUPERSEDED**, verify before removing | Absorbed; uncommitted AGENTS.md/CLAUDE.md/CHANGELOG.md/corelib-pointer changes plus 24 untracked docs/research files. Main's `0be1669d` "chore: point compiler submodule at the merged v0.5 surface" already reflects this branch's intent. mtime is just outside the strict 3h cutoff but close enough that I'd re-check for active use before deleting. |

## `beskid_distrib` submodule

| Path | Branch | Ahead | Uncommitted | Merge-tree | Class | Evidence |
|---|---|---|---|---|---|---|
| `/private/tmp/beskid-distrib-dmg-finder` | codex/dmgbuild-layout | 0 (absorbed) | none | n/a | **SUPERSEDED** | Fully absorbed, nothing outstanding. |

## `beskid_infra` submodule

| Path | Branch | Ahead | Uncommitted | Merge-tree | Class | Evidence |
|---|---|---|---|---|---|---|
| `.codex/worktrees/beskid-infra-deployment-reconcile` | codex/infra-deployment-reconciliation | 0 (absorbed) | none | n/a | **SUPERSEDED** | Fully absorbed. |
| `.codex/worktrees/beskid-infra-pckg-rust-contract` | codex/pckg-rust-contract | 0 (absorbed) | none | n/a | **SUPERSEDED** | Fully absorbed. |

## `beskid_nexus` submodule

| Path | Branch | Ahead | Uncommitted | Merge-tree | Class | Evidence |
|---|---|---|---|---|---|---|
| `nexus-ci-lock-20260908` | codex/ci-bun-lock-20260908 | 0 (absorbed) | none | n/a | **SUPERSEDED** | Fully absorbed. |

## `beskid_tracker` submodule

| Path | Branch | Ahead | Uncommitted | Merge-tree | Class | Evidence |
|---|---|---|---|---|---|---|
| `tracker-ci-biome-20260908` | codex/ci-biome-20260908 | 0 (absorbed) | none | n/a | **SUPERSEDED** | Fully absorbed. |

## Summary counts

- LIVE: 1 (`compiler-f6-native-descriptor-contract` — excluded from removal by instruction)
- MERGEABLE: 3 (`beskid-f6-source-origin-openspec`, `compiler-linux-spawn-trap`, and `glue-v05-conformance` is functionally mergeable once its local `compiler` submodule ref is refreshed — counted under NEEDS-REBASE below since its merge-tree literally reported a conflict)
- NEEDS-REBASE: 8 (`beskid-pckg-rust-delivery`, `community-deployment-contract`, `f6-native-descriptor-contract` (root), `glue-v05-conformance`, `pckg-nodebb-auth-topics`, `beskid-abi-targets`, `beskid-codegen-signatures`, `beskid-parse-recovery`)
- SUPERSEDED: 13
- ABANDONED: 8
- LIVE: 1

(34 worktrees audited total, excluding each repo's primary checkout.)

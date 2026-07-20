# CYB-71 — GitNexus change manifest (W7.C4)

Mechanical export only. No risk interpretation, architecture approval, or whole-branch review.
Those belong to Codex on **CYB-43**.

## SHAs

| Ref | SHA |
|-----|-----|
| Worktree branch | `cursor/cyb-71-w7c-evidence` |
| `HEAD` | `9f1d88fd86fdff2ccb6d14dc2e2c687bc8b06f7f` |
| `origin/main` (after fetch) | `9f1d88fd86fdff2ccb6d14dc2e2c687bc8b06f7f` |

`HEAD` and `origin/main` match. Branch tip is currently identical to main.

## Commit range used

`git diff origin/main...HEAD` is empty (no commits ahead of main).

**Release window (candidate range for this packet):**

| | |
|--|--|
| Window | commits on `origin/main` with author date since **2026-07-06** (~14 days before 2026-07-20) |
| Inclusive tip | `9f1d88fd86fdff2ccb6d14dc2e2c687bc8b06f7f` |
| Oldest commit in window | `acc90b4168a0c8ec2cb971cb450db01cab6488c0` (2026-07-13) |
| Compare base (parent of oldest) | `b19e3b1c750bf894dfbff5ad5d4217c8f3209195` |
| Diff notation | `b19e3b1c750bf894dfbff5ad5d4217c8f3209195...9f1d88fd86fdff2ccb6d14dc2e2c687bc8b06f7f` |
| Commit count | **51** |

Full subject list: `docs/superpowers/reports/cyb-71-raw/window-inventory.txt`.

## GitNexus index refresh

| Item | Result |
|------|--------|
| Preferred `node .gitnexus/run.cjs analyze` | Not present under this worktree (no `.gitnexus/` here). Main checkout has `.gitnexus/run.cjs`. |
| CLI | Global `gitnexus` on PATH (`/Users/mikserek/.bun/bin/gitnexus`) |
| Command run | `gitnexus status` from worktree |
| Status | Repository resolved to `/Users/mikserek/Projects/beskid`; indexed commit `9f1d88f`; current commit `9f1d88f`; **up-to-date** (indexed 2026-07-20 ~12:31 local) |
| Full `analyze` | Skipped — index already matched `HEAD`. Not committed. |

Index stats (from `gitnexus list`): 9599 files, 64525 symbols, 131119 edges, 1900 clusters, 300 processes.

## Changed-scope detection

Repo disambiguation required (`-r /Users/mikserek/Projects/beskid`) because multiple indexes share the `beskid` alias.

| Command | Outcome |
|---------|---------|
| `gitnexus detect_changes --scope compare --base-ref origin/main -r /Users/mikserek/Projects/beskid` | Empty/no branch delta expected (same SHA); not used for the packet body |
| `gitnexus detect_changes --scope compare --base-ref b19e3b1c750bf894dfbff5ad5d4217c8f3209195 -r /Users/mikserek/Projects/beskid` | Used for symbol/flow inventory below |

CLI summary verbatim (tool also emits a risk field; **not interpreted here**):

- Changes: **567 files**, **8862 symbols**
- Affected processes: **7**
- Raw CLI text: `docs/superpowers/reports/cyb-71-raw/detect-changes-cli.txt`

Git path inventory for the same range (rename detection limited by git; counts may differ from GitNexus file mapping):

- `git -c diff.renameLimit=4000 diff --name-only …`: **3786** paths (`cyb-71-raw/git-changed-files.txt`)
- `git diff --stat` without raised rename limit: **3799** files, +128233 / −86778 lines

File-count gap (git ~3.8k vs GitNexus 567) is recorded as a fact for reviewers; CYB-71 does not reconcile it.

## Changed files (inventory)

### Top-level (`git` name-only)

| Area | Approx. paths |
|------|----------------|
| `site/` | 3369 |
| `openspec/` | 309 |
| `scripts/` | 48 |
| `docs/` | 25 |
| `.github/` | 25 |
| Root / misc | AGENTS/CLAUDE/GLOSSARY/CHANGELOG/GUIDE/README, Justfile, package.json, bun.lock, dagger.json, validate-ci-local.sh, .gitignore, .gitmodules, .dockerignore |
| Submodule gitlinks | `compiler`, `beskid_tracker`, `beskid_nexus`, `beskid_web_common`, `beskid_bsol`, `beskid_distrib`, `beskid_infra`, `beskid_vscode`, `pckg` |

### `site/` breakdown

| Path | Approx. paths |
|------|----------------|
| `site/spec-content` | 3185 (mostly deletions) |
| `site/platform-spec` | 94 |
| `site/website` | 69 |
| `site/auth` | 8 |

### `openspec/` breakdown

| Path | Approx. paths |
|------|----------------|
| `openspec/specs` | 185 |
| `openspec/changes` | 112 |
| layouts / assets / catalog / config | small |

### Name-status sketch (`diff.renameLimit=4000`)

| Status | Count |
|--------|-------|
| D | 3214 |
| A | 400 |
| M | 154 |
| Renames (various) | ~18 |

### Submodule pointer tips (parent gitlinks only)

| Submodule | Base tip | Window tip |
|-----------|----------|------------|
| compiler | `8707723d…` | `79eccbd9…` |
| beskid_tracker | `ebaba97e…` | `c6893ff3…` |
| beskid_nexus | `153f40f8…` | `ede3cb20…` |
| beskid_web_common | `b2985c28…` | `4b1b54e8…` |
| beskid_bsol | `2822dcf9…` | `39778036…` |
| beskid_distrib | `074c4a35…` | `4e3b0866…` |
| beskid_infra | `423ca610…` | `fbe95631…` |
| beskid_vscode | `1418aeb7…` | `45ed62a5…` |
| pckg | `b45f850a…` | `79832486…` |

## Changed symbols (GitNexus)

- Count reported: **8862**
- CLI lists first 15 then truncates (`… and 8847 more`)
- Sampled prefixes from CLI: markdown/doc headings in `AGENTS.md`, `CLAUDE.md`, `GLOSSARY.md` (full dump not available from CLI without truncation)

No machine-readable full symbol list was exported (CLI has no JSON flag in `--help`). Reviewers needing the full set should re-run the same `detect_changes` command against the indexed main checkout.

## Affected execution flows (GitNexus)

Count: **7** (all listed by CLI):

1. HandleCallbackGet → AuthDataDir (7 steps) — changed: `handleCallbackGet`
2. HandleCallbackGet → MasterKey (6 steps) — changed: `handleCallbackGet`
3. HandleCallbackGet → ApplyV1 (6 steps) — changed: `handleCallbackGet`
4. HandleCallbackGet → ApplyV2 (6 steps) — changed: `handleCallbackGet`
5. HandleCallbackGet → HashSecret (5 steps) — changed: `handleCallbackGet`
6. GET → SessionSecret (5 steps) — changed: `unsealHubBrowserSession`
7. GET → ReadSessionCookie (4 steps) — changed: `readSessionCookie`

Related `site/auth` paths in the window (for packet navigation only):

- `site/auth/src/server/github-oauth.ts`
- `site/auth/src/server/oauth-cookies.ts`
- `site/auth/src/server/oauth.server.ts`
- `site/auth/src/server/session.ts`
- plus tests and `site/auth/.github/workflows/ci.yml`

## Areas lacking focused evidence / reviewer sign-off (inventory only)

Checklist of surfaces in the window that are **not** covered by the seven indexed flows above, or that are large enough that this packet does not attach focused evidence. Empty checkboxes = awaiting CYB-43 / domain owners; no judgment attached.

- [ ] Parent index vs git path-count reconciliation (567 GitNexus files vs ~3786 git paths)
- [ ] `site/spec-content` removal / migration residual (~3185 paths)
- [ ] `openspec/specs` + `openspec/changes` promotions and catalog (`openspec/catalog.json`)
- [ ] `site/platform-spec` application/routes/scripts (~94 paths)
- [ ] `site/website` book/blog/delivery surfaces (~69 paths)
- [ ] `.github/workflows` + reusable actions / platform delivery / distribute / corelib / compiler gates
- [ ] `scripts/ci/*` release, distribution, openspec, and gate scripts
- [ ] Submodule tip moves: `compiler`, `pckg`, `beskid_tracker`, `beskid_distrib`, `beskid_infra`, `beskid_vscode`, `beskid_web_common`, `beskid_bsol`, `beskid_nexus` (parent gitlink only in this index)
- [ ] Docs / plans / specs under `docs/superpowers/*` and release-closure docs
- [ ] Auth session/OAuth symbols tied to the seven flows (evidence of review still external to this export)
- [ ] Cross-check against `docs/superpowers/reports/2026-07-20-0.4-readiness-baseline.md` (separate readiness artifact; not re-evaluated here)

## Raw artifacts

| Path | Contents |
|------|----------|
| `docs/superpowers/reports/cyb-71-raw/detect-changes-cli.txt` | Full CLI stdout for window `detect_changes` |
| `docs/superpowers/reports/cyb-71-raw/git-changed-files.txt` | Git name-only list for the window |
| `docs/superpowers/reports/cyb-71-raw/window-inventory.txt` | Area counts, submodule tips, commit subjects |

## Handoff

- **CYB-71 complete for:** mechanical GitNexus/git change manifest + review packet files.
- **Handed to Codex / CYB-43:** risk field interpretation, architecture approval, whole-branch review, and any accept/reject decisions.

# CYB-70 — Documentation and OpenSpec closure draft

**Status:** Draft mechanical evidence for Codex review of [CYB-42](https://linear.app/cybernomad-it/issue/CYB-42/w73-documentation-and-openspec-release-closure).  
**Not claimed:** 0.4 release-ready; OpenSpec checkbox completion; CYB-42 / CYB-44 closed.

## Revisions

| Ref | SHA |
| --- | --- |
| Superproject `HEAD` (start of CYB-70 work) | `9f1d88fd86fdff2ccb6d14dc2e2c687bc8b06f7f` |
| Branch | `cursor/cyb-70-w7c-evidence` |
| Compiler submodule pin | `79eccbd9fa8dd975b8ed6dfcfb6056eb1894efef` |
| OpenSpec catalog revision after regen | `d2ab47b887908b2d60bb9d4384efb5c7dfd9fd29e3c411e92a1ebd0d004d4a90` (short `d2ab47b88790`) |
| Prior catalog revision on branch tip | `c36ba876c69db10ae021bacd9e463f11476f7a197ab75743c8464f8e4f9aad61` |

Capability/requirement counts unchanged by regen: **185** capabilities, **515** requirements. Informative document index **250 → 204** after rebuild with document-bearing submodules initialized (`beskid_bsol`, `beskid_distrib`, `beskid_infra`, `beskid_tracker`, `compiler`); missing paths at those pins are pruned. Only root `GUIDE.md` informative hash changed among retained documents.

## Commands run and results

| Command | Result | Notes |
| --- | --- | --- |
| `git rev-parse HEAD` | `9f1d88fd…` | Worktree tip before CYB-70 commit |
| `git ls-tree HEAD compiler` / `git -C compiler rev-parse HEAD` | `79eccbd9…` | Pin matches readiness/plan compiler authority |
| `bun install` (repo root) | Exit 0 with warnings | 955 packages; 4 `@cyber-nomad-collective/beskid-ui*` cache open failures (non-blocking for OpenSpec) |
| `bun run openspec:catalog` | Exit 0 | Required after `GUIDE.md` edit (document catalog drift) |
| `bun run openspec:validate` | Exit 0 | Standard + book traceability + layouts + `openspec validate --all --strict --no-interactive`: **188 passed, 0 failed** |
| `cd site/website && bun run test:docs-links` | Exit 0 | 5/5 pass (remark/catalog alias tests) |
| `cd site/website && bun run test:blog` | Exit 0 | 5/5 pass after `beskid_tracker` init (failed ENOENT before submodule init) |
| `cd site/website && bun run verify:book-images` | Exit 1 | Skipped completion: `trudoc` requires `beskid_web_common` + frozen install |
| `cd site/website && bun run verify:book-layout` | Exit 1 | Same trudoc dependency as above |
| `cd site/website && bun run build` | **Not run** | Full Astro book build skipped as heavy; lightest available validates used instead |

## Diff summary

### Non-normative (this packet)

| Path | Change |
| --- | --- |
| `GUIDE.md` | Document Codex vs Cursor 0.4 ownership boundary (W7 support leaves CYB-68–71; no release/checkbox claims from Cursor) |
| `docs/superpowers/reports/2026-07-20-0.4-readiness-baseline.md` | Clarify historical audit-time “2.4 unchecked” vs post-baseline closed state; note current superproject tip `9f1d88fd` retaining compiler `79eccbd` |
| `docs/superpowers/plans/2026-07-14-0.4-release-closure.md` | Align pin wording; restate Cursor evidence → Codex CYB-42/44 ownership |
| `CHANGELOG.md` | Unreleased note for this CYB-70 draft packet |
| `openspec/catalog.json` | Mechanical regen: `GUIDE.md` hash + informative-doc prune to match initialized pins |
| `docs/superpowers/reports/2026-07-20-cyb-70-docs-openspec-closure-draft.md` | This draft |

`GLOSSARY.md` reviewed: HIR-free / ABI-v5 wording already matches landed architecture; **no edit**.

### Normative (unchanged by Cursor)

- No edits under `openspec/specs/**` or OpenSpec change requirement bodies.
- No OpenSpec task checkboxes flipped in `openspec/changes/hir-free-isle-abi-v5-native-runtime/tasks.md`.
- Book pages that still mention historical HIR were **not** rewritten (large informative drift; out of CYB-70 “prefer draft evidence over large normative rewrites” / keep-diffs-small boundary).

## OpenSpec checkboxes still unchecked (pending Codex evidence)

Source: `openspec/changes/hir-free-isle-abi-v5-native-runtime/tasks.md`.

### Already checked (do not re-open; Codex-owned ledger)

- 1.1, 1.2, 1.3  
- 2.2, 2.4, 2.5  

### Still unchecked — sections 1–5

- **1.4** retired-pattern / runtime-provenance scans  
- **2.1** complete indexed expanded-AST semantic facts  
- **2.3** exhaustive typed-operation inventory / ISLE rule compiler  
- **2.6** canonical Beskid runtime modules + assembly context exports  
- **2.7** runtime-kit build/validation/exact installed-prefix discovery  
- **3.1–3.6** full consumer migration (frontend, LSP, codegen, JIT/AOT, corelib, CLI/bundles)  
- **4.1–4.5** legacy deletion (HIR, Lowerable, Rust runtime, ABI dispatch, obsolete deps)  
- **5.1–5.6** verify-and-release gates (workspace/matrix/provenance/docs/GitNexus)  
  - Note: **5.5** is the documentation/catalog/evidence checkbox this draft *supports* but does **not** close.

### Still unchecked — section 6 execution waves

- **6.1–6.7** production adapter through sign-off evidence recording  
- **6.8.1, 6.8.1a, 6.8.2, 6.8.3** canonical runtime + kit matrix  
- **6.9.1–6.9.3** complete consumer migration before deletion  
- **6.10.1–6.10.3** retirement, provenance zero-violations, final evidence before release mark  

## Handoff notes for CYB-42 (Codex)

1. Treat this commit as **mechanical draft only**. Codex must attach acceptance evidence before flipping any remaining checkbox, including **5.5**.
2. Release decision remains **At risk** per readiness baseline / closure plan: CYB-12/15 and W2–W7 gates are open; do not claim “beskid 0.4 compiles and executes exclusively via ABI-v5” from this packet.
3. Catalog regen is valid at `d2ab47b88790` with submodules listed above initialized; if CI initializes additional document trees and the informative count rises, re-run `bun run openspec:catalog` under the same checkout policy before merging.
4. Remaining doc follow-ups for Codex (optional, not done here): informative Book HIR wording in `site/website/src/content/docs/book/**` vs HIR-free ABI-v5 story; full `astro build` + trudoc `verify:book-*` once `beskid_web_common` is available.
5. Sibling Cursor leaves still expected for CYB-42 inputs: CYB-68 compiler logs, CYB-69 package/prefix inventory, CYB-71 GitNexus change manifest.
6. Do **not** close CYB-42 or CYB-44 from this evidence alone.

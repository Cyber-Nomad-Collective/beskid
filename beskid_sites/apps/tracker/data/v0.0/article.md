# v0.0 — Pecan prototype (Feb 18 – Mar 5, 2026)

Delivery band **v0.0** captures the **Pecan** language/compiler prototype that preceded the public **Beskid** rename and the split of compiler work into the `compiler` submodule. All provenance in the seed catalog points at the historical **`pekan`** git repository (since deleted); commit SHAs and subjects were preserved from archived history. The band ends at compiler submodule handoff commit `dd75bff` on **2026-03-05**, which opens **v0.1** (*Compiler foundation*).

## Timeline

| Phase | Dates | Focus |
|-------|-------|--------|
| Bootstrap | 2026-02-18 | Initial Pecan workspace (`269ac9d`) |
| Analysis & HIR | 2026-02-21 – 2026-02-28 | Parser, resolver, staged semantic rules, diagnostics, desugar |
| Execution & GC | 2026-02-23 – 2026-02-27 | CLIF lowering roadmap, `gc-arena` integration, execution-plan phases 1–5 |
| Tooling research | 2026-02-26 – 2026-03-04 | `pecan_lsp`, compiler-mod metaprogramming (stage 8), `project.pn`, rename to Beskid |
| Handoff | 2026-03-05 | Compiler history continues in `compiler` repo at `dd75bff` |

## Themes

1. **Staged analysis spine** — Pest-driven parse, HIR with phase-indexed shared core, normalization (for-loop desugar), `HirQuery` traversal, visitor refactors, and a growing `SemanticIssueKind` catalog.
2. **JIT/runtime spikes** — Trait-based CLIF lowering design, runtime allocator hooks, and a **simple** GC research path via in-tree `gc-arena` (not the later parallel collector work in **abfall**).
3. **Historical editor services** — In-process `pecan_lsp` with hover/definition/references/completions; superseded by workspace `beskid lsp` stdio in later bands.
4. **Structure & mods research** — Zig-style `project.pn` manifest exploration (later superseded by `Project.proj` + **pckg**), and **stage-8** metaprogramming experiments for compiler mods.
5. **Concurrency notes only** — Fibers, pointer channels, and syscall-pool models documented in `Plan.md`; implementation deferred to v0.2+.

## Deliverables

| ID | Title | Closed | Tasks (seed numbers) |
|----|-------|--------|----------------------|
| `v00-analysis-foundation` | Analysis and parser foundation | 2026-02-23 | #1–5, #8, #17, #19–22, #24–25 |
| `v00-execution-jit-gc` | Execution and GC prototype | 2026-02-25 | #6–7, #9–12, #18; concurrency #13 |
| `v00-tooling-research` | LSP, metaprogramming, and structure research | 2026-03-04 | #14–16, #23, #26; rename #15 |

## Workstreams

- **compiler-analysis** — Parser, HIR, resolver, diagnostics, desugar, workspace `crates/` layout.
- **codegen-runtime** — Lowering, JIT hooks, `gc-arena`, CI AOT smoke, execution-plan milestones.
- **concurrency-research** — Runtime model research only (no shipping concurrency runtime in v0.0).
- **editor-lsp** — Historical `pecan_lsp` prototype and architecture spec.
- **metaprogramming-mods** — Stage-based compiler-mod metaprogramming (stage 8).
- **project-structure** — `project.pn` manifest research and Pecan→Beskid rename.

## Research outcomes (carried forward)

- **Parser/analysis**: Staged rule pipeline and `HirQuery` traversal informed the later unified `beskid_pipeline` phase model (v0.1+).
- **GC**: `gc-arena` proved a minimal tracing/arena baseline; parallel GC and production runtime collection moved to later repos (**abfall**, phase-B runtime).
- **LSP**: In-process `pecan_lsp` validated IDE service shapes; production path uses `beskid_lsp` + VS Code extension (v0.1+).
- **Projects**: `project.pn` Build API research was **not** adopted; **`Project.proj`** and **pckg** registry flows replaced it.
- **Mods**: Stage-8 metaprogramming informed compiler-mod contracts (`Generator`, `Analyzer`, `Rewritter`) without shipping language-level `meta` blocks.

## Catalog layout

```
data/v0.0/
  version.json          # title, summary, theme, cutoff
  article.md            # this narrative (maintainer reference; not loaded by the app today)
  deliverables/*.json
  workstreams/*.json
  tasks/*.json          # optional body (markdown) + source.repo/commit/subject
```

Validate after edits: `bun run seed:validate`. Preview locally: `ROADMAP_USE_SEED=1 bun run dev`.

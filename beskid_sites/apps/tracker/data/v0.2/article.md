# v0.2 — Analysis, packages, and platform spec

**Window:** 2026-04-23 → 2026-05-22 · **Superrepo:** `f777b79` → `f57377a` (post **v0.1.0** through trudoc verification baseline)

## Theme

v0.2 connects the compiler analysis spine, structured package documentation, and the public normative specification. Work is tracked across **102** completed tasks in **8** workstreams and **10** deliverables.

## Major outcomes

### Platform specification cutover

Legacy Starlight guide trees retire; [`/platform-spec/`](https://beskid-lang.org/platform-spec/) becomes the sole normative documentation area (with the Book as informative reading). **trudoc** packages, frontmatter verification, home browse/map UX, Giscus shell styling, and container build stabilization land in early May.

### Pipeline, services, and api.json

**beskid_pipeline** owns shared progress phases. The compiler splits analysis services, adds a dedicated pipeline crate, and emits hierarchical **api.json**—types, members, signatures, and **typeRef** cross-links. **pckg** requires api.json on publish and renders PackageDocs with a Microsoft Docs–style library tree.

### Macros, composition, and runtime

Macro registry, expand pass, resolver adjustments, and composition HIR/mod-host bridges ship by May 20. Runtime work adds spawn/fiber surfaces, channels, vendored **abfall** GC heap integration, and corelib syscall/console/concurrency packages with CI stack hardening.

### LSP workspace and editor

Compiler LSP gains rename, code actions, inlay hints, signature help, workspace symbols, workspace templates, project explorer, and project graph pipeline. **beskid_vscode** enters the superrepo with Open VSX CI (including cross-arch **darwin** LSP bundles) and modular extension runtime.

### Book, CI, and deploy

Early language book chapters and file-scoped module semantics align with platform-spec articles. CI moves CLI publishing to GitHub Releases, centralizes Nox logging, and hardens corelib prelude lowering on Linux. Deploy fixes use the monorepo **bun** lockfile and skip inactive submodules on shallow Coolify clones.

## Cutoff rationale

Starts immediately after superrepo tag v0.1.0 (f777b79). Spans trudoc/docs-ui bootstrap (May 5), platform-spec cutover (May 6), pipeline/services split plus expanded LSP capabilities (May 9–11), api.json contract in compiler and pckg (May 18–21), macro/composition HIR work (May 20), and ends at f57377a (trudoc verification baseline on 2026-05-22).

## Catalog structure

| Workstream | Focus |
|------------|--------|
| analysis-pipeline | Pipeline crate, api.json, macros/composition, LSP graph |
| platform-spec | Normative spec tree, interop/GC alignment, guide sync |
| pckg-registry | Registry UI, publish gates, PackageDocs |
| docs-site | trudoc, docs-ui, book, registry MDX |
| codegen-runtime | Fibers, channels, abfall GC, lowering CI |
| editor-extension | vscode submodule, Open VSX |
| ci-release | Actions, Nox, CLI releases |
| dev-experience | Submodules, deploy ergonomics |

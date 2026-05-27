## Learned User Preferences

- **Book images:** Do not change `![alt](url)` under `site/website/src/content/docs/book/` unless the user names the file and exact tag. Remote URLs are intentional. On 404: report path, suggest `bun run dev:clean`; do not rewrite tags for CI. User revert on image edits is authoritative.
- **Plans & git:** Execute every listed plan task; use parallel subagents with non-overlapping scopes for multi-part work. Commit/push only when asked. Fresh checkout: `./scripts/setup-environment.sh` (run as subprocess—never `source` scripts that `exit`). No `Co-authored-by: Cursor`. Submodule commit/push: **lazygit only** (`scripts/lazygit/config.yml` → `~/.config/lazygit/`; `U` sync, `P` recursive push—not the shell script directly). No Mission Control / task-board mirroring in-repo.
- **Quality & tone:** Fix CI at the root cause (`gh run list` / `gh run view`). No stub normative spec or implementation. Public READMEs: no emoji; direct Beskid Book tone; prefer practical deploy/container guidance over abstraction.
- **UI:** Match existing Fluent Blazor and `@beskid/beskid-ui` patterns (pckg, tracker, nexus, site). Hub launcher leftmost in app navbars.
- **Compiler & editor:** Corelib stays in `compiler/corelib` (Beskid sources, not a Rust lib crate move). VS Code: thin extension, LSP via middleware; bootstrap `cli-latest` / `beskid lsp`.
- **Spec & site:** Normative spec under `site/website/src/content/docs/platform-spec/` leads code—update before observable behavior changes. **Bun** for `site/website`. One `beskid_pipeline` spine for analyze/run/build/LSP; no divergent paths.

## Learned Workspace Facts

- **Superrepo:** Git submodules (`compiler`, `pckg`, `beskid_vscode`, `beskid_tracker`, `beskid_nexus`, `beskid_web_common`, `beskid_treesitter`, `beskid_templates`, `beskid_infra`). Checkout: `./scripts/setup-environment.sh`; day-to-day: lazygit (`U` / `P`). Toolchain: `scripts/install-deps.sh` + `repo-deps.json`. Shared TS in `beskid_web_common` (`trudoc`, `@beskid/beskid-ui`). CI/Dagger: `beskid_infra/dagger/`, root `dagger.json`.
- **Services:** Docs + marketing in `site/website` (Astro/Starlight). Auth hub in `site/auth/` (one GitHub OAuth for tracker, nexus, pckg). Public hosts: `beskid-lang.org`, `pckg.beskid-lang.org`, `tracker.beskid-lang.org` (see `beskid_infra/docs/deploy-matrix.md`).
- **Compiler & corelib:** Rust workspace in `compiler/`; nested `compiler/corelib` → pckg package **`corelib`**. CLI: rolling `cli-latest` on GitHub; site sync via `bun run --cwd site/website sync:cli-version`. VS Code published from superrepo Open VSX workflow.
- **pckg & grammar:** Registry in `pckg/` (.NET, Compose locally). Tree-sitter in `beskid_treesitter/`; sync from compiler `beskid.pest` via `./scripts/sync-from-pest.sh`.
- **Compiler design:** AOT-only; host composition in Rust; `beskid run` and `beskid build` share the same resolved pipeline input. Crate naming: `beskid_<domain>`; export-only hub modules.

---
title: Hi command
description: Pluggable terminal dashboard shell with BSOL board layouts and a
  command palette.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-09
---

<SpecSection title="Purpose" id="purpose">
`beskid hi` opens the **Beskid Hi shell** — a scope-aware terminal dashboard that hosts pluggable widgets, permanent chrome (shortcuts + command palette), and BSOL-driven board layouts. It does not start a compile pipeline unless the user picks a palette or contextual command that does.
</SpecSection>

<SpecSection title="Command surface" id="command-surface">
- `beskid hi [path]` — resolve scope from optional `path` or the current working directory, then launch the interactive shell when stderr is a TTY.
- `beskid hi --plain [path]` — print the resolved scope label and exit (no TUI).
- Scope resolution walks parents: **workspace** wins over **project**; otherwise **user** scope (`~/.beskid/data`).
</SpecSection>

<SpecSection title="Shell chrome" id="shell-chrome">
The footer chrome is always visible and is not owned by individual widgets. The panes layout tree fills the terminal area above this row.

| Key | Action |
|-----|--------|
| `Ctrl+P` / `:` | Open command palette |
| `?` | Toggle shortcut help overlay |
| `Ctrl+M` / `☰` | Open navigation menu |
| `q` | Quit shell |

Shortcuts are shown **only** in this footer row — not in separate dashboard panels.

Compile pipeline commands (`build`, `analyze`, `test`, …) reuse the same footer chrome and palette when their TUI is active.
</SpecSection>

<SpecSection title="Command palette" id="command-palette">
Palette entries are either:

1. **CLI commands** — marked explicitly; on confirm the shell suspends, runs `beskid <argv>` as a subprocess, then resumes.
2. **Contextual commands** — registered per `ShellScope` and handled in-shell (open overlay, focus widget, layout editor, scope picker, etc.).

The filter box supports a trailing **param mode** for argv tokens (e.g. `pckg install my-pkg`).

Contextual commands include `Open workspace`, `Open project`, and `Layout: Edit` (see layout editor below).
</SpecSection>

<SpecSection title="Board layout (`board.v2`)" id="board-layout">
Widget panels and nested containers are declared in BSOL profile `board.v2`. The shell lowers the document to a [panes](https://docs.rs/panes/) flex layout and resolves geometry with [panes-ratatui](https://docs.rs/panes-ratatui/).

| Scope | Primary config | Fallback |
|-------|----------------|----------|
| Workspace | `<ws-root>/.beskid/board.bsol` | embedded v2 default |
| Project | `<proj>/.beskid/board.bsol` | embedded v2 default |
| User | `~/.beskid/data/boards/default.board.bsol` | embedded `hi-default` v2 layout |

**Load:** `board.v2` validates against the BSOL profile and lowers to `LayoutRuntime`. Legacy `board.v1` files are imported once to an equivalent v2 tree.

**Save:** layout edits emit `board.v2` text to the scope path. Parent directories are created on write.

### Node kinds

| `kind` | Role |
|--------|------|
| `col` / `row` | Flex container; optional `grow`, `min_*`, `fixed_*` on children |
| `split` | Binary split with optional `ratio` (percent for first child) |
| `tabs` / `stack` | Single visible child; optional `active` child id |
| `panel` | Leaf panel; **requires** `widget` id registered in `WidgetRegistry` |

Each leaf `widget` value maps 1:1 to a `BeskidWidget` id (e.g. `hi.welcome`, `shell.log`).
</SpecSection>

<SpecSection title="Pages and navigation (`shell.pages.v1`)" id="pages-nav">
Pages link multiple dashboard layouts inside one scope. Each page references a `board_root` node id in the shared `board.v2` document.

| Scope | Pages config |
|-------|--------------|
| Workspace / project | `<root>/.beskid/pages.bsol` |
| User | `~/.beskid/data/pages/default.pages.bsol` |

The hamburger menu (`Ctrl+M`) shows a hierarchical tree: built-in compiler tools (graphs, compile debugger, analysis, settings, debugger reserved), project flows, user boards, plus entries merged from extension `NavRegistrar` hooks.

Selecting a page switches the active panes root without restarting the shell.
</SpecSection>

<SpecSection title="Layout editor" id="layout-editor">
`Layout: Edit` toggles a **non-blocking** right-side drawer with tabs: Templates, Widgets, Layouts, Structure. The dashboard remains usable; global keys still work.

| Input / command | Action |
|-----------------|--------|
| `+` / `-` | Resize boundary of the focused panel |
| `Esc` | Exit edit mode |
| Templates tab | Apply holy-grail, sidebar-main, single-focus, or dashboard-grid presets |
| Widgets tab | Set or add panels from `WidgetRegistry::descriptors()` |
| Layouts tab | Load saved `.bsol` board files |
| Palette sub-commands | Focus, add/remove, wrap, convert, save, reset |

Focused panels show an inset yellow border. Edits auto-save after debounce (~500ms).
</SpecSection>

<SpecSection title="Views" id="views">
Built-in pages/widgets include:

| View | Widget / page |
|------|----------------|
| Graphs | `graph.deps`, `graph.compile` |
| Compile debugger | `compile.debugger` (timeline, incremental log, traces) |
| Analysis | `analysis.diagnostics` |
| Settings | `shell.settings` (generated from tool settings registry) |
| Packages | `pckg.browser` |
| New project | templates overlay / welcome flow |
| Debugger | `debug.future` (reserved) |

Log panel (`shell.log`) uses tabbed session, build, incremental, and trace streams.
</SpecSection>

<SpecSection title="Tool settings (`tools.config.v1`)" id="tool-settings">
Compiler tools register settings pages via `ToolSettingsRegistrar`. Values persist in BSOL at `~/.beskid/config/tools.bsol` with optional `<root>/.beskid/tools.bsol` overrides.

Built-in pages: shell (layout autosave), pckg (registry URL), templates (registry URL, confirm overwrite).
</SpecSection>

<SpecSection title="Scope picker" id="scope-picker">
`Open workspace` and `Open project` open a file explorer overlay filtered to `.bws` and `.bproj` respectively. On confirm:

1. `ShellScope` resolves from the selected path.
2. Layout reloads from that scope's `board.bsol` (or embedded default).
3. The shell hot-swaps scope and layout without restarting the process.
</SpecSection>

<SpecSection title="Extension API" id="extension-api">
The stable extension surface is `beskid_tools::shell` (`BeskidWidget`, `WidgetRegistry`, `ShellHost`, `ShellScope`). Legacy `beskid_tools::tui` is not a supported extension path.

Extension crates export:

- `WIDGET_CATALOG` + `register_widgets(registry)`
- `NAV_CATALOG` + `register_nav(registry)` — optional hamburger tree entries
- `register_settings(registry)` — optional tool settings pages

`ShellHost::run_hi_blocking` accepts all three registrar slices. `lib.rs` in extension crates is a thin hub (mod + pub use only).
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Shell API: `compiler/crates/beskid_tools/src/shell/`
- Layout module: `compiler/crates/beskid_tools/src/shell/layout/`
- CLI wiring: `compiler/crates/beskid_cli/src/commands/hi.rs`
- BSOL profiles: `board.v1.bsol`, `board.v2.bsol`, `shell.pages.v1.bsol`, `tools.config.v1.bsol`
- Sample extension: `compiler/crates/beskid_hi/`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->

<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Hi command Specification

## Purpose

Pluggable terminal dashboard shell with BSOL board layouts and a command palette.

## Requirements

### Requirement: Hi command surface and scope resolution
`beskid hi [path]` SHALL resolve shell scope from the optional `path` or the current working directory and MUST launch the interactive shell when stderr is a TTY. `beskid hi --plain [path]` SHALL print the resolved scope label and exit without a TUI. Scope resolution SHALL walk parents such that workspace wins over project; otherwise the shell SHALL use user scope at `~/.beskid/data`.

#### Scenario: Plain scope label
- **GIVEN** a workspace root with a `.bws` ancestor
- **WHEN** the user runs `beskid hi --plain` from a nested directory under that workspace
- **THEN** the command prints the resolved workspace scope label and exits without opening the TUI

#### Scenario: Interactive launch on TTY
- **GIVEN** stderr is a TTY and a resolvable scope path
- **WHEN** the user runs `beskid hi [path]`
- **THEN** the interactive Hi shell launches for the resolved scope and does not start a compile pipeline unless the user selects a palette or contextual command that does

### Requirement: Permanent shell chrome shortcuts
The Hi shell footer chrome SHALL always be visible, SHALL NOT be owned by individual widgets, and SHALL be the only place shortcuts are shown. The shell MUST honor `Ctrl+P` / `:` for the command palette, `?` for shortcut help, `Ctrl+M` / hamburger for the navigation menu, and `q` to quit.

#### Scenario: Footer-owned shortcuts
- **GIVEN** an active Hi shell session with widgets loaded
- **WHEN** the user presses `Ctrl+P` or `:`
- **THEN** the command palette opens from the permanent footer chrome and no separate dashboard panel is required to expose that shortcut

### Requirement: Command palette CLI and contextual entries
The command palette SHALL expose CLI command entries that, on confirm, suspend the shell, run `beskid <argv>` as a subprocess, then resume; and contextual commands registered per `ShellScope` that are handled in-shell. The filter box MUST support a trailing param mode for argv tokens.

#### Scenario: CLI command from palette
- **GIVEN** an active Hi shell and a palette entry marked as a CLI command
- **WHEN** the user confirms that entry (optionally with trailing argv tokens)
- **THEN** the shell suspends, runs `beskid <argv>` as a subprocess, and resumes after the subprocess completes

### Requirement: Board.v2 layout load and save
Widget panels and nested containers SHALL be declared in BSOL profile `board.v2`. Load SHALL validate against the BSOL profile and lower to `LayoutRuntime`, importing legacy `board.v1` files once to an equivalent v2 tree. Save of layout edits SHALL emit `board.v2` text to the scope path and MUST create parent directories on write. Scope config paths SHALL be workspace/project `<root>/.beskid/board.bsol` or user `~/.beskid/data/boards/default.board.bsol`, each falling back to the embedded v2 default when absent.

#### Scenario: Load board for workspace scope
- **GIVEN** a workspace scope with a valid `board.v2` document at `<ws-root>/.beskid/board.bsol`
- **WHEN** the Hi shell loads the board layout
- **THEN** the document validates against the `board.v2` profile and lowers to a `LayoutRuntime` panes tree

#### Scenario: Save creates parent directories
- **GIVEN** layout edits in a scope whose `.beskid` directory does not yet exist
- **WHEN** the shell saves the board
- **THEN** parent directories are created and `board.v2` text is written to the scope board path

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Hi command

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/cli/hi-command/`  
**Source:** `site/spec-content/platform-spec/tooling/cli/hi-command/content.md`  
**SHA-256:** `03f5be097aaa028ebfc214f5ca42de9b617018cde597be60a286c469f47e46bb`

<details>
<summary>Migrated source text</summary>

``````markdown
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
``````

</details>

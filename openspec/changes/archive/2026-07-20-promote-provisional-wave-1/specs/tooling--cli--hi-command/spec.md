## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Hi command conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.

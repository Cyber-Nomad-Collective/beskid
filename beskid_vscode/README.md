# Beskid VS Code Extension

VS Code support for Beskid source (`.bd`) and project (`.proj`) files, powered by the Beskid Language Server Protocol (LSP) server.

## Features

- Activates on `beskid` language files
- Associates both `.bd` and `.proj` with Beskid
- Uses bundled platform LSP binaries by default (`server/<platform>-<arch>/`)
- Supports explicit local binary override via `beskid.lsp.server.path`
- Supports source/dev launch mode for compiler contributors

## Development (Bun)

```bash
bun install
bun run build
```

Press `F5` in VS Code to run the extension in an Extension Development Host.

## Default server command

By default the extension runs the bundled LSP binary for your platform.

If the bundled binary is unavailable, either:
- set `beskid.lsp.server.path` to a local `beskid_lsp` binary, or
- enable `beskid.lsp.server.devMode` and use source mode:

```bash
cargo run -p beskid_lsp
```

with CWD = workspace root.

You can override in VS Code settings:

- `beskid.lsp.server.devMode`
- `beskid.lsp.server.command`
- `beskid.lsp.server.args`
- `beskid.lsp.server.cwd`
- `beskid.lsp.server.debugArgs`
- `beskid.lsp.server.path`

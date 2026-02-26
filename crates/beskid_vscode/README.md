# Beskind VS Code Extension

Minimal VS Code client for the Beskid language server.

## Features

- Activates on `beskid` language files
- Associates both `.bd` and `.proj` with Beskid
- Starts the server over stdio using configurable command/args

## Development (Bun)

```bash
bun install
bun run build
```

Press `F5` in VS Code to run the extension in an Extension Development Host.

## Default server command

By default the extension runs:

```bash
cargo run -p beskid_lsp
```

with CWD = workspace root.

You can override in VS Code settings:

- `beskid.lsp.server.command`
- `beskid.lsp.server.args`
- `beskid.lsp.server.cwd`
- `beskid.lsp.server.debugArgs`

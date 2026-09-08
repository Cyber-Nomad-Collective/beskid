# Zed Extension SDK Parity Design

## Goal

Move the Beskid Zed extension out of the repository root into the dedicated
`editors/zed/` crate and make it a registry-compatible Zed language extension
that reproduces every Beskid VS Code capability exposed by Zed's supported
extension APIs.

## Scope and parity boundary

The extension uses the official `zed_extension_api` Rust SDK at version
`0.7.0` and compiles as a WebAssembly component for `wasm32-wasip2`. It does
not depend on compiler implementation crates. The native `beskid_lsp` remains
the semantic authority for diagnostics, completion, hover, navigation,
references, symbols, semantic tokens, formatting, and workspace knowledge.

Zed does not expose supported extension APIs for arbitrary commands, custom
tree views, webviews, status-bar items, task providers, secret storage, or
editor event listeners. Consequently, VS Code's Projects and Packages trees,
Graph Explorer, dashboard, status bar, package-registry webview, and automatic
focused-project tracking cannot be recreated by a registry extension. The Zed
extension must not claim those surfaces. It instead provides all supported
equivalents: language registration, Tree-sitter queries, semantic-token rules,
LSP launch and configuration, runnables, snippets, and documented project task
templates. A native Zed fork is explicitly outside this design.

## Repository architecture

`editors/zed/` is the single Zed package root and owns:

- `Cargo.toml`, `Cargo.lock`, and `src/` for the WASM adapter;
- `extension.toml` and `extension.wasm` for Zed packaging;
- `languages/` for Beskid source and manifest language definitions and queries;
- `grammars/beskid.wasm` for the packaged parser artifact;
- `snippets/` for editor-native Beskid snippets;
- `README.md` and `LICENSE` required by users and the Zed registry.

The superrepository root no longer acts as a Cargo package or Zed package.
Root CI and publishing workflows point to `editors/zed`. The Zed registry can
continue using the public `beskid` repository as its submodule and set
`path = "editors/zed"`; a separate Git repository is unnecessary.

The compiler repository continues to own `beskid_lsp` and its release assets.
`beskid_treesitter` continues to own grammar source. The Zed package contains
only the generated grammar artifact and a pinned upstream grammar revision.
Project-local `.zed/` settings and tasks remain developer configuration, not
extension package content; duplicated language and grammar files there are
removed so packaged extension files are the canonical implementation.

## Crate design

The adapter is split into focused modules:

- `src/lib.rs` registers `BeskidExtension` and implements the Zed trait.
- `src/language_server.rs` resolves user overrides, installed tools, release
  assets, cache paths, command arguments, and environment.
- `src/platform.rs` maps supported Zed OS/architecture pairs to exact compiler
  release asset and executable names.
- `src/settings.rs` reads Zed LSP settings and forwards initialization options
  and workspace configuration without inventing a second configuration model.

Pure platform, command-selection, cache-path, and settings functions are unit
tested on the host. Zed host calls remain at the thin trait boundary.

## Language-server resolution

For the `beskid-lsp` adapter, resolution is deterministic:

1. Respect Zed's `lsp.beskid-lsp.binary` override. When `path` is present, use
   it with the configured arguments and environment exactly.
2. Otherwise use `beskid_lsp` discovered through `Worktree::which`, launching
   it with `--stdio` and the worktree shell environment.
3. Otherwise use `beskid` discovered through `Worktree::which`, launching
   `beskid dev tooling lsp` with the worktree shell environment.
4. Otherwise query the compiler repository's `lsp-stable` GitHub release,
   select the exact supported platform asset, download it into the extension
   work directory when absent, mark it executable where required, and launch
   it with `--stdio`.

Supported published assets remain Linux x86-64, macOS arm64, and Windows
x86-64. Other targets fail closed with an explicit platform error until the
compiler release pipeline publishes matching assets. Download permission is
restricted to `github.com/Cyber-Nomad-Collective/beskid_compiler/**`, and
process execution is restricted to the Beskid executables/arguments the
adapter actually uses.

Installation status transitions are `CheckingForUpdate`, `Downloading`,
`Failed`, then `None` on success. Cached binaries include the release version
in their filename, making release updates atomic without overwriting a running
server.

## Configuration and editor features

Both `Beskid` (`.bd`) and `Beskid Manifest` (`.bproj`, `.bws`) attach to the
same `beskid-lsp` adapter with explicit LSP language IDs. Zed-provided
`initialization_options`, `settings`, binary arguments, and environment are
forwarded through the SDK. The extension does not manufacture
`focusedProjectUri`, because the SDK exposes neither active-editor events nor
workspace-state storage.

The package provides and verifies:

- Tree-sitter highlights, tags, outline, indentation, bracket, and runnable
  queries for `.bd` files;
- manifest editing configuration and LSP attachment for `.bproj` and `.bws`;
- semantic-token mappings for Beskid-specific token types advertised by the
  LSP;
- snippets for canonical Beskid declarations;
- runnable captures for tests and entry points, backed by documented Zed task
  templates that invoke `beskid test`, `beskid run`, `beskid build`,
  `beskid analyze`, `beskid fetch`, and `beskid lock`;
- README guidance for binary overrides, LSP settings, tasks, logs, and the
  known SDK parity boundary.

## Build, publishing, and migration

The package gate builds with `cargo build --release --target wasm32-wasip2`
using `editors/zed/Cargo.toml`, verifies the emitted component exists, checks
manifest and language registrations, validates restricted capabilities, and
compares the reproducible build output with `editors/zed/extension.wasm`.
Unit tests run before the WASM build. The publish workflow passes
`extension-path: editors/zed`.

Migration removes the old root `Cargo.toml`, `Cargo.lock`, `src/`,
`extension.toml`, `extension.wasm`, `languages/`, and `grammars/` paths after
their contents are moved. CI rejects reintroduction of root Zed package files
or duplicate `.zed` package artifacts.

## Error handling

Unknown language-server IDs, unreadable settings, missing release assets,
denied capabilities, failed downloads, unsupported platforms, and executable
permission failures return descriptive Zed extension errors. No fallback may
silently launch an unrelated executable, ignore explicit user arguments, or
claim success after a failed installation step.

## Verification

Completion requires all of the following evidence:

1. Host unit tests pass for platform mapping, override/PATH/download priority,
   arguments/environment preservation, cache naming, and error cases.
2. The package contract test passes against `editors/zed` and proves root
   package paths are absent.
3. A release `wasm32-wasip2` build matches the tracked `extension.wasm`.
4. The manifest registers both languages, uses SDK `0.7.0`, restricts
   capabilities, and points to the pinned grammar revision.
5. Query files compile or are validated against the packaged Tree-sitter
   grammar, and runnable captures have fixtures.
6. The repository's focused Zed CI test and static workflow checks pass.
7. GitNexus change detection reports only the expected Zed package, CI,
   documentation, glossary, and changelog surfaces.
8. When a local Zed application is available, installing `editors/zed` as a
   development extension succeeds and a Beskid fixture starts the language
   server. If the installed application cannot be automated, the exact manual
   smoke procedure and the unavailable evidence are reported rather than
   represented as verified.

## Decisions

- Use the supported registry extension model, not a native Zed fork.
- Keep the extension in this repository at `editors/zed`, using the registry
  `path` field for publication.
- Use only `zed_extension_api` directly unless a later test demonstrates a
  concrete WASI-compatible dependency need.
- Keep semantic and workspace behavior in `beskid_lsp`; keep editor glue thin.
- Remove duplicate root and `.zed` package implementations after migration.

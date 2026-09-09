# Beskid for Zed

This registry-compatible extension provides Beskid source and manifest language
support in Zed. It uses the official Rust SDK,
`zed_extension_api = "0.7.0"`, and its Rust adapter is compiled as a
`wasm32-wasip2` WebAssembly component. Native `beskid_lsp` remains the single
authority for semantic and workspace behavior.

## Install

Install **Beskid** from Zed's Extensions view. The extension recognizes `.bd`
source files, `.bproj` and `.bws` manifests, and standalone `.bsol` documents.

To load this checkout for development:

1. Install the `wasm32-wasip2` Rust target with
   `rustup target add wasm32-wasip2`.
2. Build and refresh the packaged component from the repository root:

   ```sh
   cargo build --release --target wasm32-wasip2 --manifest-path editors/zed/Cargo.toml
   cp editors/zed/target/wasm32-wasip2/release/beskid_zed_extension.wasm editors/zed/extension.wasm
   ```

3. In Zed's command palette, run `zed: install dev extension` and select the
   `editors/zed` directory. Reload the development extension after rebuilding.

The repository's `Zed extension: Build package`, `Test package`, `Test language
assets`, and development-install instruction tasks expose the same workflow.

## Language-server resolution

The adapter resolves the native server in this exact order:

1. `lsp.beskid-lsp.binary.path`, preserving configured arguments and
   environment exactly.
2. `beskid_lsp` on the worktree `PATH`, invoked with `--stdio`.
3. `beskid` on the worktree `PATH`, invoked as `beskid lsp`.
4. The exact asset from the compiler repository's rolling `lsp-stable` GitHub
   release, cached under its immutable release version and invoked with
   `--stdio`.

An explicit trusted binary override in Zed settings has this shape:

```json
{
  "lsp": {
    "beskid-lsp": {
      "binary": {
        "path": "/absolute/path/to/beskid_lsp",
        "arguments": ["--stdio"],
        "env": {
          "BESKID_LOG": "debug"
        }
      }
    }
  }
}
```

The adapter also forwards Zed's initialization options and workspace settings
unchanged. Put compiler-supported values inside the two objects; the extension
does not reinterpret them or create a second configuration model:

```json
{
  "lsp": {
    "beskid-lsp": {
      "initialization_options": {},
      "settings": {}
    }
  }
}
```

Changing server settings takes effect on Zed's next language-server restart.
The extension cannot manufacture VS Code's `focusedProjectUri`, because Zed's
registry SDK does not expose active-editor events or workspace-state storage.

### Download fallback platforms

The platform restriction applies only when resolution reaches the release
download. An explicit override or PATH installation can still work elsewhere.

| Host | Release asset | Download fallback |
| --- | --- | --- |
| Linux x86-64 | `beskid_lsp-linux-amd64` | Supported |
| macOS arm64 | `beskid_lsp-darwin-arm64` | Supported |
| Windows x86-64 | `beskid_lsp-windows-amd64.exe` | Supported |
| Any other OS/architecture | None | Fails closed with an unsupported-platform error |

## Editor features and tasks

The package owns Tree-sitter highlighting, symbols, outline, indentation,
brackets, runnable captures, and declaration snippets. `.bsol`, `.bproj`, and
`.bws` all reuse the one pinned BSOL grammar for structural highlighting.
Standard semantic token types from `beskid_lsp` add configuration-aware roles
through Zed's built-in mappings. To combine them with Tree-sitter highlighting,
set `"semantic_tokens": "combined"` in Zed settings.
The package intentionally has no custom semantic-token rules because the server
advertises standard token types only; Beskid-specific token types would require
verified mappings before being added.

Standalone `.bsol` documents use the same native `beskid_lsp` through Zed's
`bsol` language ID. They receive generic BSOL syntax diagnostics and the
`@schemaless` completion and hover help, plus Tree-sitter highlighting from
the exact `beskid_bsol` submodule commit. The extension manifest uses Zed's
grammar `path = "grammars/tree-sitter-bsol"` support, so the nested grammar is
packaged without a second LSP adapter or installer.

Source runnables use these pinned top-level compiler commands:

| Action | Command template |
| --- | --- |
| Test current source | `beskid test $ZED_FILE` |
| Run captured entry point | `beskid run $ZED_FILE --entrypoint $ZED_CUSTOM_entrypoint` |
| Build current source | `beskid build $ZED_FILE` |
| Analyze current source | `beskid analyze $ZED_FILE` |
| Fetch project dependencies | `beskid fetch` |
| Lock project dependencies | `beskid lock` |

The first two appear beside matching source declarations through
`runnables.scm`; all templates are available through Zed's task picker.

## SDK-supported parity with VS Code

SDK-supported parity means reproducing a VS Code capability through a supported
Zed registry API or Zed-native declarative asset. It does not mean simulating a
surface for which the SDK has no host capability.

| VS Code capability | Zed status | Zed implementation |
| --- | --- | --- |
| Diagnostics, completion, hover, go-to-definition, references, document/workspace symbols, formatting, and semantic tokens | LSP-native | The same native `beskid_lsp`, with initialization and workspace configuration forwarded unchanged |
| `.bd`, `.bproj`, `.bws`, and `.bsol` language association | Re-expressed | Zed language manifests and explicit LSP language IDs |
| Syntax highlighting and symbols | Re-expressed | Packaged Tree-sitter grammar plus highlight, tag, and outline queries |
| Standalone `.bsol` Tree-sitter highlighting | Re-expressed | Pinned `beskid_bsol` grammar at `grammars/tree-sitter-bsol` with a package-owned adapted highlights query |
| Declaration snippets | Re-expressed | Zed JSON snippets for module, function, type, contract, enum, and test declarations |
| Test, run, build, analyze, fetch, and lock actions | Re-expressed | Runnable captures and Zed task templates using the pinned top-level CLI |
| Projects and Packages tree views | Unsupported UI | Registry extensions cannot register custom tree views |
| Graph Explorer, dashboard, and package-registry webviews | Unsupported UI | Registry extensions cannot create webviews or custom panels |
| Beskid status-bar entry | Unsupported UI | Registry extensions cannot add status-bar items |
| Arbitrary VS Code commands and task providers | Unsupported UI | Registry extensions cannot register arbitrary editor commands or task providers; declarative tasks are used where possible |
| Automatic focused-project tracking | Unsupported UI | Registry extensions lack active-editor event and workspace-state APIs |
| VS Code secret storage | Unsupported UI | Registry extensions do not expose the corresponding secret-storage API |

## Troubleshooting and logs

- Run `zed: open log` from the command palette for extension compilation,
  capability, download, and launch errors.
- Run `dev: open language server logs`, then select **Beskid Language Server**,
  for the native server protocol log.
- If the server is missing, run `command -v beskid_lsp` or
  `command -v beskid` in Zed's terminal, or configure the absolute override
  above. Zed uses the worktree environment, which can differ from a login shell.
- If a downloaded server fails, verify that the host appears in the supported
  matrix and reload the development extension. Failed installs are reported as
  failed; the adapter does not silently launch another executable.

### Release readiness

Registry publication fails closed unless the compiler repository exposes an
`lsp-stable` release containing `lsp-version.txt`, `release-state.json`, and all
three platform assets listed above. The release state must describe a
publishable stable build with successful gates, three complete platforms, and
the exact compiler commit pinned by the tagged root repository. A missing
release (including an HTTP 404), incomplete state, provenance mismatch, or
missing asset blocks the publication job before the registry action.
Maintainers must repair the stable release; the workflow does not substitute
`lsp-unstable` or advertise a clean-machine download that cannot succeed.
During such an outage, development can continue with an explicit binary
override or a PATH-installed `beskid_lsp`/`beskid`.

### Initial registry publication

The community publication action updates an extension that already exists in
`zed-industries/extensions`; it cannot create Beskid's first registry entry.
After the exact root commit is public on a branch, manually tested as a Zed
development extension, and backed by a complete `lsp-stable` release, the
initial registry pull request must add the root Beskid repository as the
`extensions/beskid` submodule. Its top-level `extensions.toml` entry is:

```toml
[beskid]
submodule = "extensions/beskid"
path = "editors/zed"
version = "0.4.598"
```

Run `pnpm sort-extensions` in the registry checkout before opening the pull
request. The version above must exactly match this package's `extension.toml`.
Once Zed maintainers merge the initial entry, future releases use the guarded
tag workflow: bump the manifest, merge and test the public root commit, verify
`lsp-stable`, then push the matching `v<version>` tag. Publication rejects a tag
whose version differs from `editors/zed/extension.toml`. The workflow updates
the registry gitlink at `extensions/beskid`; the registry's `path` field
selects this nested package. Maintainers must first configure `COMMITTER_TOKEN`
with the community action's documented cross-repository `repo` and `workflow`
scopes. With no fixed `push-to` repository, the action creates or reuses that
committer's fork of `zed-industries/extensions` instead of targeting a missing
organization fork. The workflow pins the reviewed community action source at
[`11b0e4805c1f4382a4bb3b1a9b17be328e1559c3`](https://github.com/huacnlee/zed-extension-action/commit/11b0e4805c1f4382a4bb3b1a9b17be328e1559c3)
and grants the repository `GITHUB_TOKEN` read-only contents access; registry
writes use only the separately configured committer token.

## Verify the package

From the repository root:

```sh
bash scripts/ci/test/zed-extension-package.test.sh
bash scripts/ci/test/zed-language-assets.test.sh
```

The publication workflow runs both gates, validates the complete stable LSP
release and its compiler provenance, and checks the tag against the manifest
version before updating the `extensions/beskid` registry gitlink. The package
gate also compares the BSOL manifest pin with the staged gitlink and initialized
checkout, so a coordinated grammar update can be verified before it is
committed. Initial publication follows the manual registry pull-request
procedure above.

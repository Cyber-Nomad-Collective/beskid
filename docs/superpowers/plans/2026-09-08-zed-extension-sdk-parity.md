# Zed Extension SDK Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Beskid Zed package to `editors/zed` and deliver every VS Code-equivalent capability supported by Zed's official extension SDK.

**Architecture:** A small `wasm32-wasip2` adapter crate owns binary resolution and Zed settings forwarding; the native Beskid LSP remains the semantic authority. Language metadata, Tree-sitter queries, runnables, snippets, the packaged grammar, documentation, and license live beside the crate in the single registry package root.

**Tech Stack:** Rust 2021, `zed_extension_api` 0.7.0, WebAssembly component target `wasm32-wasip2`, Tree-sitter queries, Bash contract tests, OpenSpec 1.6.

**Spec:** `docs/superpowers/specs/2026-09-08-zed-extension-sdk-parity-design.md`

## Global Constraints

- Use the supported Zed registry extension model; do not modify or fork Zed.
- The only extension SDK dependency is `zed_extension_api = "0.7.0"` unless a failing test proves another dependency necessary.
- The extension package root is exactly `editors/zed`; no Zed package implementation remains at the repository root or under `.zed`.
- Build the Rust extension for `wasm32-wasip2`, never `wasm32-wasip1`.
- Keep `beskid_lsp` as semantic and workspace authority; do not parse Beskid manifests or rebuild graphs in the extension.
- Resolve an explicit Zed binary override first, then `beskid_lsp` on PATH, then `beskid` on PATH as `beskid lsp`, then the `lsp-stable` GitHub release.
- Preserve explicit binary arguments and environment exactly; default native-server invocation uses `--stdio`.
- Supported release assets are Linux x86-64, macOS arm64, and Windows x86-64; all other pairs fail closed.
- Restrict download capability to `github.com/Cyber-Nomad-Collective/beskid_compiler/**` and process execution to Beskid commands.
- Do not modify initialized submodule content or submodule gitlinks.
- Do not add `Co-authored-by` commit trailers.

---

### Task 1: Normative Zed extension contract

**Files:**
- Create: `openspec/changes/zed-extension-sdk-parity/proposal.md`
- Create: `openspec/changes/zed-extension-sdk-parity/design.md`
- Create: `openspec/changes/zed-extension-sdk-parity/tasks.md`
- Create: `openspec/changes/zed-extension-sdk-parity/specs/tooling--zed-extension--extension-surface/spec.md`

**Interfaces:**
- Consumes: the approved design and existing `tooling--vscode-extension` capabilities.
- Produces: normative SHALL requirements for package ownership, SDK use, binary resolution, supported parity, unsupported UI claims, and verification.

- [ ] **Step 1: Write the OpenSpec delta**

Use requirements with concrete scenarios. At minimum encode:

```markdown
## ADDED Requirements

### Requirement: Registry-compatible package boundary
The Beskid Zed extension SHALL be rooted at `editors/zed`, SHALL use
`zed_extension_api` version `0.7.0`, and SHALL compile for `wasm32-wasip2`.

#### Scenario: Package gate builds the extension
- **WHEN** the Zed package gate runs
- **THEN** it builds `editors/zed/Cargo.toml` for `wasm32-wasip2`
- **AND** no root `extension.toml` or root Zed Rust package exists
```

Add separate requirements/scenarios for deterministic binary resolution,
fail-closed platforms, LSP/settings forwarding, language/query/snippet/runnable
assets, restricted capabilities, and honest unsupported-UI documentation.

- [ ] **Step 2: Validate the change**

Run:

```bash
pnpm exec openspec validate zed-extension-sdk-parity --strict --no-interactive
```

Expected: exit 0 with the change valid.

- [ ] **Step 3: Commit**

```bash
git add openspec/changes/zed-extension-sdk-parity
git commit -m "spec: define Zed SDK parity contract"
```

### Task 2: Move the package and lock its build contract

**Files:**
- Modify: `scripts/ci/test/zed-extension-package.test.sh`
- Create: `editors/zed/Cargo.toml`
- Create: `editors/zed/Cargo.lock`
- Create: `editors/zed/extension.toml`
- Create: `editors/zed/src/lib.rs`
- Create: `editors/zed/languages/beskid/config.toml`
- Create: `editors/zed/languages/beskid/highlights.scm`
- Create: `editors/zed/languages/beskid/tags.scm`
- Create: `editors/zed/languages/beskid-manifest/config.toml`
- Create: `editors/zed/grammars/beskid.wasm`
- Create: `editors/zed/LICENSE`
- Delete: root `Cargo.toml`, `Cargo.lock`, `extension.toml`, `extension.wasm`, `src/`, `languages/`, and `grammars/beskid.wasm`

**Interfaces:**
- Consumes: existing root Zed package contents.
- Produces: one package at `editors/zed` whose release artifact is `editors/zed/target/wasm32-wasip2/release/beskid_zed_extension.wasm`.

- [ ] **Step 1: Change the package test first**

Make the test assert the new root and target before moving files:

```bash
extension_root="${root}/editors/zed"
[[ -f "${extension_root}/Cargo.toml" ]] || fail 'missing editors/zed Cargo package'
[[ ! -e "${root}/extension.toml" ]] || fail 'legacy root Zed package remains'
cargo test --manifest-path "${extension_root}/Cargo.toml"
cargo build --release --target wasm32-wasip2 --manifest-path "${extension_root}/Cargo.toml"
```

- [ ] **Step 2: Run the contract test and verify RED**

Run `bash scripts/ci/test/zed-extension-package.test.sh`.

Expected: FAIL with `missing editors/zed Cargo package`.

- [ ] **Step 3: Move the package into `editors/zed`**

Move all package files without changing behavior. Add the MIT license text at
the package root. Update the manifest language-server declaration to current
SDK shape:

```toml
[language_servers.beskid-lsp]
name = "Beskid Language Server"
languages = ["Beskid", "Beskid Manifest"]

[language_servers.beskid-lsp.language_ids]
"Beskid" = "beskid"
"Beskid Manifest" = "beskid-manifest"
```

- [ ] **Step 4: Build the current adapter for WASI Preview 2**

Run:

```bash
rustup target add wasm32-wasip2
cargo test --manifest-path editors/zed/Cargo.toml
cargo build --release --target wasm32-wasip2 --manifest-path editors/zed/Cargo.toml
```

Copy the generated component to `editors/zed/extension.wasm` and rerun the
package test. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Cargo.toml Cargo.lock src extension.toml extension.wasm languages grammars editors/zed scripts/ci/test/zed-extension-package.test.sh
git commit -m "refactor: isolate the Zed extension crate"
```

### Task 3: Implement deterministic SDK-native LSP resolution

**Files:**
- Create: `editors/zed/src/platform.rs`
- Create: `editors/zed/src/language_server.rs`
- Create: `editors/zed/src/settings.rs`
- Modify: `editors/zed/src/lib.rs`
- Modify: `editors/zed/extension.toml`

**Interfaces:**
- Produces: `PlatformAsset { asset_name: &'static str, binary_name: &'static str, executable: bool }`.
- Produces: `LaunchSettings { path: Option<String>, arguments: Vec<String>, environment: Vec<(String, String)> }`.
- Produces: pure `select_launch(override, lsp_path, cli_path) -> LaunchChoice` used by the Zed trait boundary.
- Consumes: `zed::settings::LspSettings`, `zed::Worktree`, `zed::GithubRelease`, and SDK download/status functions.

- [ ] **Step 1: Add failing platform tests**

```rust
#[test]
fn maps_published_release_assets() {
    assert_eq!(platform_asset(Os::Linux, Arch::X86_64).unwrap().asset_name,
               "beskid_lsp-linux-amd64");
    assert_eq!(platform_asset(Os::Mac, Arch::Aarch64).unwrap().asset_name,
               "beskid_lsp-darwin-arm64");
    assert_eq!(platform_asset(Os::Windows, Arch::X86_64).unwrap().binary_name,
               "beskid_lsp.exe");
}

#[test]
fn rejects_unpublished_release_asset() {
    assert!(platform_asset(Os::Linux, Arch::Aarch64).unwrap_err()
        .contains("unsupported platform"));
}
```

Run `cargo test --manifest-path editors/zed/Cargo.toml platform` and verify
compilation fails because the module and types do not exist.

- [ ] **Step 2: Implement platform mapping and make tests green**

Use internal host-testable `Os` and `Arch` enums, converting from Zed SDK types
only in `lib.rs`. Rerun the focused tests and expect PASS.

- [ ] **Step 3: Add failing launch-priority tests**

Cover exact choices:

```rust
assert_eq!(select_launch(Some(override_settings), Some("/bin/beskid_lsp"), Some("/bin/beskid")),
           LaunchChoice::Override(expected_override));
assert_eq!(select_launch(None, Some("/bin/beskid_lsp"), Some("/bin/beskid")),
           LaunchChoice::LspOnPath("/bin/beskid_lsp".into()));
assert_eq!(select_launch(None, None, Some("/bin/beskid")),
           LaunchChoice::CliOnPath("/bin/beskid".into()));
assert_eq!(select_launch(None, None, None), LaunchChoice::Download);
```

Also test that override arguments and environment remain unchanged and that
default commands become `beskid_lsp --stdio` and `beskid lsp`.

- [ ] **Step 4: Implement launch selection and make tests green**

Keep host-independent policy pure. The SDK boundary reads
`LspSettings::for_worktree`, calls `worktree.which`, supplies
`worktree.shell_env`, and performs release/download operations only for
`LaunchChoice::Download`.

- [ ] **Step 5: Add failing settings-forwarding tests**

Test helpers returning the provided `initialization_options` and `settings`
unchanged and `None` when absent. Verify RED, implement the helpers, then verify
GREEN.

- [ ] **Step 6: Wire the Zed trait and restrict capabilities**

Implement `language_server_command`, `language_server_initialization_options`,
and `language_server_workspace_configuration`. Replace wildcard capabilities
with exact Beskid command and repository paths supported by Zed's schema.

- [ ] **Step 7: Verify and commit**

```bash
cargo fmt --manifest-path editors/zed/Cargo.toml -- --check
cargo test --manifest-path editors/zed/Cargo.toml
cargo build --release --target wasm32-wasip2 --manifest-path editors/zed/Cargo.toml
```

Refresh `editors/zed/extension.wasm`, rerun the package test, then commit as
`feat: implement Zed SDK language-server resolution`.

### Task 4: Add supported language-feature parity

**Files:**
- Create: `editors/zed/languages/beskid/outline.scm`
- Create: `editors/zed/languages/beskid/indents.scm`
- Create: `editors/zed/languages/beskid/brackets.scm`
- Create: `editors/zed/languages/beskid/runnables.scm`
- Create: `editors/zed/languages/beskid/semantic_token_rules.json`
- Create: `editors/zed/snippets/beskid.json`
- Create: `editors/zed/tests/fixtures/runnables.bd`
- Create: `scripts/ci/test/zed-language-assets.test.sh`

**Interfaces:**
- Consumes: node kinds already used by `highlights.scm` and `tags.scm`, including `function_definition`, `test_definition`, `type_definition`, `enum_definition`, `contract_definition`, `host_definition`, and `module_declaration`.
- Produces: valid Zed Tree-sitter captures and snippets; runnable tags invoke the documented `beskid` CLI task templates.

- [ ] **Step 1: Write the failing asset contract test**

Assert every required file exists and is nonempty, JSON files parse, forbidden
VS Code UI claims are absent from the README, and queries include the required
node/capture names. Run it and verify it fails on missing `outline.scm`.

- [ ] **Step 2: Add outline, indentation, and bracket queries**

Use grammar-backed captures, including:

```scheme
(function_definition name: (identifier) @name) @item
(test_definition name: (identifier) @name) @item
(type_definition name: (identifier) @name) @item
```

Add indentation captures for block-bearing nodes and bracket pairs only when
the packaged grammar recognizes those nodes/tokens.

- [ ] **Step 3: Add runnables and fixtures**

Capture `test_definition` and the canonical entry function shape using Zed's
`@run`/metadata conventions from current official examples. The fixture must
contain one named test and one entry function, and the contract test must prove
both query patterns exist.

- [ ] **Step 4: Add semantic-token rules and snippets**

Map only token types advertised by `beskid_lsp`; add snippets for module,
function, type, contract, enum, and test declarations. Parse both JSON files in
the contract test.

- [ ] **Step 5: Validate and commit**

Run the asset test and package test. Commit as
`feat: add Zed-native Beskid language features`.

### Task 5: Wire publication, developer tasks, and canonical documentation

**Files:**
- Modify: `.github/workflows/publish-zed-extension.yml`
- Modify: `.zed/tasks.json`
- Modify: `.zed/settings.json`
- Delete: `.zed/grammars/beskid.wasm`
- Delete: `.zed/languages/beskid/config.toml`
- Delete: `.zed/languages/beskid-manifest/config.toml`
- Create: `editors/zed/README.md`
- Modify: `GUIDE.md`
- Modify: `GLOSSARY.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: `editors/zed` package commands and documented Zed task variables.
- Produces: publish workflow `extension-path: editors/zed`, developer build/test tasks, and user-facing setup/parity documentation.

- [ ] **Step 1: Extend the package contract test and verify RED**

Assert the workflow contains `extension-path: editors/zed`, duplicate `.zed`
package files are absent, and `.zed/tasks.json` invokes the new package gate.
Run the test and observe the expected failure.

- [ ] **Step 2: Update workflow and developer configuration**

Point publication at `editors/zed`. Keep `.zed/settings.json` only for repository
editing preferences. Replace duplicate grammar build tasks with package build,
test, and install-dev instructions that reference `editors/zed`.

- [ ] **Step 3: Document operation and limitations**

The package README must include installation, binary resolution order, explicit
binary override JSON, initialization/workspace settings JSON, task templates,
logs, manual dev-extension loading, supported platform matrix, and an exact
table of VS Code features that are LSP-native, re-expressed, or unsupported by
the current Zed SDK.

- [ ] **Step 4: Maintain repository docs**

Update `GUIDE.md` with the new crate path and commands. Add glossary entries for
`Zed extension adapter` and `SDK-supported parity`. Add Keep-a-Changelog bullets
under `[Unreleased]` for the move, SDK correction, supported parity, and removal
of duplicate package paths.

- [ ] **Step 5: Validate and commit**

Run package/asset tests, `git diff --check`, and the agent-artifact hook if
present. Commit as `docs: complete Zed extension migration guidance`.

### Task 6: Whole-branch verification and live smoke

**Files:**
- Modify only when verification identifies an actual defect in the files above.

**Interfaces:**
- Consumes: all previous task outputs.
- Produces: fresh evidence for every design completion requirement.

- [ ] **Step 1: Run focused automated verification**

```bash
cargo fmt --manifest-path editors/zed/Cargo.toml -- --check
cargo test --manifest-path editors/zed/Cargo.toml
cargo build --release --target wasm32-wasip2 --manifest-path editors/zed/Cargo.toml
bash scripts/ci/test/zed-extension-package.test.sh
bash scripts/ci/test/zed-language-assets.test.sh
pnpm exec openspec validate zed-extension-sdk-parity --strict --no-interactive
git diff --check main...HEAD
```

- [ ] **Step 2: Run repository policy verification**

Run the focused static workflow checks that cover
`.github/workflows/publish-zed-extension.yml`, then run `pnpm openspec:validate`
if the focused OpenSpec change validation passes and dependencies are available.

- [ ] **Step 3: Run GitNexus change detection**

Run `detect_changes({scope: "compare", base_ref: "main"})`. Confirm only Zed,
CI, OpenSpec, guide, glossary, and changelog surfaces are affected. Investigate
any unrelated flow before continuing.

- [ ] **Step 4: Attempt a live Zed development-extension smoke**

Detect an installed Zed application/CLI. If available, install
`editors/zed` as a dev extension, open `editors/zed/tests/fixtures/runnables.bd`,
inspect Zed logs for successful extension compilation and `beskid-lsp` startup,
and exercise diagnostics, hover, completion, symbols, and formatting. Record
which interactions were directly observed. If UI automation cannot safely
perform the install, report the manual procedure as unverified evidence.

- [ ] **Step 5: Audit requirements and final diff**

Check every requirement in the design and OpenSpec delta against fresh command,
file, or runtime evidence. Run `git status --short`, `git log --oneline main..HEAD`,
and `git diff --stat main...HEAD`; confirm no agent knowledge/scratch files are
tracked.

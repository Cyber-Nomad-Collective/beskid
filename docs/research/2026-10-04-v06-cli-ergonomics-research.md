# beskid 0.6 CLI ergonomics research

Date: 2026-10-04. Status: research and proposed release scope, not an accepted standard or implemented interface.

## Evidence and limits

The current compiler checkout is `887669f55ceee4db8c511be323e048e24ac42292`; the root checkout is `50bcaa3346413edd2cdae04ef3e8d270a6f36557`. Findings below come from current source and official documentation. No binary was built or invoked: the command inventory is verified against Clap declarations and dispatch, not installed-tool behavior. GitNexus concept queries were used before code exploration; the root and compiler indexes reported 94 and 113 commits behind HEAD and partial keyword-search failures, so current files are authoritative for this audit.

The separately identified published 0.5.2 compiler revision is `95c203ff12639b25e2c67b08da531e3715fef4c2`, which is absent from the local object store. Its publicly fetched CLI source exposes the same root families described below **except `hi`**, and already contains the parallel dev groups. The local inventory must therefore not be called the shipped 0.5.2 surface. Package/resolution implementation observations below are local-checkout findings unless explicitly stated otherwise. [Published compiler CLI source](https://raw.githubusercontent.com/Cyber-Nomad-Collective/beskid_compiler/95c203ff12639b25e2c67b08da531e3715fef4c2/crates/beskid_cli/src/cli/app.rs)

## What has already started, and what still hurts

The root exposes `dev`, `parse`, `tree`, `analyze`, `doc`, `format` (visible alias `fmt`), `clif`, `run`, `test`, `repl`, `build`, `mod`, `import`, `fetch`, `lock`, `update`, `corelib`, `runtime-kit`, `new`, `pckg`, `graph`, `hi`, `lsp`, `up`, `validate-bsol`, and `migrate-bsol`. Compiler-backend logging is a global root flag. Ordinary commands and internals therefore compete in one root list. [Root declarations and dispatch](../../compiler/crates/beskid_cli/src/cli/app.rs)

The new grouping currently adds parallel paths rather than reducing that root surface:

| Current group | Current children |
| --- | --- |
| `dev syntax` | `parse`, `tree`, `analyze`, `doc`, `format`, `clif` |
| `dev build` | `compile`, `test`, `corelib` |
| `dev project` | `fetch`, `lock`, `update`, `graph` |
| `dev package registry` | Entire pckg argument/command surface |

All these paths dispatch to the existing implementations. Everyday formatting and testing have been grouped with implementation tools; package discovery now has an additional deeply nested spelling. This is an interface organization change, not yet an ergonomic workflow. [Developer declarations](../../compiler/crates/beskid_cli/src/cli/dev.rs), [dispatch](../../compiler/crates/beskid_cli/src/cli/app.rs)

There is no dependency `add` or `remove` command in either root or pckg declarations. `pckg` exposes `pack`, `upload`, `configure`, `list`, `search`, `details`, `versions`, `download`, `yank`, `unyank`, and `whoami`. Downloading an artifact does not declare a project dependency. The documented consumption procedure starts with hand-editing BSOL dependency blocks and then running `fetch`. The user's inability to discover adding a dependency is consistent with a missing public operation, not merely an undiscovered existing command. [pckg declarations](../../compiler/crates/beskid_pckg/src/cli/arguments.rs), [dependency procedure](../../site/website/src/content/docs/docs/projects/dependencies-and-locks.md)

`fetch`, `lock`, and `update` all enter the shared resolution/materialization pipeline. `lock` and `update` pass the same non-frozen, non-locked options; their source differs mainly in completion wording. There is no package selector or explicit upgrade policy in `UpdateArgs`. Do not promise Cargo-style selective updating from the current name alone. [fetch](../../compiler/crates/beskid_cli/src/commands/fetch.rs), [lock](../../compiler/crates/beskid_cli/src/commands/lock.rs), [update](../../compiler/crates/beskid_cli/src/commands/update.rs)

Registry materialization still falls back to the first active version if a requested version is absent. Network, JSON, empty-version, and download failures can become unresolved notes; these three dependency commands select `UnresolvedDependencyPolicy::Warn`. A friendlier `add` front end over this behavior could report success for the wrong or unresolved dependency. Fail-closed coordinate selection and actionable errors must precede the new workflow. [Registry materialization](../../compiler/crates/beskid_analysis/src/projects/workflow/registry.rs), [fetch policy](../../compiler/crates/beskid_cli/src/commands/fetch.rs)

Project creation currently means selecting a template, supplying an output path, and optionally a name; `new` also owns template cache list/install/uninstall. `run` has no trailing program-argument field in its Clap model. These are additional beginner-friction candidates, subject to scope and acceptance tests below. [new](../../compiler/crates/beskid_cli/src/commands/new.rs), [run](../../compiler/crates/beskid_cli/src/commands/run.rs)

## Primary-source comparison

These examples establish available patterns, not empirical proof that one ecosystem is easier for beginners.

| Tool | Verified pattern | Design implication for beskid |
| --- | --- | --- |
| Cargo | Direct `cargo add name`, `name@version`, path/git sources, workspace package selection, and dry-run. [Cargo add](https://doc.rust-lang.org/cargo/commands/cargo-add.html) | Put dependency declaration in root help; make source and project selection explicit. |
| Cargo | `cargo update name` conservatively updates a selected dependency and necessary transitives; no selector updates all. Dry-run reports changes. [Cargo update](https://doc.rust-lang.org/cargo/commands/cargo-update.html) | Separate changing declared intent from refreshing eligible locked versions; show a diff. |
| Go | `go get path@version` adds or changes requirements; `go mod tidy` reconciles requirements with imports. [Go dependency management](https://go.dev/doc/modules/managing-dependencies) | Task-focused guidance is essential when one verb covers several effects. Automatic tidy would require language/import semantics beyond renaming a command. |
| .NET | .NET 10 uses `dotnet package add`; earlier SDKs use `dotnet add package`. The command adds or updates a reference and ordinarily restores it. [dotnet package add](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-package-add) | Noun grouping is legitimate, but increasing command depth is not automatically better; pick one grammar for the release. |
| SwiftPM | A dependency requires both package declaration and target product use; resolution normally reuses eligible `Package.resolved` versions, while update selects newer eligible versions. [Adding dependencies](https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/addingdependencies/), [resolution source](https://github.com/swiftlang/swift-package-manager/blob/main/Sources/PackageManagerDocs/Documentation.docc/ResolvingPackageVersions.md) | Hide plumbing, but make target consumption visible; do not claim adding a package automatically provides every target's symbols. |
| uv | Direct `uv add` / `uv remove`; constraints and sources are recorded in project metadata. Changing a constraint and upgrading a locked package are distinct. [uv dependencies](https://docs.astral.sh/uv/concepts/projects/dependencies/) | Prefer one complete add/remove workflow over manual manifest surgery and several maintenance commands. |
| uv | `run` automatically locks/syncs; `--locked` refuses an outdated lock, while `--frozen` uses it without freshness checking. [uv locking and syncing](https://docs.astral.sh/uv/concepts/projects/sync/) | Flag names need normative definitions. uv and Cargo do not give `--frozen` the same meaning. |

Cargo's `--locked` rejects missing or changed lockfiles; `--offline` forbids network; `--frozen` combines both. Its command reference also defines quiet/verbose/color behavior. Adopt the separation of concerns, not unspecified ecosystem defaults. [Cargo reference](https://doc.rust-lang.org/cargo/commands/cargo.html)

## Proposed 0.6 public and developer split

The companion [release design](../superpowers/specs/2026-10-04-beskid-v0-6-release-design.md) selects the proposed `package` and `toolchain` spellings, adds `doctor`, and keeps `hi` outside the required root surface. The table below records the smaller-renaming alternative considered during research. Both remain proposals until review; use the companion design as the consolidated command map. It also selects explicit `update --all` and bundled-default `new <name> --template <template>` behavior.

Recommendation: root commands describe tasks an application/library author performs. `dev` is for compiler/runtime/toolchain internals, not a synonym for all software development. Keep one canonical path for each operation.

| Root group in help | Proposed commands |
| --- | --- |
| Create and execute | `new`, `build`, `run`, `test`, `check` |
| Improve source | `fmt`, `doc` |
| Manage dependencies | `add`, `remove`, `update` |
| Product entry points | `hi`, `pckg`, `up` |
| Advanced internals | `dev` |

`check` becomes the canonical everyday name for semantic checking; `fmt` becomes canonical formatting. `pckg` preserves the existing product spelling and owns less frequent registry and publication tasks. `up` remains toolchain management: `update` always concerns project dependencies. New source/library operations must not be placed under `dev` solely because they use foreign glue.

Proposed `dev` families:

```text
beskid dev syntax parse|tree|clif
beskid dev project fetch|lock|graph
beskid dev corelib ...
beskid dev runtime-kit ...
beskid dev mod ...
beskid dev lsp ...
beskid dev bsol validate|migrate ...
```

Move advanced compiler/link/export/IR knobs out of ordinary build help into a documented dev build surface, backed by the same implementation. Remove duplicate dev routes for root `test`, `fmt`, `doc`, and `update`. `repl` needs a release decision based on its actual AOT/support guarantees, not its presence in the old enum: either supported public workflow with acceptance evidence or dev-only experimental tool. `import lib` should be consolidated with the glue authoring design; retain an explicit supported user path if ordinary applications need foreign libraries.

The normative command-surface spec currently explicitly requires old families at top level. This proposal needs an OpenSpec change before implementation; documentation-only hiding would not resolve that conflict. [Normative command surface](../../openspec/specs/tooling--cli--command-surface/spec.md)

## Complete dependency flows

Illustrative commands below are proposed, not available today. `Acme.Math` is a fixture coordinate, not a claim that such a public package exists.

```bash
beskid new hello
cd hello
beskid add Acme.Math@1.0.0
beskid run
beskid add Core --path ../core
beskid update Acme.Math --dry-run
beskid update Acme.Math
beskid remove Acme.Math
beskid build --locked
```

1. `new hello` creates a bundled default application without requiring online template installation; `--template` selects another template. Put template management in `pckg template ...`, subject to the existing template package contract.
2. `add name@version` selects a project, stages a BSOL edit preserving comments and unrelated text, resolves/verifies the requested artifact, prepares the new lock and materialization, then commits the visible manifest/lock changes together. A failure retains their original contents. Shared cache staging may survive but cannot appear as a committed project change. The source resolver remains the single authority.
3. Bare `add name` uses a documented stable-version selection policy and records the selected intent. Prefer exact versions for 0.6 until semver-range solving is explicitly specified and tested; do not invent a partial resolver to mimic Cargo syntax.
4. `remove name` changes direct intent and regenerates reachability; a dependency still reachable transitively remains in the lock. Repeated add/remove should have documented idempotence.
5. `update name` refreshes that selected dependency according to manifest policy; changing exact intent requires explicit `--version`. `update --all` makes the broad upgrade explicit. Bare `update` should print guidance rather than unexpectedly upgrade every package. Dry-run reports manifest/lock effects and does not write them.
6. In a multi-project workspace, require a unique inferred project or `--project` / `--workspace-member`; never pick the first arbitrary member.
7. `build`, `run`, and `test` automatically materialize reviewed dependencies and preserve eligible locked versions. `--locked` refuses manifest/lock drift. Introduce `--offline` separately. Keep an existing `--frozen` only after its meaning is explicitly settled in OpenSpec and migrated consistently; current comments do not describe network prohibition. [Current lock-policy arguments](../../compiler/crates/beskid_cli/src/project_args.rs)
8. Git dependency addition remains deferred unless the same release lands actual materialization and immutable locking; current published procedure says Git is unsupported. [Dependency procedure](../../site/website/src/content/docs/docs/projects/dependencies-and-locks.md)

## Help, errors, output, and automation contracts

These are proposed release requirements:

- Root help gives a short first-use sequence and explicitly says `add` adds a project dependency. Every mutating command has a concrete example, effects, project-selection behavior, and recovery guidance.
- Unknown old commands fail with the exact new invocation; they do not dispatch through hidden legacy aliases. Typo suggestions and shell completion use the canonical command set.
- A missing dependency reports package, requested version, registry, and the next valid action; unresolved dependencies and version substitution cannot produce successful `add` or executable builds.
- Progress and compiler diagnostics use stderr; program stdout is preserved. `run -- arg...` forwards arguments and returns the child's status. Machine output never shares stdout with tables or progress. Define a versioned JSON event/diagnostic contract for supported commands and do not promise universal JSON for arbitrary child output.
- Plain output is automatic for non-TTY execution. Ordinary build/test finishes without waiting for a keypress; interactive dashboard/progress browsing requires explicit opt-in. Help and registry queries must not require corelib provisioning. Current startup calls `ensure_corelib_ready` for every parsed command except runtime-kit, so scope provisioning to commands that need it. [Current startup](../../compiler/crates/beskid_cli/src/cli/app.rs)
- Standard flags: quiet, verbose, color auto/always/never, locked, offline, project selection. Backend logs belong to dev diagnostics. Define CLI-owned success/failure/usage codes and preserve child statuses for run; test interruption and failed subprocesses cannot become success.
- Stable installed binaries, editor actions, website copy buttons, docs, scripts, and CI consume one command contract. CLI/LSP continue using the shared semantic authority. [Existing shared-frontend requirement](../../openspec/specs/tooling--cli--command-surface/spec.md)

## Migration closure and acceptance evidence

Implement one OpenSpec change covering canonical commands, dependency mutation/rollback, strict selection, lock/network policy, output, and completion. Migrate all active callers in the same program: compiler tests/scripts, VS Code CLI invocations, template post-actions, docs/book, pckg use snippets, and build gates. Remove superseded enums/routes/aliases, update help/completion snapshots, and verify old spellings fail with guidance. Historical provenance remains historical; do not rewrite archived evidence as if the new interface had always existed.

Do not close on parser tests alone. The existing dependency e2e test starts from predeclared path manifests and chains fetch/update/lock/build; it does not prove a beginner can add a dependency. [Existing workflow test](../../compiler/crates/beskid_e2e_tests/src/tests/dependency_workflow.rs)

| Release acceptance | Evidence required |
| --- | --- |
| Find dependency addition | Five fresh users receive only an installed CLI and root help. At least four find the correct add operation within 60 seconds without external docs. |
| Complete first project | At least four of five create, add a fixture registry dependency, use it, and run within five minutes; record failures and commands rather than replacing failures with coaching. |
| Local dependency | A fresh project adds a path dependency and builds using only CLI operations; no manual BSOL edit. |
| Strict coordinate | Missing/yanked/requested wrong version and registry failure exit nonzero; manifest/lock unchanged; no substituted artifact. |
| Update scope | Selected update changes only necessary reachable coordinates; dry-run has no visible writes; all-update requires explicit scope. |
| Workspace safety | Ambiguity produces useful candidates; explicit member edits only that member. |
| Automation | Redirected output has no ANSI/alternate screen, no prompt, no completion keypress; locked/offline semantics are independently tested. |
| Runtime forwarding | Argument boundaries, stdout, stderr, exit status, and interrupt handling survive `run -- ...`. |
| Installed product | Repeat project and dependency journeys using packaged Linux, Windows, and macOS toolchains outside the checkout, with documented runtime-kit discovery. |
| Migration closure | Active callers and help use canonical routes; no legacy dispatch survives; OpenSpec scenarios and implementation agree. |

The beginner thresholds are proposed design gates, not completed experiments. Deterministic disposable-registry and installed-binary tests complement them; usability sessions cannot replace correctness gates.

## Alternatives and scope pressure

Direct root add/remove/update is recommended because the reported pain concerns a frequent task. A coherent `pckg add/remove/update` alternative would keep fewer roots and unify registry vocabulary, but requires a beginner to discover pckg and distinguish project mutation from artifact operations. Keeping all dependency work under `dev project` saves no implementation effort and hides an essential application-author task.

Hiding old commands while retaining their dispatch is cheaper short term but leaves two permanent interfaces and continuing docs drift. A 0.6 migration with actionable errors and no legacy dispatch fits the user's preference for complete cleanup, provided internal and editor callers migrate together.

A full ecosystem resolver, new installer system, plugin mechanism, and many serializer formats would inflate a stability release. Limit CLI additions to complete project/create/dependency/check/run journeys, surface cleanup, strict resolution, and glue workflows required by 0.6. Defer unrelated command families. Public glue actions should be chosen after the glue capability audit: a visible usable foreign-library workflow matters more than choosing a new noun before the capability is proven.

The user's scope decision makes Rust glue a required 0.6 journey and .NET glue a stretch goal. Design the public authoring workflow around an installed toolchain generating and consuming a Rust host wrapper end to end, including dependency discovery, build, linking, diagnostics, and version/ABI errors. Do not let a promised .NET backend or a renamed `import` command count as Rust acceptance evidence.

import SpecPageHeader from '@beskid/beskid-ui/platform-spec/SpecPageHeader.astro';

<SpecPageHeader status="Standard" ownerName="Piotr Mikstacki" ownerEmail="pmikstacki@cybernomad.it" submitterName="Piotr Mikstacki" submitterEmail="pmikstacki@cybernomad.it" />

## Normative platform contract

1. The CLI shall expose stable command families for `run`, `build`, `test`, `repl`, `analyze`, `parse`, `format`, `clif`, `doc`, `corelib`, `lock`, `fetch`, `tree`, `update`, **`hi`** (pluggable dashboard shell), and **`new`** (project, workspace, and item templates).
2. Commands that invoke compilation shall route through shared frontend and analysis services to preserve diagnostic parity.
3. Manifest and dependency commands shall operate on the same project graph policy as compile flows.
4. CLI documentation generation (`doc`) shall remain aligned with corelib and platform-spec evolution.

## Implementation anchors

- `compiler/crates/beskid_cli/src/commands`
- `compiler/crates/beskid_cli/src/cli.rs`
- `compiler/crates/beskid_tools` — shared pipeline UI, pluggable shell (`beskid_tools::shell`), diagnostics, session, registry helpers
- `compiler/crates/beskid_cli/src/commands/hi.rs` — `beskid hi` dashboard entrypoint

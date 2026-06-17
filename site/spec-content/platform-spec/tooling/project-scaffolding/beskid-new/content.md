---
title: beskid new command
description: Normative CLI for listing, installing, and instantiating Beskid templates.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
The **`beskid new`** command family — list, install, uninstall, and instantiate templates from registry, path, or git with interactive and flag-driven parameters.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/crates/beskid_cli/src/cli.rs` — subcommand tree
- `compiler/crates/beskid_cli/src/commands/new.rs` — Clap args and dispatch
- `compiler/crates/beskid_template::service` — list / install / uninstall / instantiate
- `compiler/crates/beskid_tools::registry` — shared pckg client helpers
- `compiler/crates/beskid_pckg` — registry download
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
The Beskid CLI **must** expose a top-level **`beskid new`** command family for template discovery, installation, and instantiation. This is the **only** normative user entrypoint for scaffolding; `beskid pckg` remains publish/upload only.
</SpecSection>

<SpecSection title="Command taxonomy" id="command-taxonomy">
| Command | Obligation |
| --- | --- |
| `beskid new list` | List installed and optionally online templates |
| `beskid new install <package\|path\|git>` | Cache template for offline use |
| `beskid new uninstall <shortName\|package>` | Remove cached template |
| `beskid new <shortName> [options]` | Instantiate installed template by short name |
| `beskid new --path ...` | Instantiate without prior install |
| `beskid new --git ...` | Instantiate from git source |
| `beskid new --package <id>[@version]` | Instantiate from registry (install if needed) |

Global options documented in [contracts and edge cases](./contracts-and-edge-cases/).
</SpecSection>

<SpecSection title="First-party templates" id="first-party-templates">
When the registry is reachable, the CLI **must** resolve **`beskid.templates.console`**, **`beskid.templates.lib`**, and **`beskid.templates.project`** from pckg—not from files shipped inside the CLI binary. Short names **`console`**, **`lib`**, and **`template`** map to those packages when unambiguous.
</SpecSection>

<SpecSection title="Decisions" id="decisions">
No open decisions. Closed choices: **`D-TOOL-SCAFF-0001`** (`beskid new` command), **`0002`** (interactive modes), **`0003`** (update check on instantiate)—see **`adr/`** and the **ADRs** tab.
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-TOOL-SCAFF-0001` … `D-TOOL-SCAFF-0003`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
<!-- /spec:generate:article-index -->

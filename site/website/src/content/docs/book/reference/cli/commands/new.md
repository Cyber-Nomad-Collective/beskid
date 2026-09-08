---
title: "beskid new"
description: "List, install, and instantiate Beskid project, workspace, and item templates."
---

**`beskid new`** is the user entrypoint for template scaffolding. Registry pack/upload workflows are under `beskid pckg`.

Normative command taxonomy and edge cases: [beskid new (platform-spec)](/docs/standard/tooling/project-scaffolding/beskid-new/) and [contracts and edge cases](/docs/standard/tooling/project-scaffolding/beskid-new/contracts-and-edge-cases/).

User-oriented workflows: [Project scaffolding](/book/reference/projects/scaffolding/).

## Command taxonomy

| Command | Purpose |
| --- | --- |
| `beskid new list` | List installed templates; optional registry results with `--online` |
| `beskid new install <PACKAGE_OR_SHORT>` | Cache a registry or first-party template; source flags can select path or Git instead |
| `beskid new uninstall <SHORT_NAME>` | Remove a cached template by short name |
| `beskid new <SHORT_NAME> [options]` | Instantiate an installed template by short name |
| `beskid new --path <dir> …` | Instantiate from a local tree (no prior install) |
| `beskid new --git <url> …` | Instantiate from a git source |
| `beskid new --package <id>[@version] …` | Instantiate from the registry (install if needed) |

## First-party short names

When the registry is configured, these packages are resolved from the package service:

| Short name | Package id |
| --- | --- |
| `console` | `beskid.templates.console` |
| `lib` | `beskid.templates.lib` |
| `template` | `beskid.templates.project` |

## Global flags (instantiate)

| Flag | Meaning |
| --- | --- |
| `-o`, `--output <path>` | Output directory or file (item templates) |
| `-n`, `--name <string>` | Primary name symbol (default `name` symbol) |
| `--symbol <id>=<value>` | Repeatable symbol binding |
| `--no-interactive` | Fail if required symbols are missing |
| `--force` | Allow non-empty output directory |
| `--path <dir>` | Template from local path |
| `--git <url>` | Template from git |
| `--git-ref <ref>` | Branch, tag, or commit |
| `--git-subpath <dir>` | Subdirectory within the repository |
| `--package <id>[@version]` | Registry template package (`packageKind: template`) |
| `--project <App.bproj>` | Host project for **item** templates |
| `--allow-yanked` | Continue after yanked-version warning |
| `--strict-post-actions` | Fail on unknown post-action id |
| `--allow-project-manifest` | Item template may write `App.bproj` |
| `--registry-url <url>` | Registry URL (default `https://pckg.beskid-lang.org`) |
| `--bearer-token <token>` | Registry bearer token (`BESKID_PCKG_TOKEN`) |
| `--api-key <key>` | Registry API key (`BESKID_PCKG_API_KEY`) |

Exactly one template selector is required: `SHORT_NAME`, `--package`, `--path`, or `--git`. The `--path` and `--git` forms are flags; they are not positional values for `install` or instantiate.
For non-TUI instantiation, `-o` or `--output` is also required.

## `beskid new list` flags

| Flag | Meaning |
| --- | --- |
| `--online` | Include registry search results |
| `--kind <project\|workspace\|item>` | Filter by `tags.type` |
| `--registry-url`, `--bearer-token`, `--api-key` | Registry connection and authentication |

`beskid new install <PACKAGE_OR_SHORT>` also accepts `--path`, `--git`, `--git-ref`, `--git-subpath`, `--registry-url`, `--bearer-token`, and `--api-key`.

Use `beskid new --tui` without a selector or subcommand to open the interactive template picker.

## Interactive behavior

When stdin is a TTY, the CLI prompts for required symbols without CLI values, confirms overwrite when output exists (unless `--force`), and confirms proceed when the template version is yanked (unless `--allow-yanked`).

## Examples

```bash
beskid new list --online
beskid new install beskid.templates.console
beskid new console -n MyApp -o ./MyApp
beskid new lib --symbol name=MyLib --no-interactive -o ./MyLib
beskid new --git https://git.example.com/templates --git-ref main --git-subpath lib -o ./Lib
beskid new contract --symbol contractName=Foo -o ./Src/Foo.bd --project ./App/App.bproj
```

## Exit status

The command returns zero on success. Validation, template, file-system, authentication, and network errors return the CLI's standard non-zero error status. The pinned implementation does not assign separate numeric statuses to those error categories.

## Implementation note

Subcommand wiring lives in `compiler/crates/beskid_cli`; registry download uses `compiler/crates/beskid_pckg`. The template engine is specified in [Project templates](/docs/standard/tooling/project-scaffolding/project-templates/).

For the verified scaffold procedure, use [Create a project](/docs/projects/create/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)

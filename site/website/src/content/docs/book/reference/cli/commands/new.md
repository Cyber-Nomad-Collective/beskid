---
title: "beskid new"
description: "List, install, and instantiate Beskid project, workspace, and item templates."
---

**`beskid new`** is the user entrypoint for template scaffolding. **`beskid pckg`** remains registry pack/upload only.

Normative command taxonomy and edge cases: [beskid new (platform-spec)](/platform-spec/tooling/project-scaffolding/beskid-new/) and [contracts and edge cases](/platform-spec/tooling/project-scaffolding/beskid-new/contracts-and-edge-cases/).

User-oriented workflows: [Project scaffolding](/book/reference/projects/scaffolding/).

## Command taxonomy

| Command | Purpose |
| --- | --- |
| `beskid new list` | List installed templates; optional registry results with `--online` |
| `beskid new install <package\|path\|git>` | Cache a template for offline use |
| `beskid new uninstall <shortName\|package>` | Remove a cached template |
| `beskid new <shortName> [options]` | Instantiate an installed template by short name |
| `beskid new --path <dir> …` | Instantiate from a local tree (no prior install) |
| `beskid new --git <url> …` | Instantiate from a git source |
| `beskid new --package <id>[@version] …` | Instantiate from the registry (install if needed) |

## First-party short names

When the registry is configured, these packages are resolved from pckg (not from the CLI binary):

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
| `--project <Project.proj>` | Host project for **item** templates |
| `--allow-yanked` | Continue after yanked-version warning |
| `--strict-post-actions` | Fail on unknown post-action id |
| `--allow-project-manifest` | Item template may write `Project.proj` |

## `beskid new list` flags

| Flag | Meaning |
| --- | --- |
| `--online` | Include registry search results |
| `--kind <project\|workspace\|item>` | Filter by `tags.type` |

## Interactive behavior

When stdin is a TTY, the CLI prompts for required symbols without CLI values, confirms overwrite when output exists (unless `--force`), and confirms proceed when the template version is yanked (unless `--allow-yanked`).

## Examples

```bash
beskid new list --online
beskid new install beskid.templates.console
beskid new console -n MyApp -o ./MyApp
beskid new lib --symbol name=MyLib --no-interactive -o ./MyLib
beskid new --git https://git.example.com/templates --git-ref main --git-subpath lib -o ./Lib
beskid new contract --symbol contractName=Foo -o ./Src/Foo.bd --project ./App/Project.proj
```

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Success |
| 1 | User error (validation, collision) |
| 2 | Engine or I/O failure |
| 3 | Registry auth or network failure when required |

## Implementation note

Subcommand wiring lives in `compiler/crates/beskid_cli`; registry download uses `compiler/crates/beskid_pckg`. The template engine is specified in [Project templates](/platform-spec/tooling/project-scaffolding/project-templates/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)

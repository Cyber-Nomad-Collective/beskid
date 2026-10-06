---
title: "beskid new"
description: "Create a Beskid project from a template."
---

**`beskid new`** is the user entrypoint for template scaffolding. Registry pack and publish workflows are under `beskid package`. Template cache commands are under `beskid package template`.

Normative command taxonomy and edge cases: [beskid new (platform-spec)](/docs/standard/tooling/project-scaffolding/beskid-new/) and [contracts and edge cases](/docs/standard/tooling/project-scaffolding/beskid-new/contracts-and-edge-cases/).

User-oriented workflows: [Project scaffolding](/book/reference/projects/scaffolding/).

## Command taxonomy

| Command | Purpose |
| --- | --- |
| `beskid new <NAME>` | Create a project in `./<NAME>` from the bundled offline application template |
| `beskid new <NAME> --template <SHORT_NAME>` | Instantiate an installed template by short name |
| `beskid new <NAME> --path <dir>` | Instantiate from a local tree |
| `beskid new <NAME> --git <url>` | Instantiate from a git source |
| `beskid new <NAME> --package <id>[@version]` | Instantiate from the registry |
| `beskid new --list` | List installed templates |
| `beskid package template list` | List installed templates; `--online` adds registry results and `--kind` filters |
| `beskid package template install <PACKAGE_OR_SHORT>` | Cache a registry or first-party template; `--path` or `--git` select another source |
| `beskid package template uninstall <SHORT_NAME>` | Remove a cached template by short name |

`beskid new --offline` forbids network requests and uses bundled, local, or verified installed templates.

## Flags (instantiate)

| Flag | Meaning |
| --- | --- |
| `<NAME>` | Project name and default output directory. Required unless you pass `--list` |
| `-o`, `--output <path>` | Output directory or file (item templates). Defaults to `<NAME>` |
| `-n`, `--name <name>` | Primary name symbol for the template. Defaults to `<NAME>` |
| `--template <short-name>` | Installed template. Conflicts with `--path`, `--git`, `--package`, and `--list` |
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
| `--offline` | Forbid network requests |
| `--registry-url <url>` | Registry URL (default `https://pckg.beskid-lang.org`) |
| `--bearer-token <token>` | Registry bearer token (`BESKID_PCKG_TOKEN`) |
| `--api-key <key>` | Registry API key (`BESKID_PCKG_API_KEY`) |

## Interactive behavior

When stdin is a TTY, the CLI uses line prompts for required symbols without CLI values, confirms overwrite when output exists (unless `--force`), and confirms proceed when the template version is yanked (unless `--allow-yanked`). A declined overwrite leaves existing files unchanged. In noninteractive use, provide required values and use `--force` only when overwriting is intended.

## Examples

```bash
beskid new MyApp
beskid new MyLib --template lib --no-interactive
beskid new Lib --git https://git.example.com/templates --git-ref main --git-subpath lib
beskid package template install beskid.templates.console
```

## Exit status

The command returns zero on success. Validation, template, file-system, authentication, and network errors return the CLI's standard non-zero error status. The pinned implementation does not assign separate numeric statuses to those error categories.

## Implementation note

Subcommand wiring lives in `compiler/crates/beskid_cli`; registry download uses `compiler/crates/beskid_pckg`. The template engine is specified in [Project templates](/docs/standard/tooling/project-scaffolding/project-templates/).

For the verified scaffold procedure, use [Create a project](/docs/projects/create/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)

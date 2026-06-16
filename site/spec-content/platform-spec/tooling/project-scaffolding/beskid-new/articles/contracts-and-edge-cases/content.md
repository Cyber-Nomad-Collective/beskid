---
title: Contracts and edge cases
description: Flags, interactive behavior, and edge cases for `beskid new`.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

## Purpose and scope

Normative CLI flags and behaviors.

## Global flags (instantiate)

| Flag | Meaning |
| --- | --- |
| `-o`, `--output <path>` | Output directory or file (item templates) |
| `-n`, `--name <string>` | Primary name symbol (maps to default `name` symbol) |
| `--symbol <id>=<value>` | Repeatable symbol binding |
| `--no-interactive` | Fail if required symbols missing |
| `--force` | Allow non-empty output directory |
| `--path <dir>` | Template from local path |
| `--git <url>` | Template from git |
| `--git-ref <ref>` | Branch, tag, or commit |
| `--git-subpath <dir>` | Subdirectory within repo |
| `--package <id>[@version]` | Registry package (`packageKind: template`) |
| `--project <Project.proj>` | Host project for item templates |
| `--allow-yanked` | Continue after yanked warning |
| `--strict-post-actions` | Fail on unknown post-action id |
| `--allow-project-manifest` | Item template may write `Project.proj` |

## `beskid new list` flags

| Flag | Meaning |
| --- | --- |
| `--online` | Include registry search results |
| `--kind <project\|workspace\|item>` | Filter by `tags.type` |

## Interactive

When stdin is a TTY:

- Prompt for each required symbol without a CLI value.
- Confirm overwrite when output exists (unless `--force`).
- Confirm proceed when template is yanked (unless `--allow-yanked`).

## Examples

```bash
beskid new list --online
beskid new install beskid.templates.console
beskid new console -n MyApp -o ./MyApp
beskid new lib --symbol name=MyLib --no-interactive -o ./MyLib
beskid new --git https://git.example.com/templates --git-ref main --git-subpath lib -o ./Lib
beskid new contract --symbol contractName=Foo -o ./Src/Foo.bd --project ./App/Project.proj
```

## Edge cases

- **`beskid new console`** without install: auto-install latest from registry when online.
- **Ambiguous shortName**: error listing matching package ids.
- **CI**: document `beskid new ... --no-interactive` in guides.

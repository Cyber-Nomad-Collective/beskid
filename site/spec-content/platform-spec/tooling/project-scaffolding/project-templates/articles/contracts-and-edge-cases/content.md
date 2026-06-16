---
title: Contracts and edge cases
description: Normative MUST/SHOULD rules for template instantiation, updates,
  yanked packages, and post-actions.
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

Testable rules for template resolution, instantiation, registry interaction, and diagnostics (**E1901–E1999**).

## Resolution

| ID | Rule |
| --- | --- |
| T-R01 | `beskid new` **must** accept exactly one template selector: `shortName`, `--package <id>[@version]`, `--path <dir>`, or `--git <url>` (with optional `--git-ref`, `--git-subpath`). |
| T-R02 | Registry resolution **must** require `packageKind: template` on the resolved `package.json`. |
| T-R03 | First-party ids under **`beskid.templates.*`** **must** be preferred when `shortName` is ambiguous and registry is configured. |
| T-R04 | On **every** template use, tooling **must** compare cached install (if any) to latest non-yanked registry version and **must** print an informational message when a newer version exists. |
| T-R05 | When the resolved version is **yanked**, tooling **must** print a **warning** naming the package and version; exit code **0** if the user proceeds via `--allow-yanked` or interactive confirmation. |

## Instantiation

| ID | Rule |
| --- | --- |
| T-I01 | **Project** templates **must** create the output directory when missing; **must** error when non-empty without `--force`. |
| T-I02 | **Workspace** templates **must** emit `Workspace.proj` at the workspace root and member `Project.proj` files at declared member paths. |
| T-I03 | **Item** templates **must** require `-o` / `--output` pointing at a file or directory under a folder containing `Project.proj` (or pass `--project` to disambiguate). |
| T-I04 | After substitution, **no** `{{` `}}` placeholder tokens **may** remain in output files. |
| T-I05 | All `guids` entries **must** be replaced in output; leftover source guids **must** fail with **E1906**. |
| T-I06 | Instantiated host projects **must** receive corelib per [design model](./design-model/#corelib-policy); templates **must not** emit opt-out flags. |
| T-I07 | Templates **may** scaffold **`Mod`**, multi-target, or FFI-heavy projects without restriction. |

## Interactive and flags

| ID | Rule |
| --- | --- |
| T-U01 | When stdin is a TTY and `preferInteractive` is true or any required symbol lacks a value, the CLI **must** prompt. |
| T-U02 | When `--no-interactive` is set, only flags and defaults **may** be used; missing required symbols **must** fail with **E1903**. |
| T-U03 | `--symbol` (repeatable) and `-n` / `--name` for the primary name symbol **must** be supported. |

## Post-actions

| ID | Rule |
| --- | --- |
| T-P01 | `postActions` is an ordered array of `{ "actionId": string, "args": object }`. |
| T-P02 | There is **no** platform whitelist; hosts **must** document supported `actionId` values. |
| T-P03 | Unknown `actionId` **should** log a warning and continue unless `--strict-post-actions`. |
| T-P04 | Built-in actions **must** include at minimum: `runCommand`, `beskidLock`, `beskidFetch`, `openReadme`. |

## Builtin forms

| Form id | Input | Output |
| --- | --- | --- |
| `identity` | string | unchanged |
| `lowerCase` | string | lowercase |
| `upperCase` | string | uppercase |
| `safeName` | string | filesystem-safe identifier |
| `namespace` | string | dotted namespace from path-like name |

## Edge cases

- **Git shallow clone failure** → **E1907** with remediation (network, auth, ref).
- **Template package contains `packageKind: library`** → **E1902** reject for `beskid new install`.
- **Item template overwrites existing file** → require `--force` or interactive confirm.
- **Workspace template with duplicate member ids** → **E1908** at validation time (before write).

## Diagnostic band E1901–E1999

| Code | Meaning |
| --- | --- |
| E1901 | Template manifest missing or invalid schema |
| E1902 | Package kind is not `template` |
| E1903 | Required symbol not provided |
| E1904 | Output path conflict |
| E1905 | Item template outside project root |
| E1906 | GUID replacement incomplete |
| E1907 | Git template source failed |
| E1908 | Workspace template invalid member graph |
| E1999 | Reserved internal template engine error |

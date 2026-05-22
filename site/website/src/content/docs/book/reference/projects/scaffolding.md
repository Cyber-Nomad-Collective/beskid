---
title: "Project scaffolding"
description: "Create Beskid projects, workspaces, and items from templates with beskid new."
---

Beskid scaffolds new **projects**, **workspaces**, and **items** from **templates**: versioned file trees described by **`beskid.template.v1`** in **`.beskid/template.json`**. The primary CLI entrypoint is **`beskid new`**; **`beskid pckg`** is for packing and publishing template packages, not for instantiation.

Normative contracts live under [Project scaffolding](/platform-spec/tooling/project-scaffolding/). This guide summarizes day-to-day workflows.

## Sources

| Source | Typical use |
| --- | --- |
| **Registry** (`packageKind: template`) | First-party packages such as `beskid.templates.console`, installed with `beskid new install` |
| **Local path** (`--path`) | Authoring or testing a template tree without publishing |
| **Git** (`--git`, `--git-ref`, `--git-subpath`) | Team or third-party template repos |

When the registry is reachable, the CLI resolves official **`beskid.templates.*`** packages from pckg rather than embedding stale copies in the binary.

## Install and cache

```bash
beskid new list
beskid new list --online
beskid new install beskid.templates.console
beskid new uninstall console
```

`beskid new install` extracts a template snapshot into the user tooling cache (same config root as `beskid pckg` auth). `beskid new list` shows installed templates; `--online` merges registry search results.

On each instantiate, the CLI may warn when a **newer** registry version exists or when the installed version is **yanked** (non-fatal unless policy requires otherwise).

## Instantiate

```bash
# Installed short name (auto-install from registry when online if needed)
beskid new console -n MyApp -o ./MyApp

# Registry package without prior install
beskid new --package beskid.templates.lib --symbol name=MyLib -o ./MyLib

# Local directory
beskid new --path ./my-template -o ./Out

# Git
beskid new --git https://example.com/templates --git-ref main --git-subpath console -o ./App
```

### Template kinds (`tags.type`)

| `tags.type` | Creates |
| --- | --- |
| `project` | New directory with `Project.proj` and scaffold sources |
| `workspace` | `Workspace.proj` plus member project trees |
| `item` | Files inside an existing project; use `--project` for the host `Project.proj` |

Use **`--no-interactive`** in CI with every required symbol set via **`-n` / `--name`** or **`--symbol id=value`**. Use **`--force`** to write into a non-empty output directory.

See [beskid new command reference](/book/reference/cli/commands/new/) for the full flag table.

## corelib on instantiated hosts

Every **instantiated** ordinary **host** project (**`project.type` omitted or `Host`**) **always** gets **corelib** through the normal toolchain path (lock/fetch/materialize)—the same implicit standard library behavior as existing projects. Template output **must not** ship a user-facing switch to disable corelib; manifests may omit an explicit `dependency "corelib"` block because **`beskid lock`** / **`beskid fetch`** still materialize it.

## Authoring template packages

Template authors use **`project.type = Template`** in `Project.proj` and publish with **`beskid pckg pack`** (sets **`packageKind: template`**, includes **`.beskid/template.json`**, skips **`api.json`** generation). See [beskid pckg](/book/reference/cli/commands/pckg/) and [Template packages](/platform-spec/tooling/project-scaffolding/template-packages/).

## Related

- [beskid new](/book/reference/cli/commands/new/)
- [Beskid Projects](/book/reference/projects/)
- [Project templates (spec)](/platform-spec/tooling/project-scaffolding/project-templates/)
- [beskid new (spec)](/platform-spec/tooling/project-scaffolding/beskid-new/)

---
title: "Project scaffolding"
description: "Create Beskid projects, workspaces, and items from templates with beskid new."
---

Beskid scaffolds new **projects**, **workspaces**, and **items** from **templates**: versioned file trees described by **`beskid.template.v1`** in **`.beskid/template.json`**. The primary CLI entrypoint is **`beskid new`**; **`beskid package`** is for packing and publishing template packages, not for instantiation.

Normative contracts live under [Project scaffolding](/docs/standard/tooling/project-scaffolding/). This guide summarizes day-to-day workflows.

## Sources

| Source | Typical use |
| --- | --- |
| **Registry** (`packageKind: template`) | First-party packages such as `beskid.templates.console`, installed with `beskid package template install` |
| **Local path** (`--path`) | Authoring or testing a template tree without publishing |
| **Git** (`--git`, `--git-ref`, `--git-subpath`) | Team or third-party template repos |

When the registry is reachable, the CLI resolves official **`beskid.templates.*`** packages from pckg rather than embedding stale copies in the binary.

## Install and cache

```bash
beskid new --list
beskid package template list
beskid package template list --online
beskid package template install beskid.templates.console
beskid package template uninstall console
```

`beskid package template install` extracts a template snapshot into the user tooling cache (same config root as `beskid package` auth). `beskid package template list` shows installed templates; `--online` merges registry search results.

On each instantiate, the CLI may warn when a **newer** registry version exists or when the installed version is **yanked** (non-fatal unless policy requires otherwise).

## Instantiate

```bash
# Bundled application template
beskid new MyApp

# Installed short name
beskid new MyApp --template console

# Registry package without prior install
beskid new MyLib --package beskid.templates.lib

# Local directory
beskid new Out --path ./my-template

# Git
beskid new App --git https://example.com/templates --git-ref main --git-subpath console
```

### Template kinds (`tags.type`)

| `tags.type` | Creates |
| --- | --- |
| `project` | New directory with `App.bproj` and scaffold sources |
| `workspace` | `Workspace.bws` plus member project trees |
| `item` | Files inside an existing project; use `--project` for the host `App.bproj` |

Use **`--no-interactive`** in CI with every required symbol set via the project name argument or **`--symbol id=value`**. Use **`--force`** to write into a non-empty output directory.

See [beskid new command reference](/book/reference/cli/commands/new/) for the full flag table.

## corelib on instantiated hosts

Every **instantiated** ordinary **host** project (**`project.type` omitted or `Host`**) **always** gets **corelib** through the normal toolchain path (lock/fetch/materialize), the same implicit standard library behavior as existing projects. Template output **must not** ship a user-facing switch to disable corelib; manifests may omit an explicit `dependency "corelib"` block because **`beskid dev project lock`** / **`beskid dev project fetch`** still materialize it.

## Authoring template packages

Template authors use **`project.type = Template`** in `App.bproj` and publish with **`beskid package pack`** (sets **`packageKind: template`**, includes **`.beskid/template.json`**, skips **`api.json`** generation). See [beskid package](/book/reference/cli/commands/pckg/) and [Template packages](/docs/standard/tooling/project-scaffolding/template-packages/).

## Related

- [beskid new](/book/reference/cli/commands/new/)
- [Beskid Projects](/book/reference/projects/)
- [Project templates (spec)](/docs/standard/tooling/project-scaffolding/project-templates/)
- [beskid new (spec)](/docs/standard/tooling/project-scaffolding/beskid-new/)

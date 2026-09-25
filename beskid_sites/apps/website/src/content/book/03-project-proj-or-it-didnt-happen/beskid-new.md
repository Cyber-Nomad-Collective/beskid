---
title: "beskid new"
description: Scaffold projects from templates that are themselves packages, so a template is versioned like everything else.
tableOfContents: true
---

Hand-writing a manifest is educational once. The second time it is a typo in `entry` that costs you ten minutes. After that, use the scaffolder.

```bash
beskid new console
```

That drops a `MyApp.bproj`, a `Src/Main.bd` with an empty `unit Main()`, and nothing else. No `.gitignore` full of IDE folders you do not use, no sample test that asserts `true`, no README that says "TODO: describe your project".

Run `beskid new` with no arguments and you get an interactive picker of installed templates plus what the registry offers. Or manage them explicitly:

```bash
beskid new list --online
beskid new install beskid.templates.console
beskid new uninstall console
```

## Templates are packages

A template is a project whose manifest says `type = Template` and carries a `template` block with a `shortName` and a registry identity such as `beskid.templates.console`. It has no targets, because it is not built, only instantiated. Its `content/` directory is copied with `{{name}}` substituted.

```bsol
beskid_templates_console {
  name    = "beskid_templates_console"
  version = "0.0.0"
  type    = Template
  template {
    shortName = "console"
    identity  = "beskid.templates.console"
  }
}
```

This is the same package model as everything else: a template is fetched from the registry, pinned by version, and cached locally. Your team's internal service template is a package you publish, not a wiki page titled "copy this folder and rename things".

## Item templates

Templates can also add a single file or module to an existing project. Pass the host manifest and an output path and the scaffolder places the item under that project's `root`. The [scaffolding reference](/book/reference/projects/scaffolding/) has the flag list.

## When to skip it

If you are wiring Beskid into a repository with an established layout, write the manifest by hand and set `root` to match. Templates encode a layout opinion, and fighting that opinion with post-scaffold moves is slower than typing twelve lines.

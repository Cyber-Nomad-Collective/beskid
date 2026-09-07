---
title: "Where does this file even go?"
description: Module layout, compilation units, visibility, and how corelib fits on disk.
tableOfContents: true
---

You have a project. Now you have **forty `.bd` files** and no idea which folder earns the right to be called `internal`.

Beskid uses a **file-backed module model**: one file, one module, dotted paths map to directories. No secret module graph maintained by reflection and prayers.

## What you will find here

| Section | Topic |
| --- | --- |
| [Module layout](/book/04-where-does-this-file-go/module-layout/) | Folders, file-scoped `mod`, flat vs nested. |
| [Compilation units](/book/04-where-does-this-file-go/compilation-units/) | What the compiler sees per file/target. |
| [Visibility basics](/book/04-where-does-this-file-go/visibility-basics/) | `pub`, boundaries, leaking helpers. |
| [Corelib layout](/book/04-where-does-this-file-go/corelib-layout/) | Standard library packages and `corelib` identity. |

## Previous

[03. Project.proj or it didn't happen](/book/03-project-proj-or-it-didnt-happen/)

## Next

[05. Names nobody agreed on](/book/05-names-nobody-agreed-on/)

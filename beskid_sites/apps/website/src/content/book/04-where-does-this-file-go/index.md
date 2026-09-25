---
title: "Where does this file even go?"
description: Module layout, compilation units, visibility, and how corelib fits on disk.
tableOfContents: true
---

You have a project. Now you have **forty `.bd` files** and no idea which folder earns the right to be called `internal`.

Beskid uses a **file-backed module model**: one file, one module, dotted paths map to directories. No secret module graph maintained by reflection and prayers.

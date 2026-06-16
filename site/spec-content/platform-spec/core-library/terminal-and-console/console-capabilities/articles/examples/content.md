---
title: Examples
description: Checking capabilities before custom styling.
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

## Purpose

Document **examples** for the **Console Capabilities** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Capabilities](/platform-spec/core-library/terminal-and-console/console-capabilities/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

```beskid
if Console.Capabilities.ShouldEmitAnsi() {
    Console.FormatLine("[bold]interactive[/]");
} else {
    Core.Output.WriteLine("interactive");
}
```

```beskid
Console.Capabilities.Capabilities caps = Console.Capabilities.ProbeStdout();
Console.Capabilities.ColorModel model =
    Console.Capabilities.EffectiveColorModel(caps);
// use model for custom RGB downgrade outside SgrBuilder
```

For escape tables and SGR parameters, see [ANSI escape model](/platform-spec/core-library/terminal-and-console/ansi-escape-model/).

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-capabilities/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)

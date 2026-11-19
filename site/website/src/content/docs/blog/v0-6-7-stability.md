---
title: "Planning beskid 0.6.7: A Calmer Development Loop"
description: "The planned final 0.6 update focuses on useful diagnostics, a responsive editor, predictable runtime behavior and simpler local collection code. Implementation is in progress; this is a roadmap, not a release announcement."
date: 2026-10-24T10:00:00+02:00
blogStatus: in-progress
release: v0.6.7
draft: false
cover:
  src: "/blog-covers/v0-1-04-green-gate-discipline.jpg"
  alt: "A railway signal showing a green light at Lilleküla station."
  sourceHref: "https://commons.wikimedia.org/wiki/File:Green_light_at_Lilleküla_railway_station.JPG"
  sourceLabel: "Dmitry G, Public domain"
---

**0.6.7 is planned as the final release of the 0.6 line. It has not shipped.** Implementation and integration are in progress. This article describes the intended behavior and the evidence we want before calling the work ready.

The [0.6.6 engineering report](/blog/v0-6-6-release/) explains the parallel runtime: separate heaps, tasks, ports and the rules for crossing between them. The next problem is closer to the keyboard. A compiler error should point to the mistake. Completion should answer while a workspace scan runs. A channel receive in `Main` should wait for the sender. These are the ordinary interactions that decide whether a language is pleasant to use.

## Put the error where the fix belongs

The diagnostics work is built around one structured description of a problem, rendered for two places. The terminal can draw labelled source excerpts. The editor needs a short message, the exact span, a code, help and a quick fix when the repair is clear.

For example, `host App {` is missing the parentheses required after the host name. The planned message says what was expected while parsing that host and points at the opening brace. A quick fix inserts `()`. It should not ask the reader to understand a parser rule name or decode a miniature terminal transcript in the Problems panel.

Other repairs include missing semicolons and unclosed delimiters. A fix should be preferred only when it is safe to apply automatically; uncertain suggestions must be identified as such. Related locations carry labels such as where a declaration first appeared, rather than repeating the entire error elsewhere.

The same work aims to map diagnostics from generated project copies back to the file the author edits and remove duplicate reports of the same cause. A structured `--error-format=json` output is planned for tools that need to consume errors without scraping terminal formatting.

## Keep the editor available while it works

A folder containing many small projects exposed a workspace scan loop: cache writes and lock updates triggered another scan, while requests waited behind the current one. The planned fix excludes `obj/`, coalesces refreshes and answers requests from the current snapshot. Open projects get attention first. Completion in a multi-project folder, including members after `String.`, is a release gate with a one-second response target during scans.

The language server also needs a boundary around internal failures. A failed request should produce a useful error and crash report while the server remains available for the next request. That requires both guarded handlers and a server build that can unwind; catching a panic in an aborting build would be an impressive-looking no-op.

The extension is planned to prefer an explicit server setting, then its bundled matching server. A managed toolchain is eligible only when the version matches. Stale installations should be explained and removable, and an old lockfile should have a migration action rather than leave the user guessing which command to run.

## Keep move checking at the isolate boundary

The 0.6.6 collection design made mutators consume their receiver and return the updated collection. Even a local list needed rebinding after a push. The 0.6.7 plan changes that decision.

Move and use-after-move checks are intended to apply where values cross to another isolate: task captures, port sends and parallel execution steps. The explicit, zero-copy hand-over of a Moved graph stays. Ordinary local collection methods return to mutating their receiver.

That simplification still has to preserve the storage guarantee. Fixing accidental sharing between assigned lists is part of the work, and the final collection behavior needs integration tests. Removing a local ownership restriction does not make shared mutable storage safe by itself.

## Small language changes with a visible effect

The planned syntax changes are deliberately concrete:

- Fields in a `type` body end in semicolons. Enum variants and literal entries keep commas.
- Conditional expressions use `condition ? whenTrue : whenFalse`.
- Numeric literals take their type from context when possible. Explicit suffixes still win, and an out-of-range value gets a diagnostic.
- String literals gain escapes including `\n`, `\t`, `\r`, `\0` and `\u{...}`.

For example, the planned field syntax is:

```beskid
type Point {
    i32 x;
    i32 y;
}
```

These are roadmap examples, not a promise that the currently downloadable compiler accepts them. Formatter changes accompany the syntax work: consecutive imports and fields stay together, useful single blank lines survive, and longer runs collapse.

## Make runtime and test failures understandable

The runtime work addresses waiting in `Main`, including channels, timers and I/O, so other fibers can run while the root fiber is blocked. Shutdown also needs to finish when a detached fiber is waiting for console input.

Child-process handling is planned to search `PATH` and return captured output whenever the child started. The caller checks the exit code; a program that exits unsuccessfully is different from a program that could not be launched.

Host lifecycle hooks are another correctness focus: startup, scope initialization and cleanup must run at their specified points, including exits from a scope. Test reporting should distinguish an assertion mismatch, with expected and actual values at the assertion call, from a runtime crash.

## What would make it ready

Individual checks have passed during development, but they do not establish release readiness. Integration has already found problems that only appeared when the slices met. The remaining proof is a sustained language-server soak, a sweep for internal compiler errors, clean-machine onboarding, matching Linux, macOS and Windows builds, and hands-on approval of the final editor preview.

The plan moves benchmarks, precise stack maps and further language growth to the 0.7 line. Even the [properties preview](/blog/v0-7-0-properties-preview/) is a proposal for later work. For now, 0.6.7 has a practical test: can you edit, check and run an ordinary project without fighting the tools?

Use the [download page](/downloads/) for verified current builds. The [editor guide](/docs/getting-started/editor/) and [language standard](/docs/standard/) describe the public tooling and contracts; this roadmap does not replace them.

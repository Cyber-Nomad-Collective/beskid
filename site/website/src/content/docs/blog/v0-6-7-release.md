---
title: "beskid 0.6.7: The Tools Stop Lying"
description: "beskid 0.6.7 closes the 0.6 line. Every compiler failure is a coded diagnostic, the language server answers within a limit and survives its own panics, move is needed only where a value crosses to another isolate, and the language gets the conveniences people kept asking for. It also ships the parallel runtime that 0.6.6 never released."
date: 2026-11-01
blogStatus: in-progress
release: v0.6.7
draft: true
---

<!-- DRAFT. Do not publish. Update `date` to the publication date, set `blogStatus: released` and `draft: false` only after the release evidence exists. -->
<!-- VERIFY: choose a public-domain cover image under /blog-covers/v0-6-7-release.jpg and add the `cover` block (src, alt, sourceHref, sourceLabel) as in the 0.6.0 post. -->

<!-- VERIFY: three-platform release evidence (Linux x64, macOS arm64, Windows x64; 95 mandatory cases each) is not complete. Ship this lead sentence only when it is. -->
**beskid 0.6.7 is out for Linux, macOS and Windows.** It is the last 0.6 release. The next one is 0.7.

There was supposed to be a 0.6.6 first. Its Linux build failed on a generated Corelib `Project.lock` that the release gate counted as source, and by the time the gate was fixed, the next release was already half written. So 0.6.6 was never released, and everything it carried ships here, together with a release whose whole subject is the boring question every compiler gets asked eventually: when it fails, does it tell you the truth?

## No uncoded internal errors

An internal compiler error is the compiler admitting it does not know what went wrong. Before 0.6.7 you could reach one from ordinary code: a construct the checker had not seen in that position, a case the lowering did not expect. The message was a Rust panic, the span was nowhere, and the only useful thing you could do was file a bug.

In 0.6.7 each of those paths is a coded diagnostic at the construct that caused it. If the compiler cannot handle something, it says which thing, where it is, and which code to look up. We ran the compiler over the Corelib, the templates, the Book examples and a sweep of broken programs, and none of them reaches an uncoded internal error.

## One diagnostic, everywhere

The CLI and the editor now show the same diagnostic. It has a short message, the exact span, a code from one registry, a help line, and a quick fix when the repair has exactly one meaning. Parse errors have their own codes, `E0101` to `E0117`, so a missing `;` is no longer "unexpected token" with a guess attached. `--error-format=json` prints the same diagnostic for tools that would rather not parse prose.

`beskid test` is part of this. A failed assertion reports `assertion failed: expected 3, found 4` with the call site, a trap reports `test crashed:` with its reason, and `--json` carries the failure. `Assert.Equal<T>` is generic and shows both values through the `Formatting` contract, so you read the values instead of a pointer.

## A language server that answers

A language server has two ways to fail you: it crashes, or it thinks. Both look the same from the editor. Nothing happens.

The 0.6.7 server isolates a panic to the request that caused it. The request fails, a crash report goes to `~/.beskid/crash/`, and the server keeps serving the rest of the workspace. And no request waits without a limit during a burst of edits: semantic tokens, references, signature help and inlay hints answer within 100 ms, and rename, prepare rename and code actions within 500 ms. A request that cannot finish in time answers `ContentModified`, and the editor asks again when the analysis is current. We measured this in a 30-minute soak on a loaded builder, because a latency budget nobody has measured is a wish.

## `move` where it means something

0.6.6 introduced `move`, and with it a rule that collection mutators consume the collection. You wrote `list = list.Push(value)`, and forgetting the rebinding was a compile error. That fixed a real bug class, two lists sharing one storage array, at the cost of making every list operation look like a puzzle.

0.6.7 keeps the safety and drops the puzzle. `move` is needed only where a value crosses to another isolate: a port send, a `move` capture of a task body, an isolate spawn. Collection mutators take `mut this`, so `list.Push(x);` changes `list` in place, as it reads. Arrays follow the same idea: an element write through one handle reaches every handle, but growing or shrinking one handle never changes another.

## Conveniences

None of these is large. Together they remove most of the small annoyances of writing beskid every day.

- Optional parameters with constant defaults, on functions, methods, contract methods, hosts and scopes.
- Caller information: a `[CallerFilePath]`, `[CallerLineNumber]` or `[CallerColumnNumber]` parameter receives the call site, which is how `Expect.Equal` reports the line you called it from.
- The conditional expression `cond ? a : b`.
- String and character escapes, and the compound assignments `*=`, `/=` and `%=`.
- Numeric literals that take their type from the context. A value that does not fit is T0905 at the literal, with the type's range in the help, never a silent wrap.
- Contract values with runtime dispatch, and primitives and `string` that implement contracts, so `impl i64 : Formatting` is a thing you can write.
- Inline modules are lexical scopes, and a duplicate name in one scope is one error, E1102, instead of three codes that meant the same thing.
- Tests have their own namespace and PascalCase names, and `beskid test` selects them by qualified name.

The command line got the same treatment: log levels, `-v` and `-q`, `--plain`, a progress line on a terminal, and a clean exit when the pipe closes. Without `--target`, `beskid build` and `beskid run` never pick a Test target, and `beskid test` runs every Test target. `beskid check --all-members` checks a whole workspace. `beskid fmt` never renames an identifier, and it writes files atomically.

## One Corelib per toolchain

Every project used to carry its own copy of Corelib. 0.6.7 installs one sealed, shared Corelib with the toolchain, and projects read it in place. `Project.lock` moves to format 3; any other lock format is E3025, and the fix is to delete the lock and write a new one. beskid has no users yet, so there is no migration, only a clear error.

## Also in this release: more than one core

This is the work 0.6.6 was going to announce. Fibers still interleave on one scheduler, but that scheduler now belongs to an isolate: a runtime instance with its own heap, collector and thread. A process runs many isolates, and `Core.Parallel` is how you use them. `Parallel.Scope` runs tasks on other isolates and joins every one before it returns. `Port<T>` is a bounded queue between isolates. A Corelib list has `.Parallel()`, which splits the work into chunks for `Where`, `Map` and `Reduce`.

A value crosses to another isolate only when its type is transferable, and the compiler checks the type's fields against its marker: Shared values cross by pointer, copyable values are copied, and moved values are handed over. Under that sits an incremental collector, with a write barrier and a reference protocol for objects that other heaps point at. Rust Glue also grew: a record crosses by value as a C struct, an enum without payloads crosses as its variant index, and a function type can be a parameter of a Glue import.

Book chapter 11 has the details, and the Standard has the rules.

## What is still missing

- **Benchmarks.** The fork-join, ping-pong and data-parallel benchmarks and the collector pause measurement are not written. This post makes no speed claims for the parallel work.
- **Platform evidence for every isolate scenario.** The isolate, port and sequence tests ran on Linux during development; the release build runs them on all three targets.
- The Glue stdio bridge stays provisional, and `glue-dotnet` is gone.

## Before you upgrade

For the record, these changes break code written for 0.6.0:

- Fields in a `type` end with `;`. A comma is E0115 with a fix, and `scripts/migrate/v067_field_semicolons.py` rewrites sources.
- `Project.lock` must be format 3 (E3025 otherwise).
- A test name that is not PascalCase is W1637.
- `move` outside an isolate crossing is an error; remove it.
- On x86_64, programs need an x86-64-v2 CPU. aarch64 builds for Armv8.0-A.

## Install or upgrade

<!-- VERIFY: cli-v0.6.7 release assets, Homebrew formula 0.6.7, VS Code and Zed extension 0.6.7 and the packaging notes must exist and match before publication. -->
On macOS, use the Homebrew tap:

```sh
brew tap cyber-nomad-collective/beskid https://github.com/Cyber-Nomad-Collective/beskid_homebrew.git
brew upgrade cyber-nomad-collective/beskid/beskid
```

On Windows, download the [0.6.7 setup executable](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-v0.6.7/beskid-0.6.7-windows-amd64.exe). On Linux, download the [AMD64 DEB](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-v0.6.7/beskid-0.6.7-amd64.deb). The [versioned release](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/cli-v0.6.7) also has the Windows MSI and the macOS DMG, and the [native bundles](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/v0.6.7) carry a complete installed prefix.

`beskid --version` should print `0.6.7`. `beskid doctor` checks the installation without changing it.

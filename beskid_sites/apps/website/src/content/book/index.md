---
title: "The Beskid Book"
description: A practical language tutorial for Beskid, from first install to contributing across the platform.
template: splash
---

This book is the practical introduction to Beskid. It is written as a tutorial track first, with links into the normative spec when you want exact rules.

> **Canonical specification:** Enforceable language and platform contracts live under the [Platform specification](/platform-spec/), especially [Language meta](/platform-spec/language-meta/). This book is informative—use it to learn, then confirm rules in platform-spec.

## Start here

- **Why this exists:** [Why Beskid Exists](/book/00-why-beskid-exists/) — opinionated context (skip to [install](/book/01-it-works-on-my-machine/) if you want binaries, not philosophy).
- **Hands-on:** [01. It works on my machine](/book/01-it-works-on-my-machine/).

## How to use this book

- Read chapters in order if you are new to Beskid.
- Treat each chapter as "learn, apply, verify": read the concept, try it in a small file, then cross-check with linked spec pages.
- Keep the [Platform specification](/platform-spec/) open for details and edge cases.

## Learning tracks

- **Language user:** [01. It works on my machine](/book/01-it-works-on-my-machine/) → [07. The compiler is not your therapist](/book/07-compiler-is-not-your-therapist/) → [08. Green tests, red production](/book/08-green-tests-red-production/) → [19. Public API that survives review](/book/19-public-api-that-survives-review/) → [20. /// comments that are not lies](/book/20-doc-comments-that-are-not-lies/)
- **Monorepo / packages:** [03. Project.proj or it didn't happen](/book/03-project-proj-or-it-didnt-happen/) → [06. Monorepo as coping mechanism](/book/06-monorepo-as-coping-mechanism/) → [18. Packages without npm trauma](/book/18-packages-without-npm-trauma/) → [19. Public API that survives review](/book/19-public-api-that-survives-review/)
- **Spec collaborator:** [12. The normative bible](/book/12-the-normative-bible/) → [13. Reading the law](/book/13-reading-the-law/) → feature under test in platform-spec
- **Compiler contributor:** [13. Reading the law](/book/13-reading-the-law/) → [14. From source to something that runs](/book/14-from-source-to-runs/) → [15. Mods: plugins with consequences](/book/15-mods-plugins-with-consequences/) → [17. Execution](/book/17-execution-abi-host-runtime/) → [22. So you want to contribute](/book/22-so-you-want-to-contribute/)
- **Philosophy optional:** [00. Why Beskid exists](/book/00-why-beskid-exists/) — or jump straight to [01](/book/01-it-works-on-my-machine/)

## Tutorial chapters (01–22)

| # | Chapter |
| --- | --- |
| 01 | [It works on my machine](/book/01-it-works-on-my-machine/) |
| 02 | [PATH not found — tooling anyway](/book/02-path-not-found-tooling-anyway/) |
| 03 | [Project.proj or it didn't happen](/book/03-project-proj-or-it-didnt-happen/) |
| 04 | [Where does this file even go?](/book/04-where-does-this-file-go/) |
| 05 | [Names nobody agreed on](/book/05-names-nobody-agreed-on/) |
| 06 | [Monorepo as coping mechanism](/book/06-monorepo-as-coping-mechanism/) |
| 07 | [The compiler is not your therapist](/book/07-compiler-is-not-your-therapist/) |
| 08 | [Green tests, red production](/book/08-green-tests-red-production/) |
| 09 | [Contracts, effects, and polite threats](/book/09-contracts-effects-and-polite-threats/) |
| 10 | [Memory without another billion-dollar mistake](/book/10-memory-without-billion-dollar-mistake/) |
| 11 | [Fibers: cheaper than threads](/book/11-fibers-cheaper-than-threads/) |
| 12 | [The normative bible](/book/12-the-normative-bible/) |
| 13 | [Reading the law](/book/13-reading-the-law/) |
| 14 | [From source to something that runs](/book/14-from-source-to-runs/) |
| 15 | [Mods: plugins with consequences](/book/15-mods-plugins-with-consequences/) |
| 16 | [Corelib: batteries with opinions](/book/16-corelib-batteries-with-opinions/) |
| 17 | [Execution: ABI, host, and runtime](/book/17-execution-abi-host-runtime/) |
| 18 | [Packages without npm trauma](/book/18-packages-without-npm-trauma/) |
| 19 | [Public API that survives code review](/book/19-public-api-that-survives-review/) |
| 20 | [/// comments that are not lies](/book/20-doc-comments-that-are-not-lies/) |
| 21 | [FFI and other forbidden friendships](/book/21-ffi-and-forbidden-friendships/) |
| 22 | [So you want to contribute](/book/22-so-you-want-to-contribute/) |

## Reference (workflows and commands)

Informative deep dives merged from the former guides tree:

- [CLI](/book/reference/cli/) and [command reference](/book/reference/cli/command-reference/)
- [Projects and manifests](/book/reference/projects/)
- [LSP](/book/reference/lsp/)
- [Analysis](/book/reference/analysis/)
- [Testing](/book/reference/testing/)
- [Workspace monorepo setup](/book/reference/workspace-monorepo/)
- [Publish your first package](/book/reference/publish-first-package/)

## What you should know after finishing

- How Beskid source layout maps to module and name-resolution behavior.
- How project/workspace manifests control build and dependency resolution.
- How to design stable public APIs with `pub` and `pub use`, document them with `///`, and publish packages without manual version theatre.
- Where platform-spec, compiler crates, and CI fit when you contribute.

---
title: "One Repo Orchestrates, Submodules Own Their Domains"
description: "The clean break at compiler handoff: how Beskid decided that the superrepo integrates and the compiler stands alone. The architectural decision that has held for every release since."
date: 2026-03-05
blogStatus: released
release: v0.0
---

On 5 March 2026, the Beskid compiler moved out.

It was not extracted. It was not split. It was *moved* — from a crate inside the Beskid superrepo to its own standalone repository, with its own CI configuration, its own issue tracker, its own release cadence, and its own destiny. The commit that completed the handoff was `dd75bff`. The architecture it established has held for every release since.

## Before: the monorepo that wasn't

The Pecan prototype lived inside the Beskid superrepo as a Cargo workspace. There was a `compiler/` directory, a `runtime/` directory, and a root `Cargo.toml` that tied them together. This was natural for a prototype — one `cargo build` built everything, one `cargo test` tested everything, one `cargo fmt` formatted everything. Simplicity is the right default when you are seventeen days old and still figuring out what the language is.

But simplicity at small scale becomes friction at larger scale. The compiler crate had no independent version. Changes to the compiler were coupled to changes in the superrepo — not technically (Cargo workspaces can version independently), but *socially*. A commit that touched the parser and a commit that touched the website lived in the same history, triggered the same CI pipeline, and blocked each other's merges. The compiler was a citizen of the superrepo, not a sovereign entity.

This mattered because the compiler was becoming sovereign on its own. It had its own design documents. Its own diagnostic code registry. Its own staged analysis pipeline. It was not a component of Beskid — it *was* Beskid, in the sense that the language exists where the compiler decides it exists. The superrepo was the project; the compiler was the product.

## The handoff

The handoff was mechanical: extract the compiler crate into a new repository, rewrite the history to preserve attribution, configure CI, and add the repository as a Git submodule of the superrepo. But the mechanical act encoded a philosophy.

The superrepo became an **integration point**, not an owner. It declared which version of the compiler was compatible with which version of the runtime, the standard library, the package manager. It ran integration tests that crossed repository boundaries. It produced the release artifacts that users downloaded. But it did not *develop* the compiler. It consumed it.

The compiler repository became a **sovereign domain**. It had its own release schedule (weekly, not tied to Beskid releases). Its own contributor workflow (fork, PR, review, merge — no superrepo approval needed). Its own CI gates (parser benchmarks, diagnostic snapshot tests, HIR round-trip fuzzing). Its own breaking-change policy. The compiler could ship a patch release without the superrepo knowing, and the superrepo could bump the submodule pointer when it was ready to absorb the change.

## Why this mattered

**CI isolation.** The compiler's CI runs in under four minutes. It tests one thing: does the compiler correctly transform source text into verified semantic trees? The superrepo's CI runs in twenty minutes and tests integration across five submodules. When the two were one repository, every compiler change paid the integration tax. After the split, compiler changes paid only the compiler tax. Integration tests ran when the superrepo bumped the submodule pointer — which happened deliberately, not incidentally.

**Release cadence.** The compiler can ship weekly. Beskid releases ship roughly monthly. Decoupling these rhythms meant that compiler fixes reached users faster, and Beskid releases were stabilized against known compiler versions rather than chasing a moving target.

**Contributor sanity.** A new compiler contributor clones the compiler repository. It is small, focused, and self-contained. They do not need to understand the superrepo's build system, the website's static site generator, or the package manager's dependency resolver. They need to understand the compiler. The submodule architecture creates a *radius of concern* for every contributor — and keeps it small.

## The pattern that spread

The compiler was the first submodule. It was not the last. The pattern — one repo orchestrates, submodules own their domains — extended to every major component:

- **compiler** — language parsing, analysis, and code generation
- **pckg** — the package manager and registry client
- **tracker** — the release tracker and provenance system
- **nexus** — the build orchestration layer
- **docs** — the Book, platform specification, and website

Each submodule has its own CI. Its own versioning. Its own contribution workflow. The superrepo integrates them — pins their versions, runs cross-module tests, produces releases. But it does not *own* them. Ownership lives where the code lives.

This is not a monorepo. It is not a polyrepo. It is a **superrepo with sovereign submodules** — a pattern that few projects adopt and fewer document. Beskid adopted it on day seventeen and has never reconsidered.

## The principle

Read [Project.proj or it didn't happen](/book/00-why-beskid-exists/project-proj-or-it-didnt-happen/) in the Book for the full philosophy of how Beskid organizes its work. The submodule architecture is the structural expression of that philosophy: boundaries are real, ownership is local, and integration is a deliberate act, not an accident of directory layout.

The compiler moved out on 5 March 2026. It has not moved back. It will not. The decision to treat the compiler as a sovereign project — not a component, not a crate, not a subdirectory — is the architectural decision that has held for every release since, and the one most likely to hold for every release to come.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.0/version.json) &mdash; [compiler handoff](https://github.com/Cyber-Nomad-Collective/compiler/commit/dd75bff)

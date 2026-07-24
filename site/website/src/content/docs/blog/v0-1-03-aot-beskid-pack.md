---
title: "AOT from Day One: Why We Skipped the VM Detour"
description: "Besid v0.1 shipped AOT compilation and beskid pack before the language was usable. Not because it was ready, but because we refused to build a runtime we'd have to undo later."
date: 2026-04-12
blogStatus: released
release: v0.1
---

Every language project faces a temptation: build an interpreter first.

The reasoning is seductive. Interpreters are fast to write. You get a REPL. You can iterate on the language without waiting for compilation. Users can run code immediately. The feedback loop is tight. Everyone feels productive.

The problem is that interpreters are **addictive**. Once you have one, every language feature gets designed around it. The runtime grows assumptions about dynamic dispatch, about reflection, about the shape of the call stack. Then you decide you need performance. Then you bolt on a JIT. Then the JIT needs a tiered compilation strategy. Then you have two runtimes — one for development, one for production — and they behave slightly differently, and someone files a bug that only reproduces in one of them, and you spend three days bisecting a divergence that exists because you started with an interpreter in 2017.

Beskid v0.1 skipped all of that.

## AOT-first: the deliberate decision

v0.1 shipped Ahead-of-Time compilation as the **only** execution path. No interpreter. No VM. No JIT. Source code went in one end of the pipeline. Machine code came out the other. There was no other way to run a Beskid program.

This was not because AOT was ready. It was not fast. It was not polished. The generated code was unoptimized and the compile times were unremarkable. But it existed, and it ran in CI, and the CI gate was **green**.

The decision was philosophical: if the language eventually needs AOT — and every systems language does — then building an interpreter first is just building a runtime you will have to undo. Better to start with the hard thing and make it work badly than to start with the easy thing and pretend the hard thing does not exist.

## The `beskid pack` command

Alongside AOT compilation, v0.1 shipped `beskid pack` — a command that bundled compiled output into a distributable artifact. It was minimal. It was not a package manager. But it established the pattern: compilation produces artifacts, and artifacts need packaging, and packaging is part of the compiler's job, not an afterthought.

This mattered because packaging forces you to think about **boundaries**. What goes into the artifact? What stays on the build machine? What does the runtime expect to find at startup? These questions are easy to defer when you have an interpreter — just point it at a directory and run. They are impossible to defer when your only output is a standalone binary.

## Machine code is not an afterthought

In most language projects, machine code comes last. You build a tree-walk interpreter. Then a bytecode VM. Then a JIT. Then — maybe, years later, if the language is successful — an AOT compiler. By that point, the language semantics are deeply entangled with the runtime architecture, and retrofitting AOT means unwinding a decade of assumptions.

Beskid v0.1 inverted that: machine code came first. The compiler's output was native from day one. This simplified the pipeline enormously — no bytecode IR, no virtual stack machine, no tiered optimization strategy. Just parsing, analysis, code generation. Three phases, one output format.

The contrast with .NET is instructive. .NET started with IL — an abstract bytecode designed for JIT compilation. Two decades later, the ecosystem is still retrofitting AOT via NativeAOT and trimming and tree-shaking and a hundred other workarounds for the fact that IL was not designed to be compiled statically. Beskid v0.1 decided not to make that mistake.

## What AOT made possible

AOT from day one meant that every CI run proved something real: the compiler can produce a binary that runs. Not "the compiler can produce bytecode that a VM can interpret." Not "the compiler can produce IL that a JIT can optimize." A binary. On the target platform. With no runtime dependency except the OS.

This was the foundation for everything that followed — the release pipeline, the VS Code extension, the green-gate discipline. If the compiler could not produce a running binary, the gate was red. Full stop.

The Book chapter [From source to runs](/book/14-from-source-to-runs/) covers the AOT build pipeline in detail. The short version: v0.1 bet on AOT, and the bet paid off.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.1/version.json) — [maintainer narrative](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.1/article.md) — [delivery cutoff](https://github.com/Cyber-Nomad-Collective/beskid/commit/f777b79)

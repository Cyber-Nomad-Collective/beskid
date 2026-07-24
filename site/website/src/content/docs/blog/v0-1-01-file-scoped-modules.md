---
title: "File-Scoped Modules: The Compiler Knows Where Your Files Go"
description: "Convention is not a module system. Beskid v0.1 made file boundaries explicit and compiler-enforced — and if you got it wrong, the diagnostic had a span and a code, not a Stack Overflow post from 2014."
date: 2026-03-30
blogStatus: released
release: v0.1
---

Every language claims to have a module system. Most of them lie.

They have **convention**: put files in folders, name them like this, hope the resolver figures it out. Go does it — package declarations coupled to directory names, with `internal/` as the only hard boundary and the rest left to folk wisdom. Rust does it — `mod` statements that mostly mirror the filesystem but let you override it, so nobody is quite sure whether the tree or the `mod` keyword is authoritative. Java bakes it into the classpath, where `com.example.utils` is a social contract enforced by a linter your team may or may not run.

Convention works until it doesn't. Until you have circular imports that the compiler accepts but the linker rejects, six levels deep, at 11 p.m. on a Thursday. Until you have a `utils` directory that ate the project — thirty files, no coherent boundary, and a transitive dependency graph that looks like spaghetti dropped from a balcony. Until a new hire cannot figure out why `import` works in one file and not the one next to it, because the resolver has an opinion about directory layout that nobody documented and everyone "just knows."

## What Beskid v0.1 did differently

Beskid v0.1 made file-scoped modules **explicit and compiler-enforced**. Every file is a module. Every module boundary is declared. The compiler knows exactly where each boundary sits because you told it — and if you got it wrong, the diagnostic has a span and a code, not a Stack Overflow post from 2014.

This sounds small. It is not.

A module system that the compiler enforces is a **contract**. It says: these symbols are visible here, these are not, and this boundary is not negotiable. When you violate it, the compiler tells you exactly where and exactly why. There is no ambiguity to resolve at 2 a.m. There is no tribal knowledge about which directories are special. There is a rule, and the compiler gate enforces it.

## Circular imports: the silent killer

Most convention-based module systems handle circular imports poorly because they were not designed to handle them at all — circularity emerges from the filesystem graph, not from the language semantics, and by the time the compiler notices, you are debugging a linker error that mentions neither file.

Beskid's file-scoped modules make circularity a **compile-time error with provenance**. The diagnostic names both files, traces the cycle, and tells you where to break it. This does not make circular imports impossible — you can still architect yourself into a corner. But it makes the corner visible, and it does so before you ship.

## The resolver hardening

Under the hood, v0.1's resolver treated every file boundary as a scope gate. Symbols did not leak. Imports were explicit. The resolver had to be correct because there was nowhere to hide — no implicit re-exports, no magical directory-based visibility, no "well, it works on my machine" module resolution. Every import was either valid or invalid, and the compiler had to prove which.

This was not glamorous work. It was a stack of edge cases — files in subdirectories, files with the same name in different packages, files that imported themselves through a chain of three other files. Each edge case got a test. Each test got a diagnostic. Each diagnostic got a span and a code.

The Book chapter [Names nobody agreed on](/book/05-names-nobody-agreed-on/) covers the philosophy behind this decision: every language project rediscovers the module-boundary problem, and most of them pretend it doesn't exist. Beskid v0.1 decided to face it head-on.

## What this meant for v0.1

File-scoped modules were not a feature. They were the **foundation**. Every other decision in v0.1 — the corelib structure, the AOT compilation path, the CI gate — depended on a module system that made boundaries explicit and enforceable. Without that, the compiler could not reason about code at scale. With it, the compiler had a fighting chance.

The diagnostic had a span and a code. That was the promise. And v0.1 kept it.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.1/version.json) — [maintainer narrative](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.1/article.md) — [delivery cutoff](https://github.com/Cyber-Nomad-Collective/beskid/commit/f777b79)

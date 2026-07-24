---
title: "Never Merge a Compiler Bump Without a Green Gate"
description: "Besid v0.1 discovered the discipline that would become the project's immune system: every compiler bump is a deliberate pin to a tested commit. The release pipeline, VS Code extension, and Open VSX publishing."
date: 2026-04-20
blogStatus: released
release: v0.1
---

If v0.0 was the fever dream, v0.1 was the discipline.

The compiler existed. The corelib existed. AOT produced binaries. But none of that mattered unless the project could **ship** — consistently, repeatably, on multiple platforms, without someone staying up until 3 a.m. manually copying artifacts to a release page.

v0.1 did not have a polished release pipeline. It had shell scripts, submodule pins, manual version bumps, and a VS Code extension that someone had to remember to publish. It was ugly. It was functional. And it shipped.

## The green gate

The rule was simple: **never merge a compiler bump without a green gate.**

A "compiler bump" was any commit that advanced the pinned submodule reference in the downstream repositories — the CLI, the VS Code extension, the website. The "green gate" was CI passing on all three platforms: the compiler built, the tests passed, the AOT output ran.

This sounds obvious. Every project claims to have CI. But most projects treat CI as a **suggestion** — "it's probably fine, the failure is flaky, I'll fix it tomorrow." Beskid v0.1 treated it as a **contract**. Red gate meant no merge. Period.

The discipline was not glamorous. It was the reason the project still builds.

## The release pipeline

The release automation for v0.1 was a stack of shell scripts that would make a DevOps engineer wince:

- A script that built the compiler on Linux, macOS, and Windows.
- A script that ran the test suite against each build.
- A script that packaged the binaries and uploaded them to GitHub Releases.
- A script that bumped the submodule pin in the CLI repository.
- A script that bumped the submodule pin in the VS Code extension repository.

Each script had exactly one job. Each script could fail independently. When one failed, someone had to figure out why — and the answer was usually "the submodule pin was stale" or "the release tag didn't match the expected format" or "Windows path handling, again."

It was ugly. It was also **honest**. There was no magic CI platform hiding the complexity. Every step was visible. Every failure had a cause. Every fix was a commit.

## The VS Code extension

v0.1 shipped a VS Code extension that bundled the LSP by default. Users installed the extension. The extension downloaded the LSP binary. The LSP connected to the compiler. Diagnostics appeared in the editor.

This was the **bundled-LSP default** pattern: the extension was the distribution channel, and the LSP was the payload. No separate LSP install. No version mismatch between the extension and the compiler. One install, one version, one source of truth.

The extension published to Open VSX automatically — not because the team loved Open VSX, but because the VS Code Marketplace requires a Microsoft account and the Open VSX registry does not. Automation hates manual accounts. Open VSX won.

## Why "never merge without a green gate" became the immune system

Every software project decays. Dependencies drift. Tests get skipped. CI goes red and stays red because "we'll fix it next sprint." The decay is gradual — one skipped test, one bypassed gate, one "temporary" workaround that lives for six months.

The green-gate discipline was the project's immune system. It did not prevent decay — nothing prevents decay. But it **detected** decay immediately, at the point of introduction, when the fix was still a single revert rather than a week-long investigation.

A compiler bump that broke the gate was reverted. No exceptions. No "it's probably fine." If the gate was red, the compiler was not ready. The discipline was absolute because the alternative — a gate that is sometimes enforced — is not a gate at all. It is a suggestion. And suggestions do not prevent drift.

## What this meant for v0.2 and beyond

Every release after v0.1 inherited this discipline. The shell scripts got replaced by proper CI workflows. The manual version bumps got automated. But the rule remained: green gate or no merge. The immune system outlived the scripts that implemented it.

The Book chapter [Tooling and editors](/book/15-tooling-and-editors/) covers the extension architecture in detail. The compiler gate design docs explain the CI contract. The short version: v0.1 discovered that shipping is a discipline, not a feature, and the discipline compounds.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.1/version.json) — [maintainer narrative](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.1/article.md) — [delivery cutoff](https://github.com/Cyber-Nomad-Collective/beskid/commit/f777b79)

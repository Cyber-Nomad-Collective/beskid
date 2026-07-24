---
title: "The Great Platform-Spec Cutover: Splitting the Book from the Law"
description: "Before v0.2, tutorials and normative rules shared the same page. 'Here is how to write a loop' sat next to 'the compiler SHALL reject this pattern.' The cutover split them — and discovered that splitting documentation is a build pipeline problem."
date: 2026-05-01
blogStatus: released
release: v0.2
---

Before v0.2, the Book and the spec were the same thing.

"Here is how to write a loop" shared a page with "the compiler SHALL reject this pattern." Tutorial prose sat next to normative rules. Philosophical rants about language design were interspersed with contract-level assertions about type resolution. It was readable — in the way that a wiki is readable: you could find things, if you already knew where they were, and if the page you were reading had not been edited since the last compiler change.

It was also **wrong**.

When you change a normative rule, you should not have to rewrite a tutorial. When you add a tutorial, you should not accidentally imply a language guarantee. When someone reads documentation at 2 a.m. trying to understand why their code does not compile, they should not have to distinguish between "this is a binding constraint on the compiler" and "this is something the author thought was a good idea in March."

Mixing tutorial and normative prose is not a style problem. It is a **contract problem**. Contracts need to be verifiable. Prose does not. When you blur the line, you get documentation that is neither trustworthy nor readable — it is too rigid to teach and too ambiguous to enforce.

## The cutover

The platform-spec cutover split them:

- **[/platform-spec/](/platform-spec/)** became the **normative authority**. Language law. Compiler contracts. Every statement carries weight. If it says "SHALL," the compiler gate enforces it — or the gate is red.
- **[/book/](/book/)** became **informative**. Tutorials, rants, philosophy, the kind of prose that makes sense when you are questioning your career choices at 2 a.m. It can be wrong without breaking the compiler. It can be opinionated without being binding.

This sounds obvious in retrospect. It was not obvious at the time. It took weeks.

## The commit log graveyard

The commit log from May 2026 tells the story better than any narrative:

- "consolidate platform-spec cutover and stabilize website container build"
- "add trudoc/docs UI packages and workflow updates"
- "use monorepo lockfile in site image build"

Every one of those commits is someone discovering the same thing: splitting documentation is **not a docs problem**. It is a **build pipeline problem** with a documentation-shaped symptom.

The website build had to know which pages were spec and which were book. The container image had to bundle both but serve them differently. The lockfile had to include documentation dependencies that had never been dependencies before. The redirects had to work — old URLs pointing to pages that no longer existed, new URLs pointing to pages that had moved. Every link in every page had to be audited, because a link that crossed the spec/book boundary was now a link between two different documentation systems.

This was not writing. This was **engineering** — the kind of engineering that looks like renaming files and fixing frontmatter, but is actually about defining the contract between the language and its documentation.

## Why the split matters

The platform-spec cutover was not a one-time cleanup. It was the **foundation** for everything that followed: trudoc, api.json, the compiler-as-authority pattern. You cannot have a machine-verifiable spec if the spec and the tutorials share a table of contents. You cannot have trudoc if there is no spec for trudoc to verify against.

The split made the spec **actionable**. It turned "the documentation says" into "the spec requires." That distinction — between description and prescription — is the difference between documentation that rots and documentation that enforces.

The Book chapter [The normative bible](/platform-spec/) is what came out the other side. The short version: v0.2 learned that docs are not just markdown, and the lesson cost several weeks of commit messages to fully absorb.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.2/version.json) — [maintainer narrative](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.2/article.md) — [delivery cutoff](https://github.com/Cyber-Nomad-Collective/beskid/commit/f57377a)

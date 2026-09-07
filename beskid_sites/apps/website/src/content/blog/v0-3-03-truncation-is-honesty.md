---
title: "Truncation Is Not Failure — It Is Honesty"
description: "Most language projects ship features they shouldn't. They merge half-finished work, mark it 'experimental,' and hope the community finishes it. Beskid v0.3 did the opposite: this is what shipped, this is what didn't, and the cutoff is hard."
date: 2026-05-25
blogStatus: truncated
release: v0.3
---

Most language projects ship features they should not. They merge half-finished work, mark it "experimental," and hope the community finishes it for them. The result is a graveyard of half-implemented features that nobody can remove because someone might depend on them.

Beskid v0.3 did the opposite. It said: **this is what shipped, this is what did not, and the cutoff is hard.**

## The experimental graveyard

"Experimental" is the most dangerous word in a compiler codebase. It means: we merged this, we don't know if it works, we don't know if the design is right, and we are offloading the discovery onto users. Users who didn't sign up to be test subjects. Users who will build production code on the feature and then discover — months later — that the semantics were wrong and their program has been silently corrupting state.

The graveyard grows fast. An experimental GC here. An experimental async runtime there. An experimental type-system extension. Each one was merged because someone was afraid to say "not yet." Each one becomes a millstone around every future change.

Beskid's rule is simple: if it cannot be verified by the CI gate, it does not ship. No exceptions. No "experimental" escape hatch.

## The hard cutoff at aaddd32

The integration weekend ended at commit [`aaddd32`](https://github.com/Cyber-Nomad-Collective/beskid/commit/aaddd32). That commit was the cutoff. Whatever was in the tree at that point was v0.3. Whatever was not — even if it was 90% done — was deferred.

This is not how most projects work. Most projects slip the deadline. They say "one more week" and then "one more week" and then the version boundary dissolves into a continuous stream of half-done work. The release notes become fiction.

The cutoff is a discipline. It says: the project ships in bands. Each band has a boundary. The boundary is real.

## The tracker records the gap

Deferring a feature is not the same as abandoning it. The tracker records every gap. The Phase-B GC track was not "cancelled" — it was recorded as deferred, with a note about why. The corelib tiering packages were not forgotten — they were filed under v0.4.

This is the difference between truncation and abandonment. Abandonment is when you stop tracking. Truncation is when you draw a line, record what is below it, and pick it up in the next band. The tracker is the continuity mechanism.

## The project manifest as contract

The Book's chapter [Project.proj or it didn't happen](/book/03-project-proj-or-it-didnt-happen/) makes the argument: a project manifest is not a wishlist. It is a contract. Every item in the manifest is a promise to the user. If the item is not there, the promise was not made. If the item is there, the promise must be kept.

v0.3 was the first band where we enforced that contract at the delivery boundary. The manifest said what v0.3 would ship. The cutoff said what it actually shipped. The gap between them was not hidden — it was documented.

## What survived

Four tracks landed clean. The `beskid lsp` command shipped and is still running today. VS Code bootstrap worked on first install. trudoc verification — the tool that checks every code sample in the documentation actually compiles — passed on every push to main. ASan CI wiring caught bugs before they shipped.

These are not glamorous deliverables. They are plumbing. They are the things that make a language usable — not in the sense of "has a cool type system" but in the sense of "you can install it, write code, get diagnostics, and trust that the docs are not lying."

Plumbing ships. Glamour waits.

## This blog post is truncated

This blog post is marked `blogStatus: truncated`. It is not "draft." It is not "in progress." It is truncated — published in its current state, with the understanding that there is more to say but the cutoff is real.

That is the whole point. Truncation is not failure. It is the statement: this is what we know now, this is where we stopped, and the next band picks up from here — not from where we wish we were.

Next: [v0.4 — Platform Services and the Long Tail of "In Progress"](/blog/v0-4-platform-services/)

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.3/version.json) — [Truncation cutoff](https://github.com/Cyber-Nomad-Collective/beskid/commit/aaddd32)

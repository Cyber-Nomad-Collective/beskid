---
title: "Trust to Verify: The Pattern Beskid Keeps Rediscovering"
description: "The platform-spec cutover, trudoc, and api.json are not separate stories. They are the same story: from trust to verify. From 'we wrote this correctly' to 'the compiler proves this is correct.'"
date: 2026-05-20
blogStatus: released
release: v0.2
---

v0.2 shipped four things: the platform-spec cutover, trudoc, api.json, and the runtime declarations. They look like separate stories. They are not. They are the same story, told four times, in four domains. The story is: **trust to verify**.

## The pattern

**Trust** means relying on humans to get it right. "We wrote this correctly." "The docs are up to date." "The spec matches the implementation." Trust is cheap at the start and expensive later. It rots. It drifts. It fails silently.

**Verify** means making the compiler the authority. "The compiler says this is correct." "The docs are generated from compiler facts." "The spec is enforced by compiler gates." Verify is expensive at the start and cheap later. It does not rot. It fails at build time.

Beskid v0.2 rediscovered this pattern in four domains:

## Diagnostics: manual to compiler-generated

Before v0.2, diagnostics were hand-written strings in the compiler source. "Error: type mismatch." The message was whatever the compiler author wrote. If the message was wrong, or misleading, or missing — nobody noticed until a user got confused.

After v0.2, diagnostics became compiler-generated from the platform spec. The spec says "the compiler SHALL emit diagnostic E042 with span X." The compiler generates E042 at span X. If the diagnostic is wrong, the spec is wrong — and the spec is verified against the compiler gate.

This is the same pattern: stop trusting the compiler author to write correct diagnostics. Make the compiler verify that its diagnostics match the spec.

## Documentation: hand-written to trudoc

Before v0.2, package documentation was hand-written markdown. "Here is the `map` function. It takes a list and a closure." If the signature changed, the docs might not. If a parameter was renamed, the docs might still reference the old name. Trust.

After v0.2, trudoc reads api.json from the compiler. The signature on the page is the signature the compiler knows. There is no "the docs might be stale." There is "the build passed, so the docs are correct."

This is the same pattern: stop trusting humans to maintain documentation. Make the compiler generate it.

## Spec: mixed prose to split Book/Spec

Before v0.2, the Book and the Platform Spec were the same pages. Tutorial prose sat next to normative rules. A tutorial edit could accidentally imply a language guarantee. A normative edit could break a tutorial. Trust that authors would not conflate them.

After v0.2, the Book is informative and the Platform Spec is normative. The split is enforced by the build pipeline — a Book page cannot contain normative language, and a Spec page cannot contain tutorial prose. The pipeline catches it.

This is the same pattern: stop trusting authors to maintain the boundary between law and pedagogy. Make the pipeline enforce it.

## Runtime handlers: Rust to ISLE CLIF

v0.2 did not ship this — it declared it. The runtime declarations (fibers, channels, abfall) were contracts: the spec says X, the compiler verifies X. The implementation can be anything that satisfies the contract.

This foreshadowed the ISLE runtime migration in v0.4, where primitive handlers moved from hand-written Rust to stock Cranelift CLIF generated from ISLE rules. The same pattern, one level deeper: stop trusting humans to write correct runtime handlers. Make the compiler generate them from verified rules.

## Why this pattern keeps emerging

The pattern keeps emerging because it is the natural gravity of a language project that takes correctness seriously. You start by trusting humans. You discover that humans make mistakes. You add verification. The verification reveals that the compiler already knows the answer — you just were not asking it.

Every domain follows the same arc: diagnostics, documentation, spec, runtime. The compiler starts as the thing that compiles your code. It ends as the authority in every domain that touches code. Not because anyone planned it that way. Because every time you ask "how do we keep this from rotting," the answer is the same: **ask the compiler**.

Read the Conclusion in the Book and [the ISLE runtime migration](/blog/isle-native-runtime-migration/) for where this pattern goes next.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.2/version.json) - [maintainer narrative](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.2/article.md) - [delivery cutoff](https://github.com/Cyber-Nomad-Collective/beskid/commit/f57377a)

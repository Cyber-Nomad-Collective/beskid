---
title: "One Ridge, One Map: Retiring Platform Spec"
description: "Beskid now serves its public documentation from one main-site Docs surface. The separate Platform Spec application is retired."
date: 2026-09-07
blogStatus: released
release: Documentation
---

Beskid has a simple shape. The compiler makes the language. The tools let people use it. The documentation must let people find the truth without changing sites, applications, or mental models.

The separate Platform Spec application did useful work. It read OpenSpec and made the standard visible. It also added another application, another deployment lane, another URL, and another place where the project could look more complex than it is.

We are retiring that application.

## One public documentation surface

[Beskid Docs](/docs/) now lives on the main `beskid-lang.org` site. It links to [The Beskid Book](/book/) for learning and to the [Beskid Standard](/docs/standard/) for normative behavior.

OpenSpec remains the source of the standard. This change does not move rules into a CMS or a second generated copy. It removes a renderer. The rules, catalog, validation, and repository review flow stay together.

Old `/platform-spec/` links now lead to the standard entry point. Update bookmarks when you can.

## Simplicity is project infrastructure

Beskid is a small project that we run with clankers: small automated helpers that perform clear, checked work. That model needs clear boundaries. A helper should find one source for a rule, one place to publish technical guidance, and one public site for readers.

The new shape is plain:

- OpenSpec defines normative behavior.
- Beskid Docs explains technical work.
- The Book teaches.
- The blog records decisions and progress.

That is one ridge and one map. It is easier to run, easier to review, and closer to the nature of the project.

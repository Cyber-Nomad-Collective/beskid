---
title: Write Beskid Documentation
description: Write clear technical documentation with ASD-STE100 Simplified Technical English.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: The authoring checklist and examples are clearer than a flow diagram.
audience:
  - contributor
authority:
  status: informative
  sourceLabel: Standard STE compliance policy
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/35fdb92cd9c4ad8f61e3d06d7171e94a694b2562/openspec/specs/standard-ste-compliance/spec.md
  limits: This page gives authoring guidance. It does not certify ASD-STE100 compliance.
verified:
  revision: 35fdb92cd9c4ad8f61e3d06d7171e94a694b2562
  date: 2026-09-08
---

Use ASD-STE100 Simplified Technical English, Issue 9, January 2025, for technical prose. Read the [official ASD-STE100 site](https://asd-ste100.org/) when you need the standard or its dictionary.

## Choose the correct source

Put normative requirements in `openspec/specs/`. Put public technical guidance in `site/website/src/content/docs/docs/`. Put learning material in the Book. Put dated news in the blog.

Do not write the same technical rule in more than one place. Link to the canonical page.

## Write clear instructions

Use short sentences. Use active voice and present tense. Give one action in each step. Define each Beskid-specific term before you use it. Use the same term throughout the page.

Keep code, commands, paths, URLs, and identifiers unchanged. Do not change a requirement statement or a `GIVEN`/`WHEN`/`THEN` scenario only to change its style.

## Check the page

Check that the title states the task. Check that links work. Run `pnpm review:ste` from `site/website`. Review each candidate manually. Use the documented, reasoned exception syntax only when the prose must stay unchanged.

Run the website tests and build for Docs changes. Run OpenSpec validation for normative changes. The STE review tool gives authoring evidence; it does not certify compliance.

The repository skill at `.claude/skills/ste-100-technical-documentation/SKILL.md` gives the same working rules to coding agents. It helps with authoring. It does not certify compliance.

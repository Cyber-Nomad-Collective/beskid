---
title: Beskid Standard
description: The normative source for Beskid language and tool behavior.
audience:
  - implementer
  - contributor
authority:
  status: normative
  sourceLabel: Beskid OpenSpec source
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/tree/main/openspec/specs
  limits: This page identifies the normative source. It does not reproduce the requirements.
verified:
  revision: e4cf3d521f553988a1648884a1c935afb2214682
  date: 2026-09-08
---

The Beskid standard defines normative behavior. The source files are in [`openspec/specs/`](https://github.com/Cyber-Nomad-Collective/beskid/tree/main/openspec/specs).

Use a requirement only when it contains `SHALL` or `MUST` and one or more scenarios. A Book page, blog post, README, or generated catalog does not define a new rule.

## Read the standard

- Browse one of the 198 capability pages generated from the checked-in catalog. For example, open the [CLI command surface](/docs/standard/capabilities/tooling--cli--command-surface/).
- Use a stable requirement page when you need to cite one rule. For example, open [`BSP-REQ-942B8B35A6BB`](/docs/standard/requirements/BSP-REQ-942B8B35A6BB/).
- Follow the canonical source link on either page. It opens the matching `openspec/specs/**/spec.md` file, and a requirement link opens its exact heading.
- Propose a change with an OpenSpec delta when a change affects observable language, compiler, runtime, core-library, tooling, or conformance behavior.

The current checked-in catalog contains 198 capabilities and 571 requirements. Generated pages identify those records but do not copy or reinterpret their normative prose.

## Stable public paths

The former Platform Spec service is retired. A known `/platform-spec/` alias now resolves to its catalog-backed capability page. A valid requirement fragment remains attached to that capability. An unknown alias opens the Standard not-found search state instead of an unrelated landing page.

Use `/docs/standard/capabilities/<capability-key>/` for a capability. Use `/docs/standard/requirements/<requirement-id>/` for one requirement. These paths preserve catalog identity when titles or navigation labels change.

The standard source is checked into the same repository as the Docs site. The website and the source therefore ship from one repository revision.

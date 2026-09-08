---
title: "Open Compiler, Open Services: Beskid's Licensing Contract"
description: "Beskid uses Apache-2.0 for the compiler, runtime, tools, and reusable libraries, and AGPL-3.0-only for Beskid-authored network services. Programs built with Beskid remain yours."
date: 2026-09-08
blogStatus: released
release: Licensing
---

A programming language sits on both sides of a boundary. The compiler and runtime should be easy to adopt, embed, study, and ship. A hosted service should remain open when someone modifies it and offers that modified version to users over a network.

Beskid now writes that boundary down in the repository instead of leaving it to inference.

## The boundary

The Beskid compiler, runtime, core library, language tooling, editor integrations, reusable libraries, deployment tooling, and project templates use the Apache License 2.0.

Beskid-authored network services use the GNU Affero General Public License v3.0 only. That includes the authentication service, Learn, the website application, Tracker, and the pckg registry service.

Documentation prose uses Creative Commons Attribution 4.0. Source examples and machine-readable example projects remain Apache-2.0 unless a file says otherwise. The Beskid name and visual identity are not granted as trademarks by any of those licenses.

This is one policy with deliberately different edges, not a repository-wide label pretending every component is the same kind of thing.

## Why Apache for the compiler

The compiler is infrastructure for somebody else's program. Its license should not decide the license of that program.

You can compile proprietary, permissive, copyleft, experimental, personal, or public-domain source with Beskid. The compiler does not claim the input, and invoking it does not impose AGPL on the generated program. Apache-licensed runtime, startup, core-library, template, or generated material incorporated into an output keeps its Apache terms. Third-party material keeps its own terms.

That makes the practical rule simple: programs built with Beskid remain yours to license. The toolchain stays open and reusable without turning the act of compilation into a legal trap.

## Why AGPL for services

Network software has a different failure mode. A company can take an ordinary copyleft service, modify it, run the modified version for users, and never distribute the program itself. Traditional source-distribution obligations may never begin.

AGPL addresses that network boundary. If an operator modifies an AGPL-covered Beskid service and lets users interact with that version over a network, those users must receive the source access required by section 13. Running an unchanged service is not the same as relicensing unrelated software around it, and Apache-licensed clients, protocols, libraries, and templates do not become AGPL merely because a service uses them.

The aim is narrow: improvements to the services people actually use should remain available to those people.

## Third-party code keeps its terms

Licensing cannot erase provenance. Vendored dependencies retain their original licenses and notices. Independent submodules carry their own legal files when their boundary differs from the parent repository.

Beskid Nexus is the visible exception. It derives from GitNexus, whose PolyForm Noncommercial License cannot simply be replaced with AGPL. Nexus therefore keeps that upstream license and notice. Moving it to the service policy would require upstream permission or a clean replacement of the inherited implementation. Calling it AGPL today would be simpler to describe and false in practice, so we do not do that.

## What changes for you

- If you build programs with Beskid, you choose the license for your own work.
- If you reuse compiler, runtime, tooling, client, or template code, follow Apache-2.0 and any retained third-party notices.
- If you operate a modified Beskid network service, provide the corresponding source access required by AGPL-3.0-only.
- If you reuse documentation prose, attribute it under CC-BY-4.0.
- If you redistribute a component, read the legal files at that component's boundary instead of assuming the root license tells the whole story.

The canonical details live in [`LICENSING.md`](https://github.com/Cyber-Nomad-Collective/beskid/blob/main/LICENSING.md), backed by machine-checked package metadata and license files shipped in service images.

The contract is intentionally boring: permissive tools, reciprocal services, attributed documentation, preserved upstream terms, and no claim over the programs people build.

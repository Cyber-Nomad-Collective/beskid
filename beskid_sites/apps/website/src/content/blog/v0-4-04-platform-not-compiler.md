---
title: "A Language Is Not Just a Compiler"
description: "v0.4 was the band where Beskid stopped being a compiler project and started being a platform. Auth, hosting, observability, CI, tracker. The compiler is the fun part. The infrastructure is what keeps the project alive."
date: 2026-06-08
blogStatus: released
release: v0.4
---

Most language projects never get to v0.4. They stall at the compiler, die in the standard library, or get lost in syntax bikeshedding. The ones that survive discover what v0.4 discovered: a language is not just a compiler. It is infrastructure.

v0.4 (26 May — 7 June 2026, with continuing work beyond) was the band where Beskid stopped being a compiler project and started being a platform. The compiler got better in v0.4 — it always does. But the defining work of the band was the scaffolding around the compiler: auth, hosting, observability, CI that does not lie, and a tracker that knows what "done" means.

## The graveyard of v0.3

Look at the language projects that made it to "v0.3" and stopped. Not the ones that never started — the ones that had a working parser, a basic type checker, maybe a codegen backend, and then… nothing. The repo goes quiet. The last commit is "update README." The blog hasn't been updated since the "Hello World" post.

What killed them? Rarely the compiler. Usually the everything-else. The contributor who wanted to add a feature but couldn't figure out how to build the project. The user who hit a bug but couldn't file it because there was no issue tracker, or there was an issue tracker but nobody was triaging it. The potential sponsor who looked at the project and saw a compiler with no package manager, no CI badges, no documentation, no way to tell if it worked.

A compiler is a necessary condition for a language. It is not sufficient. The compiler is the fun part — the algorithm, the type theory, the optimization passes. The infrastructure is the part that keeps the project alive when the fun part gets hard.

## The parallel work pattern

The commit log from June 2026 is a blur of CI fixes, Docker builds, submodule bumps, and "further work on compiler." The pattern is unmistakable: infrastructure work and compiler work happening in parallel, each bumping the other, neither waiting for the other to be "done."

This is not how most language projects work. Most treat infrastructure as a problem for "later" — after the type system is done, after the standard library ships, after someone asks "how do I install this?" The answer is usually a shell script, a Makefile target, a Docker image that worked on the author's machine last Tuesday.

Beskid v0.4 treated infrastructure as a first-class deliverable. Not because it is fun — it is not. Because a language without tooling is a hobby project, and hobby projects do not ship. The six weeks of v0.4 produced auth, a tracker, an observability stack, and a shared component library — none of which make the compiler faster, all of which make the project survivable.

## What v0.4 shipped

**Auth hub.** OAuth flows, session management, webhook validation, all in `beskid_web_common`. Build auth once, correctly, or debug it forever across every service. The auth hub is not glamorous. It is the kind of decision that saves years of duplicated bugs — and the kind of decision that is invisible when it works.

**Tracker as SQLite source of truth.** The tracker had been running alongside Beskid since the Pecan era, but v0.4 made it the authority. GitHub Issues is a mirror — scoped to active version and bugs only. If you want to know what shipped, you query the SQLite database. Not a project board. Not a spreadsheet. Not Slack.

**Nexus graph explorer.** One interactive graph widget — ReactFlow and d3, built in `beskid_web_common` — used across the website, package registry, platform spec, and tracker. Compiler architecture, execution flows, spec contracts, all navigable through the same interaction model. Build the primitive once; every surface benefits.

**Grafana and Memgraph.** CI pipeline health, compiler benchmark trends, service uptime, all monitored at monitor.beskid-lang.org. Memgraph backs the graph queries that time-series databases can't handle. The kind of setup you configure once, forget about, and only remember exists when it pages you at 2 AM — which is exactly when you need it.

**Kanban UX.** Structural tabs, settings shell with left nav tree, task dialogs at 70% form and 30% preview. The kind of UI work that takes weeks and looks like it took hours. Every task dialog is the database schema rendered as input elements. Nothing drifts.

## The compiler is the fun part

Read [Why are we making this so hard?](/book/00-why-beskid-exists/why-are-we-making-this-so-hard/) in the Book. Most enterprise software is business records with lipstick. The hard part is rarely algorithms — it is permissions nobody documented, state machines spread across three handlers, and reports that must match finance's spreadsheet.

v0.4 is Beskid admitting that same truth about itself. The compiler is the fun part: parsing, type checking, code generation, optimization passes. The infrastructure — auth flows, session stores, dashboard queries, CI gates, tracker schemas — is the part that keeps the project alive when the fun part gets hard. It is the difference between a language that ships and a compiler that rots in a git repository.

## The runtime shift brewing underneath

While v0.4 was shipping infrastructure, something else was happening in the compiler. The runtime bridge — the Rust-based handlers for language-owned dispatch ops — was showing its limits. 34 frozen kernel exports. 77 soft dispatch ops. A registration chain that touched every crate from `beskid_manifest` to `beskid_codegen`. The gap between what the spec said and what the runtime did was widening, and CI could not catch it because CI only checked that tests passed — not that the tests tested the right thing.

The design proposal that would become the ISLE-native runtime migration was being drafted. The shift from "Rust handlers for everything" to "stock Cranelift CLIF for primitive handlers, ISLE for the bridge" was not an infrastructure problem. But it would not have been possible without the infrastructure v0.4 built.

Green CI gates on every compiler bump meant the team could refactor the runtime without fear of silent breakage. Verifiable contracts in the platform spec meant the team could define what "correct" meant before they wrote the code. A tracker that knew exactly what was Done and what was Not Yet meant the team could scope the migration honestly — here is what we are porting, here is what we are not porting, here is the cutoff.

Infrastructure does not make the compiler faster. It makes the project survivable. When the runtime migration came, the team knew what was in scope, what was verified, and what was missing — because the tracker said so, the CI gate said so, and the spec contracts said so. That is not glamorous. It is necessary.

## What is still in progress

The tracker currently records 36 Done, 11 In Progress, and 5 Backlog tasks. The distinction matters: "36 Done" is not a v0.4 closure claim. It is a snapshot. Remaining work includes production OAuth validation, production nexus smoke coverage, release verification, parts of the corelib matrix, package publishing, and editor integration.

Read the Book chapter [Tooling and editors](/book/06-tooling-and-editors/) for the editor integration story. Some of this will land in v0.4. Some will slide to v0.5. The blog will update as the band changes — but it will never pretend the work is done when it is not. That would violate the entire point of the tracker.

Next: [The ISLE-Native Runtime Migration — Why We Changed Our Mind About the Runtime](/blog/isle-native-runtime-migration/)

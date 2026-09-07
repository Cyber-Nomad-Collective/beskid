---
title: "Why Beskid: Mountains, Icebergs, and Medium-Tier Languages"
description: "Not an acronym. Not a myth. A mountain range in the Carpathians — and a metaphor for the language tier that Java, C#, and Ruby occupy. Why the rename from Pecan mattered."
date: 2026-03-01
blogStatus: released
release: v0.0
---

On 26 February 2026, a single commit renamed the project: "Rename project from Pecan to Beskid across all documentation and workspace configuration." It touched forty-three files. The diff was unremarkable. The decision behind it was not.

## Why Pecan had to go

Pecan was a working name — chosen in the first week for the same reason every working name gets chosen: it was available, it was pronounceable, and nobody hated it enough to veto it. It was a nut. Small, dense, slightly unhinged. For a prototype, that worked.

But prototypes end. Languages ship. And the name Pecan carried baggage we had not anticipated. In American English, "pecan" is a pie filling. In the search results, it competes with recipes, orchards, and a Georgia farming cooperative that has been online since 1998. It does not compete well. More importantly, it said nothing about what the language *was*. A nut is a thing you consume and discard. A language is a thing you inhabit.

There was also the acronym problem. Programming language names that are not acronyms are rare, and the ones that *are* acronyms are mostly regrettable. PHP, GNU, PERL, LISP, BASIC — each one a hostage to a phrase that stopped being accurate two decades ago. We did not want to join that tradition. We wanted a name that meant what it was, not what it stood for.

## The Beskid mountains

The Beskids are a mountain range in the Carpathians, stretching across the Czech Republic, Slovakia, Poland, and Ukraine. They are not the Alps. They are not the Himalayas. They are *medium-sized mountains* — the kind people live in, not just photograph. The highest peak, Babia Góra, rises to 1,725 meters. It is not going to kill you. It is going to make you work.

This is the metaphor. Programming languages have tiers. At the summit you find the systems languages: C, C++, Rust, Zig — close to the metal, unforgiving, prestigious. At the base you find the scripting languages: Python, JavaScript, Lua — accessible, productive, permissive. The Beskids are the middle: Java, C#, Go, Ruby, Kotlin, Swift. Languages that are not the fastest or the easiest or the most elegant, but are the ones that *most software is written in*. The medium tier. The inhabited tier.

Beskid aspires to this tier. It does not want to dethrone Rust. It does not want to replace Python. It wants to be the language you reach for when you need a compiler that understands your domain, a type system that catches the mistakes that matter, and a toolchain that does not require a research group to operate. The mountain range is the metaphor: substantial, layered, lived-in, and not pretending to be something it isn't.

## The iceberg and the mountain

There is a programming language iceberg meme. Above the water: syntax, standard library, package manager. Below the water: type system, memory model, concurrency story, tooling ecosystem, compiler performance, error messages, documentation culture, community norms, backward compatibility guarantees, governance model. The visible part is the part everyone argues about. The invisible part is the part that determines whether the language survives.

Choosing Beskid was a commitment to the invisible part. The name does not reference syntax. It does not reference a feature. It references *place* — a location in the landscape that people understand when they see it on a map. You do not need to know the Beskids to understand that Beskid is a language that knows where it stands.

## Regional names vs. mythological names

There is a lineage of programming languages named after mythology: Python, Delphi, Oracle, Valhalla (the JVM project). These names borrow cultural gravity from stories that predate computing. They are evocative but ambiguous — Python the language and Python the snake and Python the oracle of Delphi occupy the same search results, and only context distinguishes them.

There is a smaller lineage of languages named after places: Java (the island), Kotlin (the island near St. Petersburg), Lombok (the Indonesian island). These names ground themselves in geography rather than mythology. Beskid follows this tradition. The Beskids are real. You can visit them. They have trails, shelters, weather stations, a history. The name carries the texture of an actual place rather than the abstraction of a myth.

This matters because languages are not myths. They are tools that people use to build things that other people depend on. A name that references a real place — modest, layered, inhabited — says something honest about the ambition.

## What's in the name?

Read [What's in the name?](/book/00-why-beskid-exists/whats-in-the-name/) in the Book for the extended meditation on the Beskid metaphor and the project's relationship to ambition.

The rename was not a branding exercise. It was the moment the prototype became a project. Pecan was a nut you could throw away. Beskid is a mountain range you have to climb.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.0/version.json) &mdash; [rename commit](https://github.com/Cyber-Nomad-Collective/beskid/commit/3c82da5)

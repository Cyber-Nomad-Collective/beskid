---
specLevel: domain
title: Language Semantics — {Subdomain}
owner:
  name: Language specification team
  email: language-spec@beskid-lang.org
submitter:
  name: Language specification team
  email: language-spec@beskid-lang.org
---

## Overview
This area of the language semantics domain defines the rules and constraints that govern how Beskid programs behave within this {subdomain}.

## Scope
Describe what syntax forms, type rules, evaluation semantics, and cross-cutting concerns apply. Note any interactions with other semantic domains (e.g., memory model, concurrency).

## Syntax conventions
Where this domain introduces new syntax forms, specify them with concrete grammar excerpts from `beskid.pest`. Link to the relevant compiler front-end contract for parser implementation details.

## Semantic invariants
List the invariants that must hold across all features within this domain. These form the contract that downstream features and implementations must satisfy.

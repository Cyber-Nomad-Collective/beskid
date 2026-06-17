---
specLevel: area
title: '{Area} — Compiler Pipeline'
owner:
  name: Compiler implementation team
  email: compiler-team@beskid-lang.org
submitter:
  name: Compiler implementation team
  email: compiler-team@beskid-lang.org
---

## Overview
This area groups compiler features related to {area}. Each feature hub below defines the specific contracts, data structures, and processing semantics for its scope.

## Contract boundaries
Each feature in this area defines a contract boundary between compiler passes or between the compiler and external consumers (LSP, runtime, build tools). Specify:
- The data structures that cross the boundary
- Invariants that must hold at the boundary
- Error conditions and how they are reported

## Cross-cutting concerns
Note architectural constraints that affect all features in this area (e.g., single-prepare spine, incremental scheduling, or diagnostic collection).

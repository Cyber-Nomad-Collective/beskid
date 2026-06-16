---
title: Compiler Mod SDK - FAQ and troubleshooting
description: Common issues, troubleshooting, and locked decisions for the Beskid
  Compiler Mod SDK.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Proposed
lastReviewed: 2026-06-05
---

## FAQ

### How do I register a mod entrypoint?

You do not. Discovery is artifact-driven. Implement a public Beskid type that implements an SDK contract.

### Can a mod define language macros?

Yes. Mods may define `pub macro` items like any library. They are expanded by the compiler, not by the mod host.

### Can mods mutate the host program arbitrarily?

No. Mods emit typed AST contributions through `Generator` contracts. The host validates and merges them.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| **E1829** | Two mods export conflicting contracts |
| **E1884** | Mod referencing stale syntax generation |
| **E1883** | Multiple mods modifying the same nodes |
| Mod not discovered | Missing AOT artifact or descriptor |

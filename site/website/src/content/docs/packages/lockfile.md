---
title: "Lockfile"
description: "Project.lock semantics for deterministic package restore."
---

## Role

`Project.lock` records fully resolved dependency state so installs are reproducible across machines and CI.

## Modes

- default: resolve and update lock when needed.
- `--locked`: fail if lock is missing or out of date.
- `--frozen`: fail on any lock mutation.

## Required lock fields per dependency

- `name`
- `version`
- `source`
- `registry` (for registry deps)
- `artifactDigest`
- `descriptor` (URL/path/rev as applicable)

## Guarantees

- Same lock + same registry artifacts => same resolved graph.
- Digest mismatch on download/install is a hard failure.

## Update policy

- `pkg add/remove` updates manifest intent.
- `pkg install/update/lock` reconciles actual lock state.
- Lock entries are sorted for stable diffs.

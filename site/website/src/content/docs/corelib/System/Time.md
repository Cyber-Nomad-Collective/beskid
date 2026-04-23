---
title: "System.Time"
---


## Purpose
Time and duration primitives with explicit monotonic/wall-clock contracts.

## Candidate surface
- `Time.NowUtc() -> Instant`
- `Time.MonotonicNow() -> Instant`
- `Duration.FromMilliseconds(i64 ms) -> Duration`

## Notes
- Distinguish monotonic and wall clock behavior.
- Runtime provides platform clock integrations.

## 1. Spec
- [x] 1.1 Write the memory-model delta and record the ruling in `design.md`.
## 2. Implementation
- [x] 2.1 ISLE: the first growth through the caller's handle of a `mut T[]` parameter copies (slice arrgrow).
- [x] 2.2 `dead_collection_growth`: local reads through canonical array functions; `p = Array.Append<T>(p, v);`; E1259 coordination.
- [ ] 2.3 Check Corelib and every `corelib_tests` target under the rule (slice arrgrow gate).

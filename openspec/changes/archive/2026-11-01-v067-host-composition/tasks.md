## 1. Spec
- [x] 1.1 Write the composition, registry and console hosting deltas.
- [ ] 1.2 Compare with the final host slice wording (aligned with slice host).

## 2. Implementation
- [x] 2.1 Hook order, E1705, E1713, E1717–E1721 (slice host).
- [x] 2.2 Cross-unit base hosts, `ConsoleHost`.
- [x] 2.4 `CommandLine.Exit` runs dispose hooks through the host (slice host).
- [x] 2.3 Type-check `launch` and `with` arguments and expose host and scope parameters in hooks (open gap in slice host).

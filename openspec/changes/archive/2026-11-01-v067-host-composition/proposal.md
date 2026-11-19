## Why

Host hooks (`startup`, `init`, `dispose`) never ran in 0.6.6. Composition mistakes surfaced as internal errors or unclear messages. The standard names a built-in `ConsoleHost` base in Corelib, but none shipped. Evidence: slice host of the 0.6.7 program (`v067-host-progress.md`).

## What Changes

- Hook order is specified and implemented: `startup` after `launch`, scope `init` after `with` enters, `dispose` on every exit, global `dispose` before shutdown.
- E1705 (singular `inject` with several registrations) offers the fix `inject T[]`. E1713 names the contract. New codes E1717–E1721.
- Base hosts may come from any unit of the assembly. Keys compare by full declaration identity.
- Corelib ships `Console.Hosting.ConsoleHost` with `CommandLine`.
- `launch` and `with` arguments are checked against host and scope parameters (type mismatch at the argument, count errors E1722 and E1708), and the parameters are visible in hooks. Parameters on a base host are E1723.

## Capabilities

### Modified Capabilities
- `language-meta--composition--dependency-injection`, `compiler--semantic-pipeline--diagnostic-code-registry`.

### New Capabilities
- `core-library--terminal-and-console--console-hosting`.

## Impact

`beskid_analysis` composition and hooks lowering, `beskid_queries` reachability, codegen composition facts, Corelib `Console.Hosting`. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. Programs that register a contract as itself, register a type the container cannot create, or place `startup` in a named scope are rejected. There is no compatibility path.

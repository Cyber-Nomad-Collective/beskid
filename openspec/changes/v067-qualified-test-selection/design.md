# Design: qualified test selection (0.6.7)

## Identity

`test_item_tracked` already computes the qualified name from the enclosing `InlineModule` nodes. The new tracked query `item_qualified_name` computes the same name for functions, methods and tests, from one shared helper, so discovery and selection cannot disagree.

## Selection

`resolve_entry_item(db, roots, selection, accepts)` walks each root in order. An item matches when its kind is accepted, its declared name equals the last segment, and its qualified name equals the selection. The first root with a match decides. Zero matches in every root is `Missing`; two matches in one root is `Ambiguous`. Codegen maps both to a build error, so a test is never run by a silent first pick. The semantic gate rejects two tests of one name in one module, so `Ambiguous` is reachable only when the gate is bypassed.

## Duplicate rule

The staged rule checked test names over the whole file. It now checks them per module scope, as the resolver already did (`(module, name)` table).

## Release tooling

`findBeskidDeclaration` tracks inline module nesting over braces outside comments and string or character literals and binds a `test <name>` line (indentation allowed) whose module chain equals the id's prefix. Root-level ids bind as before, and the frozen manifest is byte-identical.

## DNS

`assembly/common/network_dns.h` classifies `getaddrinfo` failures with no runtime dependency, so a host fixture checks it. glibc declares `EAI_NODATA` and `EAI_ADDRFAMILY` only under `_GNU_SOURCE`; the Linux runtime uses their fixed values. Windows also reports `WSANO_DATA`.

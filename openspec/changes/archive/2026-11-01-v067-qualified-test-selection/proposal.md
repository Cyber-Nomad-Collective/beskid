## Why

`beskid test` reports a test inside `mod Topic { test Inner { } }` as `Topic::Inner`, but the native test build looks up the bare name and fails with E4041 "Missing test `Topic::Inner`". The `v067-test-namespace` change keys tests by module and name, yet `beskid check` still rejected two same-named tests in different inline modules (E1006). The release case tooling binds only unqualified test identifiers at column 0. Separately, a resolver answer "name exists, no address records" (`EAI_NODATA`) became `NetworkDown` instead of `HostNotFound`.

## What Changes

- A test is identified by its unit-relative qualified name: the enclosing inline module names, outermost first, and the test name, joined by `::`.
- Discovery, the `beskid test` report and native test selection use that one identity. A selection that names no test, or more than one, fails closed.
- Same-named tests in different inline modules are distinct tests; only two tests of one name in one module collide.
- A function entry selection (`Main`) uses the same qualified-name resolution, so a bare name selects an item at the unit root only.
- Name resolution maps every "no usable address" resolver answer to `HostNotFound`: unknown name, a name without address records, and a name without an address of the requested family.

## Capabilities

### Modified Capabilities
- `language-meta--contracts-and-effects--testing`, `core-library--networking--network-dns`.

## Impact

Query layer (`resolve_entry_item`, `item_qualified_name`), codegen entry selection, the staged duplicate-name rule, the engine REPL entry lookup, the native runtime resolver error map, and the release case declaration finder (`scripts/ci/release-case-common.mjs`). The VS Code extension reads `qualified_name` from `beskid test --json` already and needs no change. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. A bare entry name no longer selects a same-named item inside an inline module. There is no compatibility path.

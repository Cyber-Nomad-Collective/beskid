## Why

Four places in the standard still describe the 0.6.0 scheduler. They say that parallel execution is not implemented and is planned in the changes `v061` to `v065`, and that the scheduler size follows a GOMAXPROCS setting. Release 0.6.7 ships parallel execution on isolates. The `api-json-contract` capability also says in one place that `location.file` is relative to the package source root, and in two places that it is relative to the artifact root. The code (`relativize_api_doc_paths`) writes artifact-relative paths.

## What Changes

- The M:N scheduler requirement and the Phase A requirement (D-EXEC-RT-0001, D-EXEC-RT-0003) state that the scheduler belongs to an isolate and that parallel execution runs on isolates through `Core.Parallel`.
- The Phase A ship-order requirement (D-EXEC-RT-0005) drops the planned-in-v061-to-v065 text.
- The scheduler defaults requirement (D-CORE-CONC-0008) states `ProcessorCount()` is 1, `HostProcessorCount()` reports the host, and `SetProcessorCount` does nothing.
- A new requirement in `api-json-contract` states that all packed paths are artifact-relative.
- The informative "Processor count" section and the informative multi-file row in the same capabilities are corrected in the same change set.

No observable behavior changes. The text now matches the shipped behavior.

## Capabilities

### Modified Capabilities
- `execution--runtime--fiber-scheduler-and-stacks`
- `execution--runtime--memory-and-gc-runtime-contract`
- `core-library--concurrency--concurrency-package`

### New Requirements
- `tooling--cli--api-json-contract`

## Impact

Specification text only. Target release: 0.6.7 release candidate 3.

## Compatibility, Migration and Reversion

No users exist and no behavior changes. Reversion: restore the previous text.

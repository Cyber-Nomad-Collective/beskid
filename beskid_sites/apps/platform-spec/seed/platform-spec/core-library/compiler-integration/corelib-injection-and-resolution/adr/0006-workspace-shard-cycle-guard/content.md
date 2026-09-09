import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Shards under `packages/*` would create cycles if they gained implicit host edges.

## Decision

| Rule | Detail |
| --- | --- |
| Guard | `is_corelib_workspace_shard_manifest` skips implicit back-edge |
| Host | Only application hosts receive implicit corelib |

## Consequences

Building `packages/runtime` alone does not pull beskid_corelib as a hidden parent.

## Verification anchors

`resolver.rs`; corelib workspace compile tests.

import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Legacy `rt_now_millis` and scattered clock builtins confuse package boundaries.

## Decision

`` `Concurrency.NowMillis() -> i64` `` in concurrency package replaces legacy `rt_now_millis`. Wall clock deferred to future `Core.Time`.

## Consequences

Wall-clock ADR required before exposing civil time in corelib.

## Verification anchors

Builtin spec table; corelib clock smoke tests.

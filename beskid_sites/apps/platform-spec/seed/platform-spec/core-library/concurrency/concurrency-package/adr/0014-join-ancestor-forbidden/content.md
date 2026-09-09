import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Parent/child Join cycles deadlock the scheduler.

## Decision

Child **Join** parent → compile-time diagnostic **JoinWouldDeadlock**. Parent **Join** child and sibling **Join** remain allowed.

## Consequences

Diagnostic registry documents **JoinWouldDeadlock**.

## Verification anchors

Semantic analyzer tests for join graph.

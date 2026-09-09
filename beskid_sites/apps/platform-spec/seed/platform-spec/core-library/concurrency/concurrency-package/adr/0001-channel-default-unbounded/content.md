import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Authors need predictable queue semantics without implicit blocking on the default channel.

## Decision

| Rule | Detail |
| --- | --- |
| Default | **Unbounded** when `ChannelOptions` is omitted or no bounded capacity is set |
| Bounded | `ChannelOptions.Bounded(n)` with `` `n > 0` `` |
| Unbounded | `ChannelOptions.Unbounded` (equivalent to default) |
| Factory | `` `Channel<T>.Create(options: ChannelOptions = default)` `` |

## Consequences

Documentation **must** warn about memory growth on unbounded channels. Bounded queues park senders when full.

## Verification anchors

Corelib concurrency tests; runtime channel builtins.

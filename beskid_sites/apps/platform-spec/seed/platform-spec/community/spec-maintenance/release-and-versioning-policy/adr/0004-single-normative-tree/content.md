import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Parallel **non-normative** legacy trees (`/execution/`, `/corelib/`, Starlight guides) were cited as law alongside platform-spec.

## Decision

The [Platform specification](/platform-spec/) domain is the **one** normative documentation tree for language and platform contracts. Legacy trees are **non-normative** only: informative [`/execution/`](/execution/) and [`/corelib/`](/corelib/) Starlight paths, plus book and guides, unless explicitly bridged per [Non-normative bridge docs policy](/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/).

## Consequences

Public site exposes **Platform specification** and **Book** only; bridge pages link canonical destinations.

## Verification anchors

[Legacy spec mapping](/platform-spec/legacy-spec-mapping/); `PSC005` stale legacy bridge checks.

import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Libraries ship reusable composition roots; executables pick one entry host per run.

## Decision

Projects **may** declare many named **`host`** types. Each process run **must** use exactly one **`launch Host(args)`** on an executable target (**E1702** for duplicate launch on one path).

## Consequences

Manifest **`app`** targets name the launched host; multi-app repos use separate targets, one launch each run.

## Verification anchors

[Contracts and edge cases](/platform-spec/language-meta/composition/dependency-injection/contracts-and-edge-cases/); [Project manifest](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/).

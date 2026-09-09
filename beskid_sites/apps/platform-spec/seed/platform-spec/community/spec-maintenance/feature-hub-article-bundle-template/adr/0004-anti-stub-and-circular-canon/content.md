import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

**Standard** pages passed review with self-referential stubs or article bundles that only pointed at the parent hub.

## Decision

On **Standard** pages the following are **forbidden**: (1) **circular canon** — body that cites the same URL as sole authority without substantive MUST/SHOULD/MAY prose; (2) **placeholder-only articles** — siblings that are scaffold-only; (3) **hub-only authority** — articles that repeat the hub contract without role-specific detail.

## Consequences

`PSC001`/`PSC002`/`PSC007` fail or warn in CI; pages that cannot meet minimums **must** use `status: Proposed`.

## Verification anchors

`verify:platform-spec-content --strict`; `LANGUAGE_META_CIRCULAR_CANON_ALLOWLIST`.

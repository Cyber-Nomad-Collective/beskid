---
title: "Git as version axis"
description: Platform-spec is versioned by commit—not by version segments in URLs.
tableOfContents: true
---

There is no `/platform-spec/v0.2/...` tree. The contract at commit **`abc123`** is whatever normative text and metadata exist at **`abc123`**.

Policy: [Release and versioning policy](/platform-spec/community/spec-maintenance/release-and-versioning-policy/).

## Stable URLs, moving prose

- Paths like `/platform-spec/language-meta/contracts-and-effects/contracts/` stay stable across releases.
- Behavioral change edits the page body, `lastReviewed`, ADR status, and embedded decisions—not the URL.

## Rolling integration

`main` (or your integration branch) is the usual rolling axis for:

- Public docs site builds
- CLI `cli-latest` rolling releases ([Downloads](/downloads/))
- Spec freshness via `lastReviewed` ([Last reviewed policy](/platform-spec/community/spec-maintenance/last-reviewed-policy/))

## Single normative entry

[/platform-spec/](/platform-spec/) is the **one** normative documentation tree. Legacy trees remain bridges, not parallel law ([Non-normative bridge docs](/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/)).

## Next

[ADRs and decisions](/book/12-the-normative-bible/adrs-and-decisions/)

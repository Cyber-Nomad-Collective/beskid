---
title: Package Review
description: Moderation flow for submissions and updates.
---

## Workflow states

A practical queue state machine:

1. **Pending** — automated checks running.
2. **Ready** — automated checks passed, waiting reviewer.
3. **Waiting** — maintainer action required.
4. **Updated** — maintainer pushed a new revision, queued at top.
5. **Approved** — publication/release allowed.
6. **Rejected** — blocked, requires a new submission.

## Reviewer actions

- Approve.
- Request changes with explicit remediation notes.
- Reject with policy rationale.
- Escalate to security review for high-risk packages.

## Guardrails

- Surface why a package entered `Waiting`.
- Preserve full decision history for auditability.
- Prioritize queue ordering for security-sensitive packages.

---
title: "Auth Hub: Build It Once, Correctly, or Debug It Forever"
description: "Every Beskid service needs to know who you are. v0.4 shipped OAuth flows, session management, and webhook validation in a shared package — the kind of decision that saves years of duplicated auth bugs."
date: 2026-05-28
blogStatus: released
release: v0.4
---

Auth is not a feature. It is a tax every service pays, and most projects pay it badly.

Every Beskid surface — the package registry, the tracker, the spec site, the monitor dashboard — needs to know who you are. If each service builds its own OAuth flow, its own session store, its own webhook validation, the result is predictable: twelve subtly different implementations, one breach vector per service, and a token leak that takes three weeks to trace because nobody knows which version of the session middleware is running where.

I have seen this play out in enterprise codebases. The `/oauth/callback` endpoint copy-pasted between the billing service and the admin panel, subtly diverging with each "quick fix." The session format that drifted because one team added a `role` field and the other team didn't know. The webhook secret that was configured in staging but not production, so webhooks silently failed for six months. These are not hypotheticals. They are the scar tissue every large codebase accumulates when auth is treated as a per-service concern.

v0.4 shipped the auth hub in `beskid_web_common` to make sure Beskid never learns that lesson the hard way.

## What the auth hub handles

The shared auth package covers three concerns that every Beskid service needs, and covers them once:

**OAuth flows.** GitHub OAuth for now — the project lives on GitHub, the contributors are on GitHub, the OAuth flow starts there. But the package abstracts the provider interface behind a Rust trait. The trait defines `authorize_url`, `exchange_code`, `refresh_token`, and `user_info`. Implementing a new provider means implementing those four methods. Adding GitLab, adding email/password, adding WebAuthn — none of that means touching service code. It means writing a provider impl and registering it. The rest of the platform gets it for free.

This is not hypothetical abstraction for abstraction's sake. Beskid will need more than GitHub auth. The package registry will need scoped tokens for `beskid publish`. The CI orchestrator will need machine accounts. The monitor dashboard will need read-only viewer access. Each of those is a different auth concern that should not require rebuilding the OAuth flow from scratch.

**Session management.** Signed, server-verified sessions with a shared cookie domain across all Beskid surfaces. Log in once on the spec site, you are logged in on the tracker, the package registry, and the monitor dashboard. The session store is shared. The invalidation path is shared — revoke a session in one service, it is revoked everywhere. The audit trail is shared — every login, every logout, every session expiration is recorded in one place.

**Webhook validation.** GitHub webhooks arrive with an HMAC-SHA256 signature in the `X-Hub-Signature-256` header. You must verify that signature before trusting the payload — otherwise anyone can POST a fake `issues` event and your tracker will sync phantom data. Every service that receives webhooks — the tracker for issue sync, the CI orchestrator for push events — needs that verification step. It lives in the auth hub. One function: `verify_webhook_signature(payload, signature, secret)`. One test suite that covers timing attacks, malformed signatures, and missing headers. Every service that handles webhooks gets it for free.

## The shared-package architecture

`beskid_web_common` is not a microservice. It is not a sidecar. It is a Rust crate that every Beskid web surface depends on at compile time. No network hop to validate a session. No auth proxy to maintain. No "auth service" that becomes a single point of failure for the entire platform. Just a library that ships with the binary.

The tradeoff is real: every service recompiles when the auth crate changes. If you change the session cookie format, you rebuild every web surface. The win is also real: every service gets every auth fix, every security patch, every new provider, automatically — at the type level. Not through a config file someone forgot to update. Not through a Docker image someone forgot to bump. The compiler enforces that all surfaces are using the same auth code.

## Why this matters

Read [Why are we making this so hard?](/book/00-why-beskid-exists/why-are-we-making-this-so-hard/) in the Book. The hard part of enterprise software is rarely algorithms. It is permissions nobody documented, state machines spread across three handlers, and reports that must match finance's spreadsheet.

Auth is the canonical example. It touches every service, every request, every audit log. It is the one concern where "good enough" is never good enough — the gap between "good enough" and "correct" is the gap between a working system and a breach notice. Building auth once, correctly, in a shared package, is the kind of decision that saves years of duplicated bugs. But it is also the kind of decision that is invisible when it works. Nobody celebrates the absence of a token leak. The reward for getting auth right is that nothing interesting happens.

## The enterprise comparison

I once audited a company with twelve microservices, each with its own JWT validation logic. Same algorithm — HMAC-SHA256 — implemented twelve different ways. Three of them didn't check the `exp` claim. Two of them accepted tokens signed with `none` algorithm. One of them cached the verification result but never invalidated the cache, so revoked tokens were still accepted for fifteen minutes. The audit took three weeks. The fix took three months — because each service had to be patched, tested, and deployed independently.

Beskid's auth hub makes that impossible. Not because the team is smarter. Because the architecture makes it impossible to have twelve different auth implementations. There is one implementation. It is correct, or it is fixed once.

## The Beskid pattern: build the primitive, not the product

The auth hub follows the same pattern as every other v0.4 platform service: build the shared primitive in `beskid_web_common`, let each surface consume it, and never let a surface build its own version of the same thing.

This is the same pattern that produced Nexus — one graph explorer widget used by four surfaces. The same pattern that produced the spec site — one trudoc pipeline generating documentation from one platform spec YAML. The pattern is not "build a service." The pattern is "build a primitive, share it at compile time, and let the type system enforce consistency."

Auth is the hardest primitive to get right because its failure mode is not a crash — it is a breach. A graph explorer that renders wrong is a bug you see. An auth hub that validates tokens incorrectly is a vulnerability you don't see until someone exploits it. That asymmetry — invisible failure, catastrophic consequence — is why auth must be built once and never forked.

## What is still in progress

Production OAuth validation is not fully smoke-covered. The provider abstraction has one implementation — GitHub — and abstractions with one implementation are not abstractions, they are indirection. The session store is not yet distributed — fine for a single-node deployment, not fine for horizontal scaling. The webhook validation doesn't yet cover non-GitHub webhook sources.

These are tracked in the tracker, not hand-waved away. The auth hub will grow as the platform grows, but it will never be copy-pasted. That is the promise.

Next: [SQLite Is the Source of Truth. GitHub Issues Is the Mirror.](/blog/v0-4-02-tracker-sqlite/)

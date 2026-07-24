---
title: "Draft Contexts: How the Platform Spec Accepts Edits Without Letting Broken Specs Reach Production"
description: "The Beskid platform spec has draft contexts — a staging area for spec changes that must pass validation before they go live. Community members can propose changes via PR. The git-sync/pr.ts pipeline validates them. If validation fails, the spec stays frozen."
date: 2026-07-23
blogStatus: released
release: Design
---

A living specification has the same problem as a living codebase: changes must be proposed, reviewed, validated, and merged — and any one of those steps can break everything. The Beskid platform spec solves this with draft contexts. A draft context is a staging area for spec changes. It holds a proposed change until validation passes. If validation fails, the spec stays frozen. If validation passes, the context can be approved and merged. The spec never moves without proof that the move is safe.

The commits tell the architecture: `3b260654` (draft contexts), `64dfe941` (ship draft contexts and Node/pnpm cutover), `529ee47e` (keep document contexts as active proposal), `d6d69081` (define document context parents), `130d5485` (add canonical document identities), `3c8d9765` (design draft contexts and pnpm cutover). Six commits, each one adding a layer to the change-management stack.

## What a draft context contains

A draft context is a structured proposal. It has a title — what this change is called. A summary — why this change exists. A base catalog revision — which version of the spec this change applies to. An author — who proposed it. And a set of proposed document changes: create operations for new spec documents, update operations for existing ones, delete operations for documents being retired.

Each operation references the canonical document identity of the target document. The identity includes the artifact kind (spec, decision, scenario), the capability it belongs to, the canonical path on disk, the public slug for URLs, the href for linking, and the parent capability if any. Commit `130d5485` added these canonical identities, and they are the linchpin of the whole system. Without them, a draft context says "change the document about fibers." With them, it says "update the spec document for capability `runtime--execution-model--fibers` at path `openspec/specs/runtime/execution-model/fibers/spec.md`." The first is a suggestion. The second is a database transaction.

## The validation pipeline

When a draft context is proposed — typically via a GitHub PR — the validation pipeline runs before the PR can be merged. The pipeline is defined in `site/platform-spec/src/server/git-sync/pr.ts`. It does not trust the proposal. It verifies it.

First: does every referenced capability exist in the current catalog? A draft context that references `runtime--execution-model--fibers` must find that capability in `catalog.json`. If the capability was renamed, the context must reference the new name. No dangling references.

Second: do all requirement IDs match? If a document change adds a requirement `D-EXEC-FIBER-0004`, the validator checks that the requirement ID follows the capability's namespace convention and doesn't collide with existing requirements. Requirements are the atomic units of the spec. Collisions are spec corruption.

Third: are TBD Purpose headers resolved? A new spec document with a Purpose section that says "TBD" fails validation. The hard-fail rule applies to draft contexts exactly as it applies to the main catalog. You cannot propose a spec change that introduces an unresolved purpose. Write the purpose or keep the spec provisional.

Fourth: do cross-references resolve? A document change that links to `language--types--generics` must find that capability in the catalog. Broken cross-references in a draft context would become broken links in the live spec. The validator catches them before they go live.

If all four checks pass, the context can be approved by a moderator. If any check fails, the context is rejected with specific reasons. The PR gets a comment listing every failure. The author fixes them and pushes again. The spec never moves without proof.

## The moderator role

Draft contexts introduce a social layer on top of the technical validation. Validation proves the change is structurally sound — the references resolve, the requirements are unique, the purposes are written. A moderator approves that the change is semantically correct — the requirement means what it says, the decision is justified, the spec is improved by this change.

The moderator role exists because not everything can be validated mechanically. A requirement that says "the compiler SHALL reject programs that are bad" is structurally valid and semantically useless. A human has to catch that. The validation pipeline handles the mechanical checks so the moderator can focus on the semantic ones.

## How this connects to the catalog

The OpenSpec catalog is what draft contexts validate against. The catalog says "here is the spec at revision N." A draft context says "change these documents." The validator checks the context against the catalog. If the context passes, the catalog gets regenerated to revision N+1. The catalog is the authority. Draft contexts are the change requests. The validator is the gate between them.

Cross-reference the OpenSpec catalog post (design-03-openspec-catalog.md). The catalog post describes the immune system. Draft contexts describe the surgery. The catalog detects drift. Draft contexts introduce controlled change. The validator enforces consistency across both. One spec, one catalog, one pipeline, one gate.

A living spec needs a change-management system. Draft contexts are Beskid's answer. The spec is normative. The catalog indexes it. Draft contexts change it. The validator enforces consistency across all three. Without any one of them, the spec rots. With all three, the spec evolves — and every evolution is provably correct before it reaches production.

# Design

## Context and evidence

Compiler 95c203ff is the shipped 0.5.2 revision. Exact requested registry selection, artifact_digest, immutable materialization and ZIP hardening already exist. Unpinned unavailable resolution can return None and maintenance commands use warning policy; global refresh cannot express selective update. Current source, not the 113-commit-stale graph, establishes these facts.

## Goals and non-goals

Deliver complete create/add/use/check/build/run workflows and source-bound native evidence. Do not implement unsupported Git materialization or range solving; retain one semantic/resolution authority and one canonical dispatcher.

## Decisions

Use the shared staged resolver with a source-span preserving manifest editor and recoverable manifest/lock commit. Write and sync a recovery record before the first replacement; commands recover before reads, reject external concurrent edits, and expose success only after the pair and materialization are committed. Two independent renames alone are insufficient.

Exact add records exact intent. The registry client contract already requires semantic versions, so bare add selects the greatest non-yanked stable semantic version by semantic precedence, independent of response order, with lexical full-version tie-break for equal precedence. Stable has no prerelease component. This refines the earlier plan's conditional server-order policy using existing normative evidence; no version-range solving is introduced. Explicit update --version changes exact intent; selected or --all refresh alone does not.

Frozen combines locked and offline; locked permits network but forbids lock drift, offline requires verified cached pinned content. Ordinary commands retain pins. Child stdout remains child stdout; JSON is supported only for CLI-owned result commands, and run rejects --json.

## Contradictions resolved

The old Stable CLI command families requirement requires internals at root; replace it completely. REPL requirements name the old root invocation; move it to dev repl while retaining existing evaluator semantics. Pinned registry artifacts formerly gave bare update broad latitude; retain its entire integrity body/scenarios while replacing that sentence with explicit scope/intent authority. The lock contract formerly permitted warning-only unavailable dependencies; its entire migration/read-only requirement is replaced with strict application failure while preserving v1 migration and v2 immutability. Ordinary graph TUI exception moves to dev project graph --tui. Online template update checks remain advisory and never obstruct the bundled offline path. Informative legacy provenance is not rewritten.

## Risks and migration

Recoverability, Windows replacement semantics, Unicode span offsets, nested transitives, verified cache handling and child cancellation have explicit scenarios. Migrate editor launch arrays, template post-actions, docs/snippets, completions, CLI inventories and CI gates together. Capability negotiation fails with upgrade guidance, never retries old routes. Native runtime kits, initialized consumers and shared BSOL span editing are implementation prerequisites. Rust Glue authoring routes remain coordinated with its capability owner.

## Verification

Follow the eight task test cycles in the implementation plan, including disposable registry and fault injection. Acceptance IDs CLI06-01..06 and DEP06-01..05 bind tests and installed Linux x64/macOS arm64/Windows x64 evidence. Five fresh users verify help discovery and first workflow thresholds; snapshots alone are insufficient. No acceptance claim is made by authoring these deltas.

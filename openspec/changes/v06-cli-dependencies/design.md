# Design

## Context and evidence

Compiler 95c203ff is the shipped 0.5.2 revision. Exact requested registry selection, artifact_digest, immutable materialization and ZIP hardening already exist. Unpinned unavailable resolution can return None and maintenance commands use warning policy; global refresh cannot express selective update. Current source, not the 113-commit-stale graph, establishes these facts.

## Goals and non-goals

Deliver complete create/add/use/check/build/run workflows and source-bound native evidence. Do not implement unsupported Git materialization or range solving; retain one semantic/resolution authority and one canonical dispatcher.

## Decisions

Use the shared staged resolver with a source-span preserving manifest editor and recoverable manifest/lock commit. Write and sync a recovery record before the first replacement; commands recover before reads, reject external concurrent edits, and expose success only after the pair and materialization are committed. Two independent renames alone are insufficient.

Exact add records exact intent. The registry client contract already requires semantic versions, so bare add selects the greatest non-yanked stable semantic version by semantic precedence, independent of response order, with lexical full-version tie-break for equal precedence. Stable has no prerelease component. This refines the earlier plan's conditional server-order policy using existing normative evidence; no version-range solving is introduced. Explicit update --version changes exact intent; selected or --all refresh alone does not.

Frozen combines locked and offline; locked permits network but forbids lock drift, offline requires verified cached pinned content. Ordinary commands retain pins. Child stdout remains child stdout; JSON is supported only for CLI-owned result commands, and run rejects --json.

The CLI emits no ANSI color in 0.6.0: diagnostics render with the no-color theme and the only terminal control is the bounded TTY progress line. A `--color auto|always|never` option would select between identical outputs, so 0.6.0 offers none (coordinator ruling, 2026-10-13); a later release that introduces color adds the option together with it. `--quiet` and `--verbose` are global and process-wide: the selected verbosity sets the default log filter (`error`, the ordinary `info` filter, or `debug` for Beskid crates; an explicit `RUST_LOG` still wins) and gates the shared progress observer, test rows and command summaries, so every command honours them without per-command flags.

## Contradictions resolved

The old Stable CLI command families requirement requires internals at root; replace it completely. The replacement keeps the two base scenario names: "Required families are present" now lists the 0.6 root families (CLI06-03), and "Removed Hi command is rejected" keeps the `hi` rejection with exit status 2 (`retired root hi must not dispatch` in `beskid_cli/src/cli/tests.rs`). No base scenario is dropped. REPL requirements name the old root invocation; move it to dev repl while retaining existing evaluator semantics. Pinned registry artifacts formerly gave bare update broad latitude; retain its entire integrity body/scenarios while replacing that sentence with explicit scope/intent authority. The lock contract formerly permitted warning-only unavailable dependencies; its entire migration/read-only requirement is replaced with strict application failure while preserving v1 migration and v2 immutability. Ordinary graph TUI exception moves to dev project graph --tui. Online template update checks remain advisory and never obstruct the bundled offline path. Informative legacy provenance is not rewritten.

## Risks and migration

Recoverability, Windows replacement semantics, Unicode span offsets, nested transitives, verified cache handling and child cancellation have explicit scenarios. Migrate editor launch arrays, template post-actions, docs/snippets, completions, CLI inventories and CI gates together. Capability negotiation fails with upgrade guidance, never retries old routes. Native runtime kits, initialized consumers and shared BSOL span editing are implementation prerequisites. Rust Glue authoring routes remain coordinated with its capability owner.

## Verification

Follow the eight task test cycles in the implementation plan, including disposable registry and fault injection. Acceptance IDs CLI06-01..06 and DEP06-01..05 bind tests and installed Linux x64/macOS arm64/Windows x64 evidence. Five fresh users verify help discovery and first workflow thresholds; snapshots alone are insufficient. No acceptance claim is made by authoring these deltas.

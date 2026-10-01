# Beskid 0.5.1 First-Party Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every first-party template generates a usable Beskid project or item; executable examples build and run.

**Architecture:** Treat the published CLI and verified Corelib as the acceptance environment. Repair template source/manifest content to current language and dependency contracts, then run generated outputs through actual CLI commands. When valid source exposes a compiler failure, fix the compiler with a separate focused test rather than weakening the template gate.

**Tech Stack:** Beskid sources/manifests, Python workspace quality script, Rust CLI and compiler integration tests.

**Spec:** `docs/superpowers/specs/2026-10-01-beskid-051-cli-interaction.md`

## Global Constraints

- Base template work on `beskid_templates` `origin/main` at or after `33fce0b`; use a separate worktree/branch and preserve user changes.
- Use the compiler candidate built from `origin/main` at or after `44a07aed`, never the stale root `compiler/` checkout.
- No GitNexus; no push, merge, publication, credential access, or production registry mutation in this slice.
- Heavy tests run on NixOS builder, max four total; use isolated scratch and exact `BESKID_CORELIB_ROOT`/runtime-kit provenance.

## Review Focus

- Non-default names replace filename and content tokens consistently.
- Generated lockfiles name the final project manifest and replay after relocation.
- The console and workspace entrypoints use `i32 Main()`, not Rust syntax.
- Host and fiber examples exercise real currently available APIs, not no-op substitutes.
- A library target builds without requiring `Main`, and item templates are checked in a host context.

---

### Task 1: Template source regression gate

**Files:**
- Modify: `beskid_templates/ci/quality.py`
- Test: add focused quality tests under `beskid_templates/ci/` or the existing test location
- Modify: release packaging gate that invokes template quality only if it presently omits the gate

**Interfaces:**
- Consumes: seven first-party template roots and the candidate `beskid` CLI.
- Produces: deterministic per-template results for generated paths, analysis, build, and run where applicable.

- [ ] **Step 1: Add failing checks** that instantiate all templates with non-default names, reject unresolved path/content tokens, and verify emitted manifest/lock ownership. For app/host/fiber/workspace, call `beskid build` then `beskid run` with bounded timeouts; for lib, build as library; for item, analyze inside a host project.
- [ ] **Step 2: Capture RED** against the current 0.5.0 CLI/templates and record the exact category for each failure (generation, parser, semantic analysis, lowering, linker, runtime).
- [ ] **Step 3: Integrate the quality gate into release preflight**, failing closed before packages are uploaded. Verify the check itself detects an intentionally invalid `.bd` fixture.
- [ ] **Step 4: Run the focused quality suite and commit** the gate separately from source repairs.

### Task 2: Repair executable template content

**Files:**
- Modify: `beskid_templates/packages/console/content/Src/Main.bd`
- Modify: `beskid_templates/packages/workspace-demo/workspace/app/Src/Main.bd`
- Modify: `beskid_templates/packages/host/content/Src/Main.bd` and/or its manifest if actual host contract requires it
- Modify: `beskid_templates/packages/fiber-demo/content/Src/Main.bd` and/or its manifest if the actual Corelib module contract requires it
- Test: Task 1 generated-output gate

**Interfaces:**
- Consumes: current language grammar, verified Corelib APIs, and CLI target semantics.
- Produces: four executable generated outputs that compile and terminate successfully.

- [ ] **Step 1: Fix one failing template at a time** after its gate is RED, starting with console/workspace `i32 Main()`. Keep host/fiber instructional intent; use a real compilable host composition and fiber join.
- [ ] **Step 2: Run each template's generated-project analysis, build, and run to GREEN** on Linux; record exact commands and exit statuses.
- [ ] **Step 3: Check templates' README and package metadata** against what the generated project actually does, then commit source repairs.

### Task 3: Library and cross-platform contract

**Files:**
- Modify: `beskid_templates/packages/lib/content/` only if its source/manifest violates the documented library contract
- Modify: compiler library target implementation/tests only if a valid `kind = Lib` target still requires `Main`
- Test: Task 1 library gate and native generated-template smoke

**Interfaces:**
- Consumes: `kind = Lib` manifest and candidate compiler.
- Produces: a library artifact without an application entrypoint, plus Linux/macOS/Windows template smoke evidence.

- [ ] **Step 1: Establish expected library output** from current CLI/spec; write a failing compiler test if `Missing entrypoint Main` is a compiler defect.
- [ ] **Step 2: Fix the authoritative cause** and run focused suite RED→GREEN; do not add fake `Main` to a library merely to satisfy an application build path.
- [ ] **Step 3: Run representative generated-output build/run on all three native platforms** and commit the final gate/repair.

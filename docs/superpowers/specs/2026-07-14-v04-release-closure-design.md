# v0.4 Release Closure Design

## Goal

Ship Beskid v0.4 only after the existing v0.4 deliverables have reproducible local/CI evidence, the published artifacts are retry-safe, and the required production checks have named operator evidence.

## Scope and authority

The release scope is the existing Tracker v0.4 catalog in `beskid_tracker/data/v0.4/`; it does not create a v0.5 feature line. `CHANGELOG.md` remains the release-note authority, `openspec/` remains the normative behavior authority, and GitHub Actions is the release-gate authority.

## Workstreams

### 1. Compiler and corelib correctness

Restore the `just corelib` / all-target test gate before completing API semantics. The work includes the missing-expression-type failures, the all-targets segmentation fault, and the tracker-defined collection-storage and host-backed `System.FS` completion. Each repair starts with a regression test and must retain the existing target support contract.

Exit evidence: the native Corelib workflow succeeds on the release commit, the 42-target matrix is green, and the matrix duration is recorded against the sub-five-minute acceptance threshold.

### 2. Build and package closure

Restore deterministic images and editor artifacts. This includes the platform-spec Docker build context/lockfile contract, the website `trudoc/book` dependency contract, the Nexus `@beskid/ui-react/settings` publication/consumption contract, the Windows warning-as-error failure, and Open VSX duplicate-version handling.

Exit evidence: Platform delivery, Publish Open VSX, and their focused local build/test commands pass on the release commit. Re-running the same artifact publication must be a no-op success rather than a failure.

### 3. Release pipeline resilience

Make rolling distribution safe to retry. Asset version resolution must precede publication; platform completion must be recorded only after the corresponding publication succeeds; partial fan-out failure must leave a retry path. Required GitHub package permissions and repository secrets are verified as operator preconditions without exposing values.

Exit evidence: a non-production dry-run proves that missing prerequisites fail before mutation and that a prior-success marker makes a rerun skip cleanly. A release operator records that `DISTRIB_GH_PAT`, GitHub Packages access, and Open VSX credentials are configured.

### 4. Production and product proof

Close remaining v0.4 product deliverables that cannot be proved locally: Auth Hub OAuth across consumers, Tracker webhook synchronization, Nexus Coolify/OAuth/analyze smoke, the multi-service deployment matrix, and `verify-all-on-main`. These are deployment acceptance tests, not substitutes for code tests.

Exit evidence: release operator links run IDs and production smoke results for each service, with environment identifiers but no secrets. A failed production smoke blocks promotion and invokes the existing rollback policy.

## Coordination model

Four agents work on disjoint paths: compiler/corelib, web/editor/package contracts, root CI/distribution, and release-governance evidence. Shared interfaces—published `@beskid/*` package versions, release manifests, and tracker task state—are integrated only after each agent's focused test passes. Existing user modifications and submodule changes are preserved.

## Error handling

CI failures stay blocking; no workflow should hide failed package uploads, failed scans, or failed deployment checks. External prerequisites are reported as operator blockers instead of being bypassed. A retried publication must detect the exact artifact/version state before attempting mutation.

## Test strategy

Every behavior change follows red-green-refactor. Workflow shell behavior is covered by existing shell or workflow-contract tests; Rust/TypeScript changes receive focused regression tests; then the associated workflow-equivalent command runs. Final validation is the full v0.4 gate matrix on the release SHA.

## Explicit non-goals

- Adding new language features or a v0.5 release line.
- Replacing external production approval with local simulation.
- Storing credentials, tokens, or production secret values in the repository.

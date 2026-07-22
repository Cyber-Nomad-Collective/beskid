# Automatic Production Promotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for executable validation and review each task before integration.

**Goal:** Automatically promote the exact staging manifest to production after successful staging deployment.

**Architecture:** `platform-delivery.yml` becomes the sole promotion chain. Its production reusable-workflow job depends on the staging job and uses the originating run ID, while `reusable-promote.yml` retains environment-scoped secrets, exact-manifest verification, smoke checks, and rollback.

**Tech Stack:** GitHub Actions reusable workflows, Bash CI checks, OpenSpec.

## Global Constraints

- Production starts only when both manifest generation and staging promotion succeed in the same workflow run.
- Staging and production deploy the exact same release manifest and digests.
- Production secrets remain scoped to the GitHub `production` environment.
- Preserve fail-closed deployment, smoke, status, and rollback behavior.
- Remove the manual promotion path completely.
- Update the normative staged-delivery requirement before observable behavior changes.

---

### Task 1: Single-Chain Promotion Workflow and Normative Requirement

**Files:**
- Modify: `.github/workflows/platform-delivery.yml`
- Delete: `.github/workflows/promote-production.yml`
- Modify: `openspec/specs/staged-delivery-observability/spec.md`
- Test: `scripts/ci/test/run-cicd-foundation-tests.sh`

- [ ] **Step 1: Add a failing structural workflow assertion**

Extend the CI foundation test fixture or shell assertion so the workflow must contain a production reusable-workflow call with:

```yaml
needs: [manifest, staging]
if: ${{ !cancelled() && needs.manifest.result == 'success' && needs.staging.result == 'success' }}
with:
  environment: production
  manifest-run-id: ${{ format('{0}', github.run_id) }}
  apply: true
```

It must also assert that `.github/workflows/promote-production.yml` does not exist.

- [ ] **Step 2: Run the focused assertion and verify RED**

Run: `bash scripts/ci/test/run-cicd-foundation-tests.sh`

Expected: FAIL because production is still a manual workflow dispatch.

- [ ] **Step 3: Implement the single promotion chain**

Add the production job after `staging` in `platform-delivery.yml` using the exact configuration from Step 1. Delete `promote-production.yml`. Do not change `reusable-promote.yml`, since it continues to provide production environment secret isolation and fail-closed execution.

- [ ] **Step 4: Update the OpenSpec requirement**

Replace manual-approval wording with the explicit automatic successful-staging precondition and identical-digest guarantee. Keep the production health-failure scenario and all fail-closed requirements.

- [ ] **Step 5: Verify GREEN and commit**

Run:

```bash
bash scripts/ci/test/run-cicd-foundation-tests.sh
bash -n scripts/ci/validate-promotion-source.sh
bash -n scripts/ci/deploy-release-manifest.sh
bun run openspec:validate
git diff --check
```

Expected: all commands exit 0.

Commit: `ci: auto-promote production after staging`

### Task 2: Governance Record and Final Verification

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `GLOSSARY.md` only if the existing Staged promotion definition needs the automatic policy clarified.

- [ ] **Step 1: Record the delivery behavior change**

Add an Unreleased Changed entry stating that successful staging promotion automatically promotes the identical manifest to production.

- [ ] **Step 2: Run delivery validation and change analysis**

Run:

```bash
bash scripts/ci/test/run-cicd-foundation-tests.sh
bun run openspec:validate
git diff --check
```

Run GitNexus `detect_changes({ scope: "compare", base_ref: "main" })` and review affected scope.

- [ ] **Step 3: Commit and document external administration**

Commit: `docs: record automatic production promotion`

State in the handoff that a repository administrator must remove `production` environment required reviewers and self-review prevention while retaining the `main` branch policy.


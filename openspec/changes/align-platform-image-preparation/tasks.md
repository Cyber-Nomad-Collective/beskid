## 1. Contract

- [x] 1.1 Add delivery requirement and scenarios.
- [x] 1.2 Add a repository contract test covering all required lanes.

## 2. Implementation

- [x] 2.1 Align all Node Docker build contexts and copied workspace sources.
- [x] 2.2 Regenerate any stale lockfiles with pnpm 10.17.1.
- [x] 2.3 Verify the selected dependency aliases resolve in each image.

## 3. Verification

- [x] 3.1 Run image-preparation contract tests and CI foundation tests.
- [ ] 3.2 Run local Docker builds where the daemon is available.
- [ ] 3.3 Confirm all required GitHub Actions image lanes pass.

## 4. Local container-engine boundary

- [x] 4.1 Define the Podman-local/Docker-GitHub-Actions validation contract.
- [x] 4.2 Route release-plan Compose validation through the checked engine boundary.
- [ ] 4.3 Verify a rendered release plan with Podman locally and GitHub Actions delivery gates remotely.

## 5. Published image runtime contract

- [x] 5.1 Define the runtime/image compatibility requirement and failure scenario.
- [x] 5.2 Make Tracker's final image invoke its declared Node runtime explicitly.
- [x] 5.3 Add an image-start health contract for Tracker before digest promotion.
- [ ] 5.4 Verify the exact published Tracker image with Podman and staging promotion.

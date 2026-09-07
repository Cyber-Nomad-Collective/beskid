## Status

Open

## Question

After verified pckg and compiler commits exist, can the root repository integrate their pointers and the associated website/CI/documentation changes while preserving fail-closed image and catalog contracts?

## Acceptance

- Root references only remote-reachable verified submodule commits.
- Catalog generation, standard validation, formatting, CI-contract tests, website build, and legacy-route checks pass.
- The pckg image gate explicitly requires the committed Rust Dockerfile.
- A root commit is reviewable, pushed, and ready for final release evidence.

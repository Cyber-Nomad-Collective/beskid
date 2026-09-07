## Question

What exact evidence closes the v0.4 release path across compiler distribution,
the 61-target corelib matrix, publication of the eight production corelib
packages and seven first-party templates, the Rust pckg OCI image, and the
GitHub-authorized Coolify staging and production promotions?

## Current facts

- GitHub Actions jobs are currently prevented from starting by an account
  billing lock; repository failures must still be eliminated and verified
  locally before the next push.
- The canonical promotion is GitHub Actions -> full release manifest ->
  Coolify. Direct Coolify API deployment is not an accepted substitute.
- Staging currently omits `pckg` from its stored `COMPOSE_PROFILES`; production
  declares the profile but has no pckg container. Both services are degraded.
- The checked-in lane configuration declares `tracker,nexus,pckg`, so the next
  successful GitHub secrets-sync and promotion must repair the stored drift.
- The live pckg route still serves the legacy .NET deployment and does not
  expose the Rust server's `/health/ready` contract.

## Completion evidence

1. All compiler and pckg tests pass, including the real corelib matrix against
   a staged ABI-v5 runtime kit.
2. Distribution workflow contract tests and action lint pass for the exact
   `0.4.<run>-unstable` identity and supported platform assets.
3. A credential-free publication rehearsal packs and validates exactly 15
   artifacts before any registry mutation.
4. GitHub builds and pushes an immutable Rust pckg image for the integrated
   root commit and records its digest in the full release manifest.
5. GitHub promotes that manifest to staging; Coolify reports the exact pckg
   digest as running and healthy, and the full canonical smoke matrix passes.
6. The 15 packages are published through the healthy Rust pckg service and are
   readable from the public registry.
7. Production promotion passes its protected-environment gate and repeats the
   exact digest and smoke verification.


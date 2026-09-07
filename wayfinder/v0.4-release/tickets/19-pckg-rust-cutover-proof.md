## Status

In progress

## Question

Can the pckg .NET-to-Rust cutover be made into a reachable, rollback-safe release slice: a committed Rust server and web image definition, a passing image build, and validated deployment inputs—without bundling unrelated deletions or local artifacts?

## Acceptance

- `pckg/Dockerfile` exists, builds the Rust service and web client from the root context, and is asserted by the root CI contract.
- The legacy .NET removal is deliberate, scoped, and covered by a migration/rollback statement.
- pckg-specific tests and image validation pass, a clean commit is pushed to the pckg remote, and the superproject can reference that reachable commit.
- No `.DS_Store`, unrelated documentation, or undeclared destructive content is included.

## Blocking evidence

The current working tree removes the legacy .NET service and its migration tooling, but does not establish whether production registry data exists or must survive. The Rust service also requires Authelia forward-auth inputs that the current infra configuration does not prove. The image lane cannot build until `pckg/Dockerfile` exists.

The legacy-data decision is now resolved: this is a fresh-store replacement. The remaining implementation work is a root-context Rust/web Docker image, intentional removal of stale cutover scripts, and forward-auth deployment proof.

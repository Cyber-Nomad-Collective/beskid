## Why

The 0.6.7 lock format 3 change kept a migration path for lock formats 1 and 2: code E3024, a Corelib-only format 2 lock that ordinary preparation regenerated, `beskid dev project lock` and `beskid update --all` that rewrote an old lock, and a language-server quick fix that ran the migration. No users exist, so no lock file of an older format exists outside the toolchain's own tests. The migration path is code that nothing needs, and it gives an old lock three different results (silent regeneration, E3024, or a rewrite).

## What Changes

- **BREAKING** A `Project.lock` whose first line is not `# Project.lock v3` (format 1, format 2 or an unknown header) fails with one error, new code **E3025**. The message tells the user to delete the file and write a new lock. No command reads, regenerates or rewrites such a file, also not `beskid dev project lock`, `beskid update` or the language server.
- Code **E3024** (retired lock format that needs a migration) is retired. The compiler does not emit it, and the registry does not reuse it.
- The language-server quick fix that migrated a retired lock is removed.

## Capabilities

### Modified Capabilities
- `compiler--resolution-and-projects--workspace-and-lock-contracts`, `compiler--semantic-pipeline--diagnostic-code-registry`, `tooling--manifests-and-lockfiles--workspace-and-lock-contracts`.

## Impact

`beskid_analysis` lock replay and preparation, project error and diagnostic registry; `beskid_lsp` code actions and lock-change refresh; the stability-proof soak harness (`beskid_proof`); Book and Docs lock pages. Target release: 0.6.7. Archive after `v067-shared-corelib` and `v06-cli-dependencies`, because this change modifies requirements that they add or modify.

## Compatibility, Migration and Reversion

No users exist. There is no migration path and no migration guide. A user with an old lock deletes it; the next `beskid dev project lock` (or an ordinary build) writes format 3 from the current manifests.

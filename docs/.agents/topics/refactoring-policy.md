# Refactoring policy

How Beskid changes its own design. This is an upstream maintainer preference
that shows throughout the code base.

## The rule

Refactors are complete. They purge the old design. No legacy APIs left behind,
no half-finished migrations, no compatibility fallbacks. When the new path
cannot do something, it fails closed instead of quietly falling back to the
old path.

## Order of work

1. Stabilize the tests that cover the behaviour.
2. Add the canonical path.
3. Migrate every consumer to it.
4. Delete the legacy path.

## Examples in the repository

- HIR is retired. Lowering rejects HIR and `Lowerable` entry points
  (see [../scopes/compiler.md](../scopes/compiler.md)).
- The legacy .NET registry and duplicate web clients are removed
  (see [../scopes/pckg.md](../scopes/pckg.md)).
- The old `site/spec-content` corpus is removed; `/platform-spec` only
  redirects (see [../scopes/openspec-standard.md](../scopes/openspec-standard.md)).
- Runtime kits that are missing, mismatched or tampered fail closed.

## Fail closed outside code

The same rule applies to operations: when a credential, identifier or grant is
missing, stop and document the human step instead of guessing
(see [../scopes/build-release-infra.md](../scopes/build-release-infra.md)).

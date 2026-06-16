---
title: Examples
description: Workspace and lockfile examples for tooling workflows.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## Minimal workspace manifest

```text
workspace {
  name = "demo-workspace"
}
member {
  id = "app"
  path = "apps/demo/Project.proj"
}
registry {
  default = "https://pckg.example/api/"
}
```

Run `beskid lock --project apps/demo/Project.proj --workspace-member app` when multiple members exist.

## Lock file excerpt

```text
# Project.lock v1
root_manifest = apps/demo/Project.proj
project_name = demo-app
dependency {
  name = corelib_foundation
  manifest = .beskid/packages/corelib_foundation/Project.proj
  project = corelib_foundation
  source_root = .beskid/packages/corelib_foundation
  materialized_root = .beskid/packages/corelib_foundation
}
```

Exact paths depend on fetch layout; treat materialized roots as opaque but stable for a given lock revision.

## CI sequence

```bash
beskid fetch --project apps/demo/Project.proj
beskid lock --project apps/demo/Project.proj
git add apps/demo/Project.lock
beskid build --project apps/demo/Project.proj
```

Commit the lock when reproducibility is required; use `update` locally when bumping dependency ranges in manifests.

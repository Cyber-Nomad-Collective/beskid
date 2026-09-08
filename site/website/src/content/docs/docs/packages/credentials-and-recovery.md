---
title: Package credentials and recovery
description: Store publisher credentials safely, verify identity, yank a bad version, and rotate a key.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: A symptom-to-command recovery table is clearer than a flow diagram.
audience:
  - package author
  - operator
authority:
  status: security-sensitive
  sourceLabel: Pinned package credential implementation
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_pckg/src/cli/repository.rs
  limits: The registry issues and revokes keys. The CLI stores or consumes an already issued key.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

A publisher key is a secret. Do not put it in a manifest, repository, shell history, issue, or build log.

## Prerequisites

Create a key with publish scope through the registry account surface. Put the key in your operating-system secret manager or CI secret manager. Plan a revoke and rotate action before you publish.

## Actions

1. For one process, inject the key as `BESKID_PCKG_API_KEY` from the secret manager. Do not type a literal value into a committed script.
2. Prefer the process environment. If you need repository-local CLI configuration, use a trusted host because `configure` receives the key through process arguments. Prevent Git from tracking the file, then save the injected value:

   ```bash
   printf '%s\n' '.beskid/pckg/repositories.json' >> .gitignore
   beskid pckg configure --api-key "${BESKID_PCKG_API_KEY}"
   ```

   The CLI writes `.beskid/pckg/repositories.json`. On Unix, it applies mode `0600`. Protect the file with operating-system permissions on other systems.

3. Verify the selected identity:

   ```bash
   beskid pckg whoami
   ```

4. Stop new downloads of a faulty version:

   ```bash
   beskid pckg yank Acme.Math --version 1.0.0
   ```

5. Restore it only when the same artifact is safe again:

   ```bash
   beskid pckg unyank Acme.Math --version 1.0.0
   ```

## Expected result

`beskid pckg whoami` reports `authenticated=true` for the intended publisher. A successful yank reports `version yanked`. The yanked artifact remains immutable but is unavailable to new downloads. Unyank restores download eligibility.

## Recovery

For `authentication required`, confirm that the key is active and has publish scope. Do not fall back to a browser cookie in automation. If you expose a key, revoke it in the registry and rotate it in every secret manager. Remove the local configuration file, then verify the replacement with `whoami`. If you yanked the wrong version, inspect the coordinate before you run `unyank`.

## Next task

Return to [publish a package](/docs/packages/publish/) or [consume a package](/docs/packages/consume/).

---
title: Package credentials and recovery
description: Store publisher credentials safely, log in and out, and rotate a key.
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
2. Save the injected value on a trusted host only when repository-local CLI configuration is necessary. The `login` command receives the key through process arguments, and the file must stay outside Git:

   ```bash
   printf '%s\n' '.beskid/pckg/repositories.json' >> .gitignore
   beskid package login --key "${BESKID_PCKG_API_KEY}"
   ```

   The CLI writes `.beskid/pckg/repositories.json`. On Unix, it applies mode `0600`. Protect the file with operating-system permissions on other systems.

3. Run the logout command when you no longer need the saved key:

   ```bash
   beskid package logout
   ```

4. To stop new downloads of a faulty version, use the registry account surface. The CLI has no yank command.
5. Restore the version in the registry only when the same artifact is safe again.

## Expected result

`beskid package login` saves the key for the selected repository. `beskid package logout` removes it. A yanked artifact remains immutable but is unavailable to new downloads. Unyank restores download eligibility.

## Recovery

For `authentication required`, confirm that the key is active and has publish scope. Do not fall back to a browser cookie in automation. If you expose a key, revoke it in the registry and rotate it in every secret manager. Remove the local configuration file, then run `beskid package login` with the replacement key. If you yanked the wrong version, inspect the coordinate before you restore it in the registry.

## Next task

Return to [publish a package](/docs/packages/publish/) or [consume a package](/docs/packages/consume/).

---
title: Publish a package
description: Create a package record, generate docs, pack and inspect a .bpk file, and upload it.
audience:
  - package author
authority:
  status: informative
  sourceLabel: Pinned package CLI and registry routes
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_pckg/src/cli/arguments.rs
  limits: The CLI uploads versions but does not create package records. This procedure uses the verified registry HTTP route for record creation.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

Create the package record before you upload its first artifact. Use a new semantic version when artifact content changes.

## Prerequisites

Load `BESKID_PCKG_API_KEY` from a secret manager. The key must have publisher permission and publish scope. Prepare a library project whose manifest name and requested package identity are correct.

## Actions

1. Verify the credential without printing its value:

   ```bash
   beskid pckg whoami
   ```

2. Create the package record through `POST /api/packages`. The CLI has no package-record creation subcommand:

   ```bash
   builtin printf 'header = "Authorization: Bearer %s"\n' "$BESKID_PCKG_API_KEY" |
     curl --fail-with-body --config - https://pckg.beskid-lang.org/api/packages \
     --header "Content-Type: application/json" \
     --data '{"name":"Acme.Math","isPublic":true,"submitForReview":false}'
   ```

   Curl reads `--config -` from standard input. The bearer value is not part of the curl process argument list. Do not add `--verbose` because verbose output can disclose request headers.

3. Pack version `1.0.0`:

   ```bash
   mkdir -p dist
   beskid pckg pack --package Acme.Math --version 1.0.0 --source . --output ./dist/Acme.Math-1.0.0.bpk
   ```

4. Inspect the embedded identity and file checksums before upload:

   ```bash
   unzip -p ./dist/Acme.Math-1.0.0.bpk package.json
   unzip -p ./dist/Acme.Math-1.0.0.bpk checksums.sha256
   unzip -l ./dist/Acme.Math-1.0.0.bpk
   ```

5. Confirm that the archive contains `.beskid/docs/api.json`. For a library package, `beskid pckg pack` generates API documentation unless you explicitly use `--skip-docs`.
6. Upload the inspected artifact:

   ```bash
   beskid pckg upload Acme.Math --artifact ./dist/Acme.Math-1.0.0.bpk
   ```

7. Verify the published record:

   ```bash
   beskid pckg details Acme.Math
   beskid pckg versions Acme.Math
   ```

## Expected result

The pack command reports the resolved version and includes generated `.beskid/docs/api.json` and `.beskid/docs/index.md` content. Upload reports `Published Acme.Math@1.0.0` with its checksum. The registry treats `Acme.Math@1.0.0` as an immutable coordinate.

## Recovery

If creation reports `package already exists`, inspect the existing owner and package name. Do not create a second spelling. If upload reports `package version is immutable`, compare the local artifact with the published checksum. Publish corrected content under a new version. If docs generation fails, fix the selected `.bproj` or source entrypoint before you pack again.

## Next task

[Consume the published package](/docs/packages/consume/) in a separate project.

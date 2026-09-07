---
title: "Publish your first package"
description: End-to-end flow from local project to first registry release.
---

import { Aside } from '@astrojs/starlight/components';

## 1. Prepare project metadata

Ensure the project `.bproj` has valid metadata, at least one target, and explicit dependency declarations. The registry requires an owned package record before the first artifact upload; a missing record makes the upload fail with HTTP 404 (`package not found`).

## 2. Authenticate

```bash
beskid pckg configure --api-key "$BESKID_PCKG_API_KEY"
beskid pckg whoami
```

Create the package record once through the authenticated metadata API. This is a separate operation from immutable artifact publication:

```bash
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $BESKID_PCKG_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{"name":"my-package","isPublic":true,"submitForReview":false}' \
  https://pckg.beskid-lang.org:8082/api/packages
```

The v0.4 release publisher performs this create-before-upload step automatically for the canonical corelib and template inventory.

<Aside type="caution">
Your credential must carry publish scope for the package. Authentication can succeed while an upload is still forbidden for an unowned package.
</Aside>

## 3. Validate package locally

```bash
beskid pckg pack --package my-package --source . --output my-package.bpk
```

This selects the exact artifact version and performs local checks without uploading:

- manifest validity
- source/package consistency
- deterministic package assembly

## 4. Upload

```bash
beskid pckg upload my-package --artifact my-package.bpk
```

The CLI reads the version from artifact-root `package.json` and sends multipart `version`, `checksumSha256`, and `.bpk` bytes to `POST /api/packages/my-package/versions`. The server validates the artifact and preserves that immutable package/version coordinate.

## 5. Verify and consume

```bash
beskid pckg search my-package
beskid pckg versions my-package
beskid pckg download my-package --version 1.0.0 --output my-package.bpk
```

<Aside type="note">
If package is moderated before public availability, wait for approval status in the **pckg registry** publisher workspace. Moderation status is per-package and per-version.
</Aside>

## Troubleshooting

<Aside type="caution">

**"Package not found"** — create the package record through `POST /api/packages` before uploading its first artifact.

**"Authentication succeeded but upload failed"** — the credential lacks publish scope or package ownership. Contact a registry admin.

**"No deterministic entrypoint"** — pack can't resolve the project entrypoint. Ensure exactly one root `.bproj` exists, or exactly one `.bd` file exists under the source tree.

**"Checksum mismatch"** — the `--checksum-sha256` flag doesn't match the artifact. Regenerate: `shasum -a 256 package.bpk`.

</Aside>

## See also

- [pckg command reference](/book/reference/cli/commands/pckg/) — full subcommand and flag reference
- [Packages without npm trauma](/book/18-packages-without-npm-trauma/) — chapter overview and concepts
- [The pckg CLI](/book/18-packages-without-npm-trauma/pckg-cli/) — tutorial walkthrough of `beskid pckg`
- [Doc and api.json](/book/16-corelib-batteries-with-opinions/doc-and-api-json/) — generated API docs for pckg ingestion
- [Package public surface](/book/19-public-api-that-survives-review/package-public-surface/) — what registry consumers see

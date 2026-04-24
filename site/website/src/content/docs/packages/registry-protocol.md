---
title: Registry Protocol
description: HTTP protocol between the pckg registry server and clients (for example `beskid pckg`).
---

## Transport

- HTTPS only.
- JSON for metadata APIs.
- Multipart/binary for `.bpk` upload and package download.

## Core endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/search?q=...`
- `GET /api/packages` (listing)
- `POST /api/packages` (create / upsert package metadata)
- `GET /api/packages/{packageNameOrId}`
- `POST /api/packages/{packageName}/publish` — multipart: **`artifact`** (required, `.bpk` zip). **`version`** is optional; when omitted the server assigns the next semver (optional **`versionBump`**: `patch`, `minor`, or `major`; defaults to patch). Optional **`checksumSha256`**, **`manifestJson`**.
- `GET /api/packages/{packageName}/versions`
- `GET /api/packages/{packageName}/versions/{version}/download`
- `POST /api/packages/{packageName}/versions/{version}/yank`
- `POST /api/packages/{packageName}/versions/{version}/unyank`

## Auth model

Bearer token auth for publish and owner operations.

Required publish roles:

- `Publisher`
- `SuperAdmin`

## Error envelope

```json
{
  "success": false,
  "code": "PCKG4001",
  "message": "Validation failed",
  "details": []
}
```

## Paging

Listing/search endpoints return cursor-based or page-based metadata with stable sorting guarantees.

## Versioning

Protocol is `/api` for v1.
Breaking changes must move to `/api/v2`.

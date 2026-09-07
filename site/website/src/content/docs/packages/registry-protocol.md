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
- `POST /api/packages/{packageName}/versions` — multipart: **`artifact`** (required `.bpk` zip), **`version`** (required and identical to artifact-root `package.json`), and **`checksumSha256`** (required and identical to the uploaded bytes). The package record must already exist and belong to the authenticated publisher.
- `GET /api/packages/{packageName}/versions`
- `GET /api/packages/{packageName}/versions/{version}/download`
- `POST /api/packages/{packageName}/versions/{version}/yank`
- `POST /api/packages/{packageName}/versions/{version}/unyank`

## Auth model

Bearer token auth for package metadata, artifact publication, and owner operations.

Required publication scope:

- an active pckg bearer key carrying `publish`
- ownership of the package record (administrators may operate under separately granted registry permissions)

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

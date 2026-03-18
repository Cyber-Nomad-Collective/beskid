---
title: Registry Protocol
description: HTTP protocol between `beskid pkg` client and pckg registry server.
---

## Transport

- HTTPS only.
- JSON for metadata APIs.
- Multipart/binary for `.bpk` upload and package download.

## Core endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/search?q=...`
- `GET /api/packages/{id}`
- `GET /api/packages/{id}/versions/{version}/download`
- `POST /api/packages/publish`
- `POST /api/packages/{id}/yank`
- `POST /api/packages/{id}/unyank`

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

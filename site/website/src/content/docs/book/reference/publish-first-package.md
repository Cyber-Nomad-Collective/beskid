---
title: Publish Your First Package
description: End-to-end flow from local project to first registry release.
---

## 1. Prepare project metadata

Ensure `Project.proj` has valid project metadata, at least one target, and explicit dependency declarations.

## 2. Authenticate

```bash
beskid pkg login
beskid pkg whoami
```

Your account must have `Publisher` or `SuperAdmin` role.

## 3. Validate package locally

```bash
beskid pkg publish --dry-run
```

This performs local checks without uploading:

- manifest validity
- source/package consistency
- deterministic package assembly

## 4. Publish

```bash
beskid pkg publish
```

Server-side pipeline validates `.bpk`, records metadata, and places submission into review/publish flow.

## 5. Verify and consume

```bash
beskid pkg search my-package
beskid pkg add my-package@^1.0.0
beskid pkg install
```

If package is moderated before public availability, wait for approval status in Publisher workspace.

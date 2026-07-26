# Align Platform Image Preparation

## Why

The immutable platform image lanes do not prepare their declared workspace
dependencies consistently. A successful website image can therefore coexist
with failing auth, learn, tracker, nexus, pckg, or Platform Spec images before
any artifact is published.

## What Changes

- Establish one fail-closed image-preparation contract for Node-based platform
  images: the Docker build receives every declared file-linked workspace source
  before its frozen install.
- Require the lockfile installed by a lane to match the package manifests
  copied into that lane's build context.
- Make the delivery contract test these invariants for every required image
  lane.

## Impact

- Platform delivery Dockerfiles, their build contexts, and lockfile validation.
- No runtime API, image naming, digest, or deployment behavior changes.

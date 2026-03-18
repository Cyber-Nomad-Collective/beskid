---
title: Package JSON v1
description: Normative schema contract for `package.json` inside `.bpk`.
---

## Schema id

`schema = "beskid.package.v1"`

## Required fields

- `schema`: string
- `id`: package identifier
- `version`: semver string
- `targets`: array of target descriptors
- `dependencies`: array of dependency descriptors

## Optional fields

- `authors`
- `description`
- `license`
- `repository`
- `homepage`
- `readme`

## Constraints

- `id` must be stable and lowercase-normalized.
- `version` must follow semver.
- dependency entries must include source + descriptor appropriate to source.

## Compatibility

- v1 readers ignore unknown additive fields.
- breaking field meaning changes require new schema id (`beskid.package.v2`).

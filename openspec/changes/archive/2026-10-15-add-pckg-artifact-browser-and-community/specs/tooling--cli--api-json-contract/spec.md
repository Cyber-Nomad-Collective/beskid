## ADDED Requirements

### Requirement: Structured documentation serves the packed api.json

`GET /api/packages/{name}/versions/{version}/docs/structured` SHALL return
`readme` (the artifact `README.md` or `null`) and `api` (the parsed
`.beskid/docs/api.json` or `null`). The registry SHALL reject an `api.json`
that is not a JSON object with a numeric `schemaVersion` and an `items` array,
or that exceeds 32 MiB, by answering not-found for the whole route. The
per-file browse read limit SHALL NOT apply to `api.json`. The website SHALL build its
reference navigation from `parentId` / `memberIds` only and SHALL present one
page per `module`, `type`, `enum`, `contract`, and `function` with a
declaration block, summary, parameter and return sections for callables,
remarks, examples, member tables grouped by kind, and the source location.

**Stable ID:** `BSP-REQ-PCKG-DOCS-STRUCTURED-002`

#### Scenario: Library release exposes its API model

- **GIVEN** a library release packed with `.beskid/docs/api.json` at schema 4
- **WHEN** a client requests `docs/structured`
- **THEN** `api.schemaVersion` is `4` and `api.items` carries the packed items

#### Scenario: Tool release exposes no API model

- **GIVEN** a tool release packed without `.beskid/docs/api.json`
- **WHEN** a client requests `docs/structured`
- **THEN** `api` is `null` and `readme` is still served when present

#### Scenario: Large API model is served

- **GIVEN** a library release whose `.beskid/docs/api.json` is larger than the
  1 MiB browse read limit and smaller than 32 MiB
- **WHEN** a client requests `docs/structured`
- **THEN** the registry serves the parsed `api` model

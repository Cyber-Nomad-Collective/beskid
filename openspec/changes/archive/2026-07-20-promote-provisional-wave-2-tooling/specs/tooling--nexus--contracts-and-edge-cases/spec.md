## ADDED Requirements

### Requirement: Public catalog response contract
`GET /api/catalog` responses MUST NOT expose internal paths, OpenRouter model names, or prompt text. Entries with `indexed: false` MAY appear in the catalog but MUST NOT be selected as the landing default. `docStatus` MUST remain coarse public state only with no AI pipeline error strings. `GET /api/catalog/:id` SHALL return a single `PublicCatalogEntry` or `404`.

#### Scenario: Catalog hides internal AI details
- **GIVEN** an indexed catalog entry that was processed by the code-doc pipeline
- **WHEN** a client calls `GET /api/catalog`
- **THEN** the response includes public fields such as `indexed` and `docStatus` and does not include OpenRouter model names, prompt text, or internal filesystem paths

### Requirement: Public graph attachment rules
`GET /api/graph?repo=<registryName>` MUST require `repo` to match `registryName` of an indexed catalog entry. `properties.codeDoc` and `properties.specLinks` MUST be omitted when no `CodeDocRecord` exists; when present they MUST be attached separately — never concatenated into one string. The graph stream MUST be the cached LadybugDB export; clients MUST NOT trigger analyze from this route.

#### Scenario: Missing CodeDocRecord omits fields
- **GIVEN** a graph node with no `CodeDocRecord`
- **WHEN** the public graph API serializes that node
- **THEN** `properties.codeDoc` and `properties.specLinks` are omitted rather than empty placeholders

### Requirement: Auth me and ownership verification
`GET /api/auth/me` SHALL return session identity including `ownedRepoIds` listing catalog `id` values where the session user is GitHub owner or admin. Unauthenticated requests MUST return `401`. Ownership MUST be verified via GitHub API with the hub user token — not a static env roster.

#### Scenario: Unauthenticated me returns 401
- **GIVEN** a request to `GET /api/auth/me` without a valid session
- **WHEN** the server handles the request
- **THEN** it returns `401`

### Requirement: Repo-owner admin authorization
Admin catalog routes (`POST`/`PATCH`/`DELETE` `/api/admin/catalog`, analyze, refresh-docs) REQUIRE an authenticated session and GitHub ownership of the target entry's `gitUrl`. Non-owners MUST receive `403` — not `404`. Operator `requireAdmin` MUST remain only for setup pairing (`POST /api/admin/auth/pair`) and instance bootstrap. Ownership checks MAY be cached up to 15 minutes per `(login, gitUrl)` pair. Transient GitHub API failures MUST fail closed (`403`). Non-GitHub `gitUrl` on create MUST return `400`.

#### Scenario: Non-owner admin create returns 403
- **GIVEN** an authenticated user who is not a GitHub owner of the target repository
- **WHEN** they call `POST /api/admin/catalog` for that `gitUrl`
- **THEN** the server returns `403`

### Requirement: CodeDocRecord validation and spec link index
`codeDoc` MUST describe what the code does in the repo from graph metadata and short file snippets only, and MUST NOT contain platform-spec MDX body text or long excerpts from the spec link index. An anti-copy guard MUST reject records where `codeDoc` contains ≥40 consecutive characters matching any spec index excerpt. `specLinks` MUST contain 0–3 entries; each `href` MUST exist in the built spec link index; unknown `href` values MUST be dropped at commit time. Regeneration MUST skip entities whose `contentHash` is unchanged. The spec link index built from `NEXUS_SPEC_ROOT` MUST be used for link lookup only — full MDX bodies MUST NOT be fed into code-doc generation prompts.

#### Scenario: Unknown spec link dropped
- **GIVEN** a generated `CodeDocRecord` whose `specLinks` include an `href` absent from the built spec link index
- **WHEN** the record is committed
- **THEN** the unknown `href` is dropped and never stored or exposed

### Requirement: MCP Bearer authentication
The MCP endpoint MUST be mounted at `/api/mcp` on the Nexus origin. Requests MUST include `Authorization: Bearer <NEXUS_MCP_AUTH_TOKEN>`. Missing or invalid Bearer MUST return `401`. MCP tools MUST expose graph query capabilities from the cached index (same data plane as the public graph API).

#### Scenario: Missing MCP Bearer returns 401
- **GIVEN** a client calling `POST /api/mcp` without an Authorization header
- **WHEN** the server authenticates the request
- **THEN** it returns `401`

## REMOVED Requirements

### Requirement: Contracts and edge cases conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.

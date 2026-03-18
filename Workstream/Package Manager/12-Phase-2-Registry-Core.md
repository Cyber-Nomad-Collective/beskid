# Phase 2 — Registry Core (Publish, Metadata, Download)

## Outcomes
- Minimal usable package registry.

## Functional Scope
1. **Package namespace ownership**
   - user/package ownership check
2. **Publish**
   - authenticated via API key
   - version immutability
   - artifact upload + checksum capture
3. **Read APIs**
   - package info
   - version list
   - artifact download
4. **Optional**
   - deprecate/yank version

## Data Model (minimum)
- `packages(id, owner_user_id, name, description, created_at)`
- `package_versions(id, package_id, version, manifest_json, checksum, storage_key, published_at, yanked_at)`

## API Endpoints
- `POST /api/packages/{name}/publish`
- `GET /api/packages/{name}`
- `GET /api/packages/{name}/versions`
- `GET /api/packages/{name}/versions/{version}`
- `GET /api/packages/{name}/versions/{version}/download`

## Validation Rules
- Semantic version required
- duplicate version rejected
- max artifact size enforcement

## Exit Criteria
- CLI/service can publish and later download exact artifact by package/version.

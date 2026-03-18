# Phase 0 — Foundation and Project Skeleton

## Outcomes
- Working Blazor Server host in `pckg`.
- Core packages wired (FastEndpoints, FluentUI Blazor, OpenAPI, Scalar).
- Base project structure + conventions.

## Work Items
1. **Solution layout**
   - `pckg` host project
   - optional folders: `Features`, `Infrastructure`, `Domain`, `Contracts`
2. **Dependencies**
   - Add Fluent UI Blazor
   - Add FastEndpoints and Swagger/OpenAPI integration
   - Add Scalar endpoint integration
3. **Configuration**
   - `appsettings.{Environment}.json` for DB, storage, security settings
   - typed options classes
4. **Cross-cutting**
   - error handling middleware/pipeline
   - request logging and correlation ids
   - health endpoints (`/health/live`, `/health/ready`)
5. **CI baseline**
   - build + test + formatting checks

## Deliverables
- App boots locally.
- `/openapi` (or configured route) generated.
- Scalar UI route visible.
- Health checks green.

## Exit Criteria
- Team can implement endpoints and pages without structural refactors.

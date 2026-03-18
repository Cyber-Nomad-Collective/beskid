# Beskid Package Manager Server — Program Plan

## Scope
Build a package manager server and web portal in `pckg` using:
- Blazor Server app shell (`dotnet new blazor --interactivity Server`)
- Fluent UI Blazor component system
- FastEndpoints for HTTP API
- OpenAPI for contract generation
- Scalar for interactive API docs

## Product Goals
1. Enable user registration/login.
2. Issue and manage API keys for CLI/package publishing.
3. Provide package registry APIs (publish, versions, metadata, download).
4. Ship a usable admin/user web interface for account + package management.

## Architecture Summary
- **Host**: ASP.NET Core + Blazor Server
- **UI**: Razor components + Fluent UI Blazor
- **API**: FastEndpoints grouped by bounded contexts
- **Storage**: PostgreSQL (primary), Redis (optional cache/rate limits)
- **Blob artifacts**: S3-compatible storage
- **Auth**: Cookie auth for web, API key auth for automation/CLI

## Plan Structure
- Phase plans:
  - `10-Phase-0-Foundation.md`
  - `11-Phase-1-Identity-And-ApiKeys.md`
  - `12-Phase-2-Registry-Core.md`
  - `13-Phase-3-Web-Portal.md`
  - `14-Phase-4-Hardening-And-Release.md`
- Area plans:
  - `20-Area-API-FastEndpoints.md`
  - `21-Area-Data-And-Storage.md`
  - `22-Area-Frontend-Blazor-FluentUI.md`
  - `23-Area-DevOps-Security-Observability.md`

## High-Level Milestones
- **M0**: App scaffold + dependency wiring complete.
- **M1**: Register/Login + API key lifecycle done.
- **M2**: Package publish/install API stable.
- **M3**: Portal flows complete (account, keys, package pages).
- **M4**: Security/perf hardening + release candidate.

## Definition of Done
- End-to-end flow validated:
  - register -> login -> create API key -> publish package -> fetch package metadata -> download artifact.
- OpenAPI and Scalar exposed in non-production and optionally protected in production.
- Integration and smoke tests pass in CI.

# Area Plan — API (FastEndpoints, OpenAPI, Scalar)

## Design Rules
- One endpoint class per route/action.
- Request/response contracts in dedicated DTOs.
- Validation via FastEndpoints validators.

## Endpoint Groups
1. Auth
2. API Keys
3. Packages
4. Versions
5. Artifacts

## OpenAPI + Scalar Plan
- Generate OpenAPI docs from FastEndpoints metadata.
- Expose Scalar UI from OpenAPI document.
- Non-prod: public docs.
- Prod: optional auth-gated docs.

## Testing Strategy
- unit tests for validators
- integration tests for endpoint behavior
- contract tests for critical responses

## Non-Functional Requirements
- pagination on list endpoints
- consistent error envelope
- idempotent publish behavior

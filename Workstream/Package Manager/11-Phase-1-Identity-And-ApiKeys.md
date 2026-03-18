# Phase 1 — Identity, Login/Register, API Keys

## Outcomes
- Simple account system with register/login/logout.
- API key creation, listing, revocation.

## Functional Scope
1. **Register**
   - email + password
   - uniqueness checks
   - password policy (minimal but safe)
2. **Login**
   - cookie/session auth for portal
   - lockout throttling baseline
3. **API Keys**
   - create key with name + scopes
   - show plaintext token once
   - store hashed key only
   - revoke key

## Data Model (minimum)
- `users(id, email, password_hash, created_at, last_login_at)`
- `api_keys(id, user_id, name, key_prefix, key_hash, scopes, revoked_at, expires_at, created_at)`

## Security Requirements
- Argon2id or PBKDF2 password hashing
- constant-time compare for key verification
- audit fields for key lifecycle actions

## API Endpoints (FastEndpoints)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/keys`
- `POST /api/keys`
- `DELETE /api/keys/{id}`

## Exit Criteria
- User can register/login from UI.
- Created API key can authenticate API request.
- Revoked key fails authentication.

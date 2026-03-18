# Area Plan — Data and Storage

## Persistence
- PostgreSQL for relational state.
- Migrations with startup guard.

## Storage
- S3-compatible bucket for package artifacts.
- Store object key + checksum + content type.

## Schema Evolution Plan
1. users + api_keys
2. packages + package_versions
3. audit tables (optional)

## Data Constraints
- unique `(package_id, version)`
- unique `users.email`
- unique active api key name per user (optional)

## Backup and Integrity
- daily DB backups
- artifact checksum verification on upload/download

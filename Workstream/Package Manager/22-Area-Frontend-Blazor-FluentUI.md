# Area Plan — Frontend (Blazor Server + Fluent UI Blazor)

## Component Architecture
- Feature-first pages (`Auth`, `Keys`, `Packages`)
- Shared components (`AppShell`, `DataTable`, `ConfirmDialog`, `ErrorBanner`)

## State and API Access
- typed API client services
- centralized auth/session state
- retry/error policy for transient failures

## Accessibility and UX
- keyboard navigable forms and tables
- proper aria labels for actions
- loading/skeleton states

## Quality Gates
- component tests for critical flows
- visual consistency checks against Fluent components

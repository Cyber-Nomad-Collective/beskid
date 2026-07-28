# Complete pckg React cutover

## Why

The registry image builds a React/Vite client but the production server still
maps its root route through the legacy interactive Blazor host. The deployed
HTML consequently references Blazor framework assets while the React bundle is
dead payload. The result is two UI authorities and a blank production page
when the Blazor asset handoff is incomplete.

## What Changes

- Make the built React client the only pckg browser application and serve it
  from the server's static web root.
- Preserve registry APIs, authentication, onboarding, SignalR, health, and
  artifact download routes as server-owned routes; the SPA fallback must never
  swallow them.
- Port or explicitly replace every still-required Blazor-only browser route
  before deleting the Blazor host and its component graph.
- Make the immutable image gate prove the React entrypoint and a nested client
  route are served, while server-owned paths retain their non-SPA behavior.

## Impact

- `pckg/web`, `pckg/src/Server`, pckg image build and delivery smoke tests.
- Public browser routing changes only; registry API and authentication wire
  contracts remain stable.

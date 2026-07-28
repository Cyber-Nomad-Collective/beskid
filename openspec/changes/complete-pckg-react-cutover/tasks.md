## 1. Contract and inventory

- [x] 1.1 Define the React-only browser-host and server-route ownership contract.
- [ ] 1.2 Inventory every existing Blazor route and classify it as React,
  explicit redirect, or approved retirement.
- [ ] 1.3 Close missing React route and API-client coverage.

## 2. Implementation

- [ ] 2.1 Copy Vite output into the server's canonical static web root.
- [ ] 2.2 Add constrained React fallback after server-owned endpoints.
- [ ] 2.3 Delete Blazor host registrations, mappings, and obsolete UI assets.
- [ ] 2.4 Remove the duplicate browser bundle path from the image.

## 3. Verification and delivery

- [ ] 3.1 Add server integration coverage for SPA, API, auth, hub, and missing-asset boundaries.
- [ ] 3.2 Run pckg web tests and server tests.
- [ ] 3.3 Build and smoke-test the Linux image with Podman.
- [ ] 3.4 Run the pckg GitHub Actions lane and promote only the verified digest.

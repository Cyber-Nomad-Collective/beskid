# Design: pckg React-only browser host

The registry has one browser authority: the Vite build emitted by
`pckg/web`. The server remains the authority for APIs, cookie/API-key/Bearer
authentication, pairing and onboarding actions, SignalR, health, artifacts,
and operational endpoints.

The final image copies `dist/` once into the server web root. Static-file
middleware serves concrete files. A final fallback returns `index.html` only
for extensionless client routes that are not server namespaces. This ordering
prevents a missing asset, API request, hub negotiation, or health probe from
receiving HTML.

The cutover is fail-closed: Blazor registrations and mappings are deleted only
after route inventory and API parity tests prove their replacements. Routes
that are no longer product behavior receive explicit HTTP redirects or 404s;
they are not silently retained through a second UI host.

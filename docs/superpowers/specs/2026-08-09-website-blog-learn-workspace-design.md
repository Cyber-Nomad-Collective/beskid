# Website blog and Learn workspace design

## Goal

Turn the website blog into an editorial publication surface, deny lesson access
until a Learn user has a verified session, and make the Learn workspace use one
accessible, visually coherent mosaic/tab implementation.

## Blog

Keep stable `/blog/*` URLs and the existing Astro/Starlight content loader.
Treat `blog/*` as a distinct document area through supported Starlight seams:
the index becomes a featured/latest story plus a chronological archive, and each
post gains an editorial masthead containing title, description, publication
date, status, and release/topic. Blog metadata is required for every blog
entry, validated at build/test time, and same-day entries sort deterministically
by their id. The generic documentation sidebar and index-only table of contents
are removed from blog presentation without changing Book or Platform Spec.

## Learn access

Learn is private: unauthenticated and failed-session states show only the
sign-in surface. The standard Beskid Auth Hub handoff is completed through a
server-side callback and a sealed, Secure cookie. Lesson data, compiler checks,
and persisted progress reject requests without that session. Editing is not
granted merely by possessing a login; it remains unavailable unless a distinct
authorization policy is introduced. The static catalog may stay bundled only
because the private application shell itself is gated.

## Learn workspace

The persisted nested mosaic remains the sole desktop layout. Its obsolete grid
predecessor is deleted. The tab strip remains navigation rather than ARIA tabs:
all desktop panels can be visible at once. Each selectable label and its close
button stay separate accessible controls, enclosed by a single stateful visual
shell so the close icon belongs to the tab header. No new dependency is added;
the shared UI package's existing resizable-panel primitive is used only if it
preserves the nested-layout persistence contract.

## Verification

Tests cover metadata validation/sort order, rendered blog contracts, logged-out
and failed-auth Learn visibility, protected API behavior, valid handoff/session
behavior, tab-shell semantics, and mosaic persistence. Focused test suites,
typechecks, production builds, and generated-page inspection provide final
evidence.

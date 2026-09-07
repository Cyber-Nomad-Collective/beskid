# pckg/web — Detail & Profile Pages Research

Research-only audit of the existing `pckg/web/` SPA to inform the
TanStack Start rewrite in `beskid_sites/apps/pckg`. Focus: the
"profile" and "package detail" pages the user wants preserved, plus the
surrounding listing / dashboard / docs surfaces that frame them.

All findings are read from the current `pckg/web/src/` tree (commit at
time of audit). No code was modified.

## 1. Inventory of pages / views

`pckg/web/src/router.tsx` assembles a code-based TanStack Router tree
(`createRoute`/`addChildren`, no file-based routes). The full route
inventory, with owning file and component:

| Path | File | Component | Zone |
|------|------|-----------|------|
| `/` | `routes/public.tsx` | `HomePage` | public |
| `/onboarding` | `routes/public.tsx` | `OnboardingPage` | public (deleted in rewrite — Authelia) |
| `/packages` | `routes/package.tsx` | `PackagesPage` | public listing |
| `/packages/$packageName` | `routes/package.tsx` | `PackageDetailsPage` | **public detail (preserve)** |
| `/packages/$packageName/docs` | `routes/package.tsx` | `PackageDocumentationPage` | public docs/source browser |
| `/publishers` | `routes/community.tsx` | `PublishersPage` | public listing |
| `/publishers/$publisher` | `routes/community.tsx` | `PublisherPage` | **public profile (preserve)** |
| `/topics` | `routes/community.tsx` | `TopicsPage` | public boards listing |
| `/topics/$topic` | `routes/community.tsx` | `TopicPage` | public board + posts |
| `/board/post/$postId` | `routes/community.tsx` | `BoardPostPage` | public post + comments |
| `/auth` | `routes/account.tsx` | `AuthPage` | auth (rewritten to Authelia) |
| `/settings/auth/pair` | `routes/account.tsx` | `AuthHubPairingPage` | auth (deleted in rewrite) |
| `/dashboard` | `routes/dashboard.tsx` | `DashboardLayout` | guarded shell |
| `/dashboard/profile` | `routes/account.tsx` | `ProfilePage` | **self-profile editor (preserve)** |
| `/dashboard/notifications` | `routes/account.tsx` | `NotificationsPage` | guarded |
| `/dashboard/api-keys` | `routes/account.tsx` | `ApiKeysPage` | guarded |
| `/dashboard/packages/my` | `routes/package.tsx` | `MyPackagesPage` | guarded listing |
| `/dashboard/packages/upload` | `routes/package.tsx` | `PackageUploadPage` | guarded form |
| `/dashboard/admin` | `routes/admin.tsx` | `AdminOverviewPage` | guarded admin |
| `/dashboard/admin/users` | `routes/admin.tsx` | `AdminUsersPage` | guarded admin |
| `/dashboard/admin/email` | `routes/admin.tsx` | `AdminEmailPage` | guarded admin |
| `/dashboard/admin/registry-activity` | `routes/admin.tsx` | `AdminRegistryActivityPage` | guarded admin |
| `/dashboard/admin/blocked-links` | `routes/admin.tsx` | `AdminBlockedLinksPage` | guarded admin |
| `/dashboard/admin/boards` | `routes/admin.tsx` | `BoardModerationPage` | guarded admin |

Shell (`routes/shared.tsx`): `AppShell` — top nav with `BeskidHub` +
`pckg` brand + Packages/Community/Publishers links + Sign-in/Dashboard
buttons on the right; `<main className="mx-auto max-w-6xl px-5 py-10">`
hosts the `<Outlet>`. Error and NotFound pages render a centred `Card`.

Dashboard shell (`routes/dashboard.tsx`): `lg:grid-cols-[13rem_1fr]`
with a hardcoded `<aside>` link list + `<Outlet>`. Guarded by
`beforeLoad` calling `pckgApi.getSession()` and redirecting to
`toDashboardGuardDestination(...)` when unauthenticated.

## 2. The "nice" pages to preserve (priority)

### 2.1 Package detail — `PackageDetailsPage` (`routes/package.tsx:112`)

**Route:** `/packages/$packageName`
**Data source:** `pckgApi.getPackage(packageName)` → `PackageDetails`
plus `pckgApi.listPackageCommunityReviews(packageName)` for reviews,
`useMutation` for `createPackageCommunityReview`.

**Layout (top → bottom):**

1. **Header row** — `flex flex-wrap items-start justify-between gap-4`:
   - Left: small primary-coloured category label → large `text-3xl`
     package name → muted `max-w-2xl` description.
   - Right: two buttons — primary `Download latest <version>` (anchor
     to `latestDownloadUrl`) and outline `Documentation` (`Link` to
     `/packages/$packageName/docs`).
2. **Tag strip** — `Badge variant="secondary"` for each tag, wrapped
   in `flex flex-wrap gap-2`.
3. **Metadata card** — single `Card` with a 2-column responsive grid
   (`sm:grid-cols-2`) of muted-foreground `text-sm` facts:
   - total downloads (`totalDownloads.toLocaleString()`)
   - "Published by {ownerDisplayName}"
   - "Updated {updatedAtUtc.toLocaleDateString()}"
   - "{dependentsCount} dependents"
   - conditional `Source repository` link (`repositoryUrl`)
   - conditional `Project website` link (`websiteUrl`)
4. **Community reviews section** (`mt-8`):
   - heading `Community reviews`
   - inline review form: native `<select>` (1–5 stars) + `Input`
     comment + `Button` submit, all in `flex flex-wrap gap-2`; on
     success invalidates `["package-community-reviews", packageName]`.
   - list of review `Card`s: `<strong>{rating}/5</strong> · {author}`
     + `whitespace-pre-wrap` comment.
5. **Versions section** (`mt-8`):
   - heading `Versions`
   - `<ul>` of bordered rows (`rounded-md border border-border px-4
     py-3`); each row is `flex flex-wrap items-center justify-between`:
     - left: bold version (with `(yanked)` suffix), muted line of
       `{sizeBytes/1024} KiB · published {date} · SHA-256 {checksum}`
       plus `· README` flag when `hasReadme`.
     - right: outline `Download` button linking to
       `pckgApi.packageDownloadUrl(packageName, version.version)`;
       hidden when `isYanked`.
   - empty-state row when `versions.length === 0`.

**Data model (`PackageDetails` from `lib/pckg-api.ts:24`):**
```ts
{
  package: PackageSummary,   // id, name, description, category,
                             // repositoryUrl, websiteUrl, tags[],
                             // totalDownloads, updatedAtUtc,
                             // ownerDisplayName
  versions: PackageVersion[], // version, publishedAtUtc, isYanked,
                               // checksumSha256, sizeBytes, hasReadme
  dependencies: { name, version|null, source, registry|null }[],
  dependentsCount: number,
  readme: string | null,      // NOTE: unused on this page (only on docs)
  latestVersion: string | null,
  latestDownloadUrl: string | null  // derived client-side
}
```
API endpoint: `GET /api/packages/{name}`.

**UI patterns to preserve:**
- Header hero with category eyebrow + name + description + primary
  action pair (Download / Documentation).
- Tag strip of secondary badges directly under the hero.
- Single "facts" card with a 2-col responsive muted grid (cheap,
  scannable; better than a definition list for this density).
- Versions as a bordered list (not a table) — keep this; it scales to
  narrow widths and the yanked/download affordance reads cleanly.
- Inline community review form + review cards. Native `<select>`
  should become shadcn `Select` from the shared lib in the rewrite.
- `PackageCommunityReview` shape (`id, author, rating, comment,
  createdAtUtc`) is the contract.

**Gap vs. "nice":** the page does **not** render the `readme` or
`dependencies` fields it already fetches (`PackageDetails.readme` and
`PackageDetails.dependencies` are unused here). The rewrite should
surface them — see §6.

### 2.2 Publisher profile — `PublisherPage` (`routes/community.tsx:77`)

**Route:** `/publishers/$publisher` (param is the Auth Hub *subject*,
e.g. `github:42`).
**Data sources:** `pckgApi.getCommunityProfile(subject)` and
`pckgApi.listPublisherPackages(subject)`; `useMutation` for
`togglePublisherFollow`.

**Layout:**
1. **Header row** — `flex flex-wrap items-start justify-between`:
   - Left: `text-3xl` display name; muted `bio` (or "No biography
     provided.").
   - Right: outline `Follow publisher` / `Following` toggle button
     driven by `follow.data?.is_following`.
2. **Social links** — `<ul>` of plain underlined anchors (one per
   `social_links[]` entry).
3. **"Published packages"** section (`mt-8`):
   - heading `Published packages`
   - responsive `md:grid-cols-2` grid of `Card`s, identical to the
     `/packages` listing card: title `Link` to
     `/packages/$packageName`, description, then a `flex flex-wrap`
     row of `{category} · {totalDownloads} downloads` + up to 3 tag
     `Badge`s.
   - empty-state card when no packages.

**404 handling:** if `getCommunityProfile` returns 404, render a
graceful "No public profile exists for this Auth Hub subject." card
instead of throwing.

**Data model (`CommunityProfile` from `lib/pckg-api.ts:172`):**
```ts
{ subject, display_name, bio, social_links: string[] }
```
API endpoints: `GET /api/community/profiles/{subject}`,
`GET /api/publishers/{subject}/packages`,
`POST /api/community/publisher-follows/{subject}/toggle`.

**UI patterns to preserve:**
- Hero with display name + bio + follow button on the right.
- Social links as a simple underlined list.
- Reuse the *same* package card as `/packages` and `/dashboard/packages/my`
  — this is already a shared visual idiom across three pages and must
  stay a single component in the rewrite.
- Graceful 404 → "no public profile" card.

### 2.3 Self-profile editor — `ProfilePage` (`routes/account.tsx:187`)

**Route:** `/dashboard/profile` (guarded).
**Data:** `pckgApi.getSession()` then `getCommunityProfile(subject)`;
`updateMyCommunityProfile` mutation.

**Layout:** max-w-2xl card form — `Display name` input, `Biography`
textarea, `Social links` textarea (one URL per line, split/trim/filter
on submit). Header explains "Signed in as {githubLogin}." Falls back
to `session.githubLogin` when no display name is set yet; tolerates
404 on the profile fetch (initial create case).

This is the *editing* surface for the same `CommunityProfile` shown
publicly by `PublisherPage`. The rewrite should keep both pages
sharing the `CommunityProfile` type and the `updateMyCommunityProfile`
endpoint.

## 3. Package listing / search — `PackagesPage` (`routes/package.tsx:35`)

**Route:** `/packages` with `validateSearch` → `{ q: string }`.
**Data:** `pckgApi.listPackages({ query })` (or `{ owner: "me" }` in
`MyPackagesPage`).

**Layout:**
- Header row: left = `Packages` title + muted subtitle; right = search
  form (`Input name="q"` + outline `Search` button, plain HTML form
  `action="/packages"` → TanStack Router search navigation).
- `md:grid-cols-2` grid of `Card`s; each card = title `Link`,
  `CardDescription` (description), then a muted `flex flex-wrap gap-2`
  row: `{category} · {totalDownloads} downloads · {ownerDisplayName}`
  + up to 3 tag `Badge`s.
- Empty-state `Card` spanning both columns: "No packages match this
  search."

**Notes:**
- No filters, no sort, no pagination. Search is single-box `q`. The
  client switches between `GET /api/packages` (no q), `GET
  /api/packages?owner=me`, and `GET /api/search?q=…` based on input.
- `MyPackagesPage` reuses the same card grid with an "Upload package"
  CTA in the header. **`/publishers/$publisher` reuses it too.** The
  rewrite should extract one `<PackageCard>` + one `<PackageGrid>`
  component and reuse across all three pages.

## 4. Dashboard / admin surface

`DashboardLayout` (`routes/dashboard.tsx:16`) is a fixed sidebar link
list (Profile, Notifications, API keys, My packages, Upload package,
Administration, Email settings, Registry activity, Blocked links) +
`<Outlet>`. The rewrite replaces this with the shell template’s
sidebar config — no behaviour to preserve beyond the link set.

Admin pages (`routes/admin.tsx`):
- `AdminOverviewPage` — two stat cards (users count, permissions
  count) + a "Grant resource permission" form (`subject` /
  `resource` / `capability` select) + current permissions list as
  small cards rendering `<code>subject</code> can <strong>cap</strong>
  <code>resource</code>`.
- `AdminUsersPage` — one card per user with role checkboxes (Member /
  Moderator / SuperAdmin) + "Verified publisher" checkbox + Save.
- `AdminEmailPage` — SMTP settings form (host, port, TLS, username,
  password, fromEmail, fromName).
- `AdminRegistryActivityPage` — vertical list of activity `Card`s:
  timestamp + severity chip + action + message + optional
  package/version line. No filtering, no pagination (fixed `take=200`).
- `AdminBlockedLinksPage` — add-pattern form (pattern + optional
  note) + list of blocked pattern cards with Delete.
- `BoardModerationPage` — per-board Lock/Unlock toggle cards.

`NotificationsPage` and `ApiKeysPage` (`routes/account.tsx`) are
similarly list-of-cards forms. **No charts, no tables, no tabs
anywhere in the dashboard** — everything is cards + forms. The shared
lib (`beskid-ui-react/src/components/ui/`) already ships `table`,
`tabs`, `chart`, `avatar`, `pagination`, `select`, `form` primitives
that the rewrite can adopt to upgrade these surfaces, but they are not
required for parity.

## 5. Package version comparison / diff

**None.** There is no version-to-version diff view. The closest is the
versions list on the detail page (§2.1) and the version selector on
the docs page (§2.4 below). The data model carries `checksumSha256`
per version but never computes a diff. If the rewrite wants version
comparison, it is a *new* feature, not a preservation.

## 6. Download stats / charts

**None.** Only the scalar `totalDownloads` (per package summary and
per-version implicit) is shown, as plain `toLocaleString()` text. No
time series, no graphs, no charts. The `chart.tsx` primitive in
`beskid-ui-react/src/components/ui/` is available if download-stat
charts become a rewrite goal, but the backend would need a new
endpoint (`GET /api/packages/{name}/stats` or similar) — currently
absent.

## 7. Package docs / source browser — `PackageDocumentationPage` (`routes/package.tsx:290`)

Worth calling out because it is the richest existing surface and
shares the detail page’s header idiom.

**Route:** `/packages/$packageName/docs?version=…`
**Data:** `getPackage`, `listPackageDocs`, `getPackageDoc`,
`listPackageSource`, `getPackageSource`, `getStructuredPackageDocs`,
`getPackageReadme`.

**Layout:**
- Header: "Package artifact" eyebrow + `{packageName} documentation`
  title + muted subtitle, with a version `<select>` on the right that
  navigates on change (clears `docPath`/`sourcePath`, updates search
  param).
- README `Card` (when present) — `<pre>` of raw readme text.
- Package metadata `Card` (when `structured.metadata` exists) —
  `<pre>` of `JSON.stringify(metadata, null, 2)`.
- Two-column `lg:grid-cols-2`:
  - **Documentation files** card — list of outline `Button`s
    (`path` + size); clicking loads the file via `getPackageDoc` and
    shows it in a `<pre>` panel.
  - **Source tree** card — same pattern via `listPackageSource` /
    `getPackageSource`.
- `PackageSourceGraphPanel` (`components/package-source-graph-panel.tsx`)
  — a `Browse source…` button opening `RepoExplorerDialog` (from
  `@beskid/ui-react/explorer`); selecting a `.bs` file renders a
  `LinkedAstFactsView` (from `@beskid/ui-react/graph`) with fixture
  AST/facts ("until live models exist").

**Patterns to preserve:** the version selector that drives search
param, the dual docs/source cards, the README + metadata pre blocks,
and the explorer dialog → AST/facts viewer wiring (shared with
platform-spec/tracker per the workspace DRY guidance — candidate to
lift into `beskid-ui-react`).

## 8. Cross-cutting UI patterns to preserve in the rewrite

1. **Package card** — `Card` + title `Link` + `CardDescription` +
   muted `flex flex-wrap` row of `{category} · {downloads} · {owner}`
   + up to 3 tag `Badge`s. Reused on `/packages`,
   `/publishers/$publisher`, `/dashboard/packages/my`. **Extract one
   component.**
2. **Hero header idiom** — small primary eyebrow + `text-3xl` title +
   muted description + right-aligned action buttons. Used on detail,
   publisher, docs, and most dashboard pages. Keep as a page header
   primitive (or just a consistent Tailwind pattern).
3. **Two-column "facts" card** — `sm:grid-cols-2` muted grid inside a
   single `Card`. Cheap, scannable metadata block.
4. **Bordered list rows** (versions, notifications, activity) —
   `rounded-md border border-border px-4 py-3` rows in a `<ul>`/div
   with `space-y-3`. A lighter alternative to `Table` for narrow
   content. The rewrite *may* switch to `ui/table` but should keep the
   visual weight similar.
5. **Inline create-form + list** pattern — review form, post form,
   comment form, blocked-link form, API-key form: a single `Card`
   with the form, then the list of result `Card`s below. Keep.
6. **Tag badges** — secondary `Badge` chips; clip to first 3 in
   list/grid contexts, show all on the detail page.
7. **Graceful empty + 404 states** — every list has an empty-state
   `Card` ("No packages match…", "No public publisher profiles
   yet.", …). `PublisherPage` renders a dedicated 404 card. Preserve
   this in the rewrite.
8. **TanStack Query key conventions** —
   `["packages", q]`, `["package", name]`,
   `["package-community-reviews", name]`, `["publishers"]`,
   `["community-profile", subject]`, `["publisher-packages",
   subject]`, `["session"]`, etc. Keep the same keys; they map 1:1 to
   the unchanged `PckgApiClient` and the invalidation calls already
   work.

## 9. Recommended approach for the TanStack Start rewrite

1. **Reuse the data layer verbatim.** `PckgApiClient` and
   `PackageDetails` / `CommunityProfile` / `PackageVersion` /
   `PackageSummary` / `PackageCommunityReview` types are
   framework-agnostic and already cover every field the detail and
   profile pages need. Port `lib/pckg-api.ts` + tests unchanged (per
   the existing Plan.md phase 3).
2. **Extract shared presentational components first**, before
   rebuilding the three package-list pages:
   - `PackageCard` (card body reused on listing, publisher, my-packages).
   - `PackageGrid` (responsive `md:grid-cols-2` wrapper + empty-state
     card).
   - `PageHeader` (eyebrow + title + description + right-slot actions).
   - `FactsCard` (2-col muted grid from the detail page).
   - `TagBadges` (with `max?` prop).
   These live in the new app’s `src/components/` (not the shared lib,
   unless platform-spec/tracker adopt them too — defer per DRY rule).
3. **Rebuild `/packages/$packageName` as a file-based route** mirroring
   the current layout, but **surface the missing data**:
   - Add a **README section** (render `PackageDetails.readme` — already
     fetched, currently unused on this page; or call
     `getPackageReadme(name, latestVersion)` for the latest version).
   - Add a **Dependencies section** (render
     `PackageDetails.dependencies` as a small table or bordered list:
     name / version / source / registry).
   - Promote the native review-form `<select>` to shadcn `Select`.
   - Optional: switch the versions list to `ui/table` (columns:
     Version, Published, Size, Checksum, README, Action) — only if it
     reads as nicely as the current bordered list; otherwise keep the
     list.
4. **Rebuild `/publishers/$publisher`** reusing the new `PackageGrid`
   + `PackageCard`. Keep the Follow button, social links, and the 404
   card. The profile editor (`/dashboard/profile`) stays a separate
   guarded form reusing the same `CommunityProfile` type.
5. **Rebuild `/packages` and `/dashboard/packages/my`** on the shared
   `PackageGrid`. Search stays a single `q` input → search param; no
   new filters/sort/pagination unless explicitly requested (the
   backend has no endpoints for them).
6. **Rebuild `/packages/$packageName/docs`** keeping the version
   selector, README + metadata pre cards, dual docs/source cards, and
   the `PackageSourceGraphPanel`. Lift the panel into `beskid-ui-react`
   only when platform-spec/tracker confirm the same shape (per Plan.md
   phase 7).
7. **Do not introduce** version diff, download-stat charts, tabs, or
   tables as preservation requirements — none exist today. Treat them
   as future features with backend dependencies.

## 10. "Nice" prioritisation

| Priority | Page | Why |
|----------|------|-----|
| P0 (must preserve 1:1) | `/packages/$packageName` | Hero + facts + versions + reviews is the signature page; only additions are README + dependencies (data already fetched). |
| P0 | `/publishers/$publisher` | The "profile" the user remembers; shares the package card idiom. |
| P0 | `/packages` listing | The entry point to the above; search + card grid. |
| P1 | `/dashboard/packages/my` | Same card grid + Upload CTA; trivially shares `PackageGrid`. |
| P1 | `/packages/$packageName/docs` | Richest existing surface; source/docs browser + AST viewer. |
| P1 | `/dashboard/profile` | Editor for the same `CommunityProfile` shown on `/publishers/$publisher`. |
| P2 | `/publishers`, `/topics`, `/topics/$topic`, `/board/post/$postId` | Community surfaces; preserve as-is, no enhancement. |
| P2 | `/dashboard/admin/*`, notifications, api-keys | Cards/forms; rebuild on shell template, optionally upgrade to `Table`/`Tabs`. |
| Drop | `/onboarding`, `/settings/auth/pair`, `/auth` (as-is) | Replaced by Authelia per Plan.md. |

## 11. Source files of record

- `pckg/web/src/router.tsx` — route tree + `clientRoutePaths`.
- `pckg/web/src/routes/package.tsx` — listing, detail, docs,
  my-packages, upload.
- `pckg/web/src/routes/community.tsx` — publishers, publisher
  profile, topics, topic, board post.
- `pckg/web/src/routes/account.tsx` — auth, pairing, profile editor,
  notifications, api keys.
- `pckg/web/src/routes/admin.tsx` — admin overview, users, email,
  registry activity, blocked links, board moderation.
- `pckg/web/src/routes/dashboard.tsx` — guarded shell + sidebar.
- `pckg/web/src/routes/public.tsx` — home + onboarding.
- `pckg/web/src/routes/shared.tsx` — `AppShell`, error/not-found.
- `pckg/web/src/components/package-source-graph-panel.tsx` —
  explorer + AST/facts panel.
- `pckg/web/src/lib/pckg-api.ts` — `PckgApiClient` + all DTO types.
- `pckg/web/src/styles.css` — theme token mapping (rewritten per
  Plan.md §6).

---
description: pckg Fluent UI Blazor full component catalog + page refactor plans
---

# Fluent UI Blazor Component Inventory + pckg Refactor Plans

## Sources used (web)
1. Fluent UI Blazor docs site: https://www.fluentui-blazor.net/
2. Fluent UI Blazor GitHub repo: https://github.com/microsoft/fluentui-blazor
3. GitHub API component directory (authoritative for component inventory):
   - `https://api.github.com/repos/microsoft/fluentui-blazor/contents/src/Core/Components?ref=dev`

> Inventory below is extracted from the official repository component directory (`src/Core/Components`) and then mapped into pckg UI refactor plans.

---

## Full Fluent UI Blazor component inventory (current repo directory scan)

### Layout, navigation, and shell
- **AppBar**: top app container, app-level actions.
- **BodyContent**: page body wrapper region.
- **Footer**: footer region composition.
- **Header**: header region composition.
- **Layout**: layout container primitives.
- **Main**: main-content semantic container.
- **MainLayout**: layout framework helper.
- **NavMenu**: standard navigation menu.
- **NavMenuTree**: hierarchical nav tree.
- **ProfileMenu**: account/profile actions menu.
- **Spacer**: flexible spacing for toolbars/rows.
- **Stack**: flex-based layout stack.
- **Grid**: grid-based layout utilities.
- **Splitter**: resizable panel split layout.

### Actions, command surfaces, and feedback
- **Button**: primary/secondary actions.
- **Menu**: command menu list.
- **MenuButton**: button + menu trigger.
- **Toolbar**: grouped command bar.
- **Toast**: transient notifications.
- **MessageBar**: inline status/error/warning/info.
- **Dialog**: modal interactions.
- **Popover**: anchored floating surface.
- **Tooltip**: contextual hints.
- **Overlay**: dim/overlay layer.
- **Progress**: loading/progress indicators.
- **Skeleton**: loading placeholders.
- **Flipper**: carousel/stepping navigation.
- **Pagination**: page navigation controls.

### Forms and inputs
- **EditForm**: Fluent-oriented form composition.
- **Forms**: form framework utilities.
- **Label**: input labeling.
- **TextField**: single-line text input.
- **TextArea**: multiline input.
- **NumberField**: numeric input.
- **Checkbox**: boolean selection.
- **Radio**: single-choice groups.
- **Switch**: on/off toggles.
- **Slider**: range selection.
- **DateTime**: date/time pickers and input.
- **InputFile**: file uploads.
- **Search**: search box input.
- **Rating**: star/score input.

### Data display and collection UI
- **DataGrid**: tabular data with columns.
- **List**: list rendering primitives.
- **Accordion**: expandable/collapsible sections.
- **Tabs**: tabbed page sections.
- **TreeView**: hierarchical data tree.
- **Breadcrumb**: path navigation.
- **Card**: content container surface.
- **Divider**: visual separators.
- **Badge**: compact status/label.
- **CounterBadge**: numeric badge.
- **PresenceBadge**: presence/availability marker.
- **Highlighter**: highlighted text output.
- **HorizontalScroll**: horizontal scroller wrapper.
- **SortableList**: sortable/reorderable lists.

### Utility, behavior, and design system
- **Accessibility**: accessibility helpers.
- **Anchor**: anchor/link helper component.
- **AnchoredRegion**: positionable anchored region.
- **CollapsibleRegion**: collapsible container region.
- **DesignSystemProvider**: design token root/provider.
- **Drag**: drag/drop behavior support.
- **Overflow**: overflow handling primitives.
- **PullToRefresh**: touch refresh behavior.
- **Wizard**: multi-step guided flows.
- **Icons**: Fluent icon sets/helpers.
- **Emojis**: emoji assets/helpers.
- **KeyCode**: keyboard code abstractions.
- **Base**: internal component base abstractions.

---

## pckg page-by-page refactor plans (component-driven)

## 1) App shell / MainLayout
**Goal:** polished product shell, clear auth state, responsive nav.

**Use components**
- `FluentAppBar` (replace custom header div)
- `FluentNavMenu` (primary navigation)
- `FluentProfileMenu` (auth/account actions)
- `FluentBadge` (Publisher badge)
- `FluentSpacer` (alignment)

**Refactor plan**
1. Replace top custom `<header>` with `FluentAppBar` + command slots.
2. Move auth buttons into `FluentProfileMenu` (Login/Register/Logout/Become Publisher).
3. Keep publisher sidebar only on `/publisher*` and role-gated.
4. Standardize link actions as real anchors for hard navigation points.

**Acceptance criteria**
- Login/Register/Logout always clickable and keyboard accessible.
- Mobile nav wraps cleanly without overlap.
- Auth state change reflected on reload and after role upgrade.

---

## 2) Home dashboard (`/`)
**Goal:** high-signal overview with clean hierarchy.

**Use components**
- `FluentCard` (KPI cards)
- `FluentBadge` (metric accents)
- `FluentDataGrid` (top categories / trending optional)
- `FluentSkeleton` (loading)
- `FluentMessageBar` (errors/empty data states)

**Refactor plan**
1. Keep KPI row in cards; add skeleton placeholders while loading.
2. Convert list blocks to compact `FluentDataGrid` for consistent density.
3. Add `MessageBar` for no-data and query errors.

**Acceptance criteria**
- No plain HTML list styling drift; all sections visually aligned.
- Empty/loading/error states look intentional.

---

## 3) Packages catalog (`/packages`)
**Goal:** searchable package discovery surface.

**Use components**
- `FluentSearch` (primary search)
- `FluentDataGrid` (results table)
- `FluentPagination` (paging)
- `FluentPopover` (advanced filters)
- `FluentBadge` (category/download labels)

**Refactor plan**
1. Keep `FluentSearch` as primary query input.
2. Replace plain `<table>` with `FluentDataGrid` columns.
3. Add filters (category, visibility, sort) in popover/filter row.
4. Add pagination + page size controls.

**Acceptance criteria**
- Search interaction works with Enter + button.
- Result rows are keyboard navigable and responsive.

---

## 4) Package details (`/packages/{name}`)
**Goal:** professional package profile with tabbed workflows.

**Use components**
- `FluentCard` (header and section containers)
- `FluentTabs` (Versions, Dependencies, Dependents, Reviews, Voting, Issues)
- `FluentRating` (review score input/display)
- `FluentMessageBar` (permission and validation feedback)
- `FluentDataGrid` (versions/dependencies/dependents lists)
- `FluentToolbar` (tab-level actions)

**Refactor plan**
1. Replace button-based pseudo-tabs with `FluentTabs`.
2. Normalize review form to Fluent input components.
3. Make issue/voting list dense via grid/cards hybrid.
4. Introduce toolbar actions per tab (e.g., add issue, refresh, sort).

**Acceptance criteria**
- Tab switching is immediate and preserves selected tab state.
- Review/voting actions give explicit success/error message bars.

---

## 5) Publisher workspace (`/publisher`)
**Goal:** power-user console for package maintenance.

**Use components**
- `FluentTabs` (Editor / Packages / Review Queue)
- `FluentEditForm` + `FluentTextField` + `FluentTextArea` + `FluentSwitch`
- `FluentDataGrid` (owned packages + queue)
- `FluentDialog` (danger/confirm actions)
- `FluentToast` (post-save success)

**Refactor plan**
1. Split monolithic page into child components:
   - `PublisherEditorPanel`
   - `PublisherPackagesGrid`
   - `PublisherReviewQueue`
2. Use Fluent form controls consistently (remove plain Input* where possible).
3. Introduce success/error feedback via toast/message bar.
4. Add validation summaries and action disable states.

**Acceptance criteria**
- Save/submit/review actions are explicit and guarded.
- No mixed visual language between controls.

---

## 6) Auth page (`/auth`)
**Goal:** trustable sign-in/up flow with clear feedback.

**Use components**
- `FluentTabs` (Login/Register)
- `FluentTextField` / password field
- `FluentCheckbox` (remember me)
- `FluentButton` actions
- `FluentMessageBar` errors/success

**Refactor plan**
1. Replace mode toggle buttons with `FluentTabs`.
2. Add inline validation + server response mapping.
3. Add loading state on submit to prevent double submit.
4. Add post-login redirect summary and explicit target.

**Acceptance criteria**
- Clear invalid credentials messaging.
- Register -> switch to login with prefilled email.

---

## Shared componentization plan
Create these reusable components to reduce page complexity:
- `AppTopBar.razor`
- `AuthActions.razor`
- `KpiCard.razor`
- `EmptyStateCard.razor`
- `LoadingStateGrid.razor`
- `PublisherEditorPanel.razor`
- `PackageReviewsPanel.razor`
- `PackageIssuesPanel.razor`

---

## Styling refactor guardrails
1. Keep design tokens centralized (colors, spacing, radius).
2. Prefer component props over custom CSS where possible.
3. Keep custom CSS for layout/brand only.
4. Ensure mobile breakpoints at `980px` and `700px` minimum.
5. Avoid plain `<a>`/`<input>` where Fluent equivalents exist (except hard navigation anchors where required).

---

## Execution roadmap (implementation order)
1. Shell + auth actions + navigation reliability.
2. Auth page tabbed form UX.
3. Packages DataGrid + search/filter/pagination.
4. Package details tabs + review/voting polish.
5. Publisher workspace split into subcomponents.
6. Final styling pass + accessibility/keyboard checks.

---

## Definition of done
- Every pckg page uses a consistent Fluent UI component language.
- No broken login/register/logout navigation.
- Data-heavy pages use `FluentDataGrid` with clear loading/empty/error states.
- Publisher workflows are role-gated, modular, and visually coherent.
- Responsive layout works on mobile + desktop without overlap or clipping.

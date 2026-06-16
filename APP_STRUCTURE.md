# MillionBlogs App Structure

## 1. Complete Next.js Folder Structure

The frontend should be organized as a dedicated Next.js 15 application using the App Router, TypeScript, Tailwind CSS, PWA assets, localization, and SEO-first public routes.

Recommended top-level structure:

```text
frontend/
  app/
  features/
  shared/
  hooks/
  services/
  state/
  i18n/
  seo/
  pwa/
  config/
  styles/
  public/
  tests/
  types/
```

Folder responsibilities:

- `app/`: route tree, layouts, templates, metadata boundaries, route loading states, route errors, and route composition.
- `features/`: domain-specific frontend modules aligned to backend domains.
- `shared/`: reusable cross-domain building blocks.
- `hooks/`: reusable React hooks that are not owned by a single feature.
- `services/`: frontend service layer for API orchestration, analytics, storage, and platform integrations.
- `state/`: global client state boundaries and shared state stores.
- `i18n/`: localization configuration, dictionaries, routing helpers, and direction rules.
- `seo/`: metadata, structured data, canonical, and hreflang utilities.
- `pwa/`: PWA configuration, service worker strategy, install state, and offline behavior documentation.
- `config/`: frontend runtime and build-time configuration.
- `styles/`: global style entry points and design token mapping.
- `public/`: static assets served directly by Next.js.
- `tests/`: frontend test suites and fixtures.
- `types/`: shared TypeScript types that are not feature-specific.

## 2. App Router Organization

The App Router should be organized around locale-aware routes and route groups.

```text
app/
  [locale]/
    layout.tsx
    not-found.tsx
    error.tsx
    loading.tsx
    (public)/
    (auth)/
    (dashboard)/
    (founder)/
    (admin)/
  manifest.ts
  robots.ts
  sitemap.ts
```

App Router responsibilities:

- `layout`: document shell, locale resolution, direction, theme bootstrapping, and shared providers.
- `loading`: route-level loading state for navigation and server data.
- `error`: localized recoverable error boundary.
- `not-found`: localized 404 handling.
- `metadata`: route-level SEO definitions for public pages.
- Route groups: product surface separation without leaking grouping names into URLs.

Rules:

- Route files should compose feature modules and shared UI only.
- Business rules stay in backend API responses and feature services.
- Route groups should not duplicate domain logic.
- Public routes should prefer server rendering for indexable content.
- Dashboard and admin routes should run behind authenticated layouts.

## 3. Public Route Groups

Public routes live under the locale segment and the `(public)` route group.

```text
app/
  [locale]/
    (public)/
      page.tsx
      blogs/
      articles/
      categories/
      languages/
      search/
      pricing/
      badges/
      support/
      about/
      contact/
      privacy/
      terms/
      offline/
      maintenance/
```

Public route group responsibilities:

- Homepage and discovery.
- Blog directory and blog detail.
- Article directory and article detail.
- Category and language discovery.
- Public search.
- Public pricing and promotion entry.
- Badge definitions.
- Public support entry.
- Legal and informational pages.
- Offline and maintenance experiences.

Public route rules:

- Indexable pages must expose crawlable content and metadata.
- Query-driven search result pages should be noindex unless product policy changes.
- Promotion placement must remain clearly disclosed.
- Locale and direction must be inherited from `[locale]`.

## 4. Dashboard Route Groups

Dashboard routes live under `(dashboard)` and require authenticated blogger access.

```text
app/
  [locale]/
    (dashboard)/
      dashboard/
        page.tsx
        profile/
        preferences/
        blogs/
        sessions/
        subscription/
        wallet/
        payments/
        promotions/
        notifications/
        support/
```

Dashboard route group responsibilities:

- Blogger overview.
- Profile and preferences.
- Blog registration and management.
- Verification and RSS feed workflows.
- Subscription, wallet, payment, and promotion workflows.
- Notifications and support.
- Session and account management.

Dashboard route rules:

- Dashboard routes are not SEO indexable.
- Data must be scoped to the authenticated user.
- Mutations must refresh only affected data.
- Destructive actions require confirmation.
- Loading states should preserve dashboard layout stability.

## 5. Admin Route Groups

Admin routes live under `(admin)` and require admin or super admin access.

```text
app/
  [locale]/
    (admin)/
      admin/
        page.tsx
        users/
        blogs/
        articles/
        categories/
        badges/
        promotions/
        subscriptions/
        plans/
        feature-flags/
        config/
        audit-logs/
        support/
        founder/
        health/
```

Admin route group responsibilities:

- Platform statistics.
- User, blog, article, category, and badge administration.
- Promotion and subscription oversight.
- Plan, feature flag, and config management.
- Audit log review.
- Support operations.
- Founder program administration.
- Operational health review.

Admin route rules:

- Admin routes are never indexable.
- Admin layouts must be visually and structurally distinct from blogger dashboards.
- Privileged actions must rely on backend authorization and show clear confirmation.
- Tables should use server-backed pagination, filtering, and sorting.

## 6. Shared Components Structure

Shared components are reusable across multiple feature modules and product surfaces.

```text
shared/
  components/
    layout/
    navigation/
    feedback/
    data-display/
    forms/
    overlays/
    media/
    seo/
```

Shared component categories:

- `layout`: shells, containers, page headers, section structure.
- `navigation`: menus, breadcrumbs, pagination, tabs.
- `feedback`: alerts, toasts, empty states, error states, success states.
- `data-display`: cards, tables, description lists, stats.
- `forms`: field wrappers, validation display, form actions.
- `overlays`: dialogs, drawers, popovers, confirmations.
- `media`: image wrappers, avatars, icons, placeholders.
- `seo`: visible SEO-supporting blocks such as breadcrumb presentation.

Rules:

- Shared components should not know backend domain rules.
- Shared components may accept semantic state and display data.
- Feature-specific variants belong in `features/`.

## 7. UI Components Structure

UI primitives are the lowest-level reusable visual elements.

```text
shared/
  ui/
    button/
    input/
    textarea/
    select/
    checkbox/
    radio/
    switch/
    slider/
    badge/
    card/
    table/
    tabs/
    menu/
    dialog/
    tooltip/
    toast/
    skeleton/
    avatar/
    icon-button/
```

UI primitive rules:

- Primitives must be accessible by default.
- Primitives must support light mode, dark mode, RTL, and localized text.
- Primitives must not import feature services.
- Primitives should expose variants based on design tokens, not one-off styling.
- Icon-only controls require accessible names.

## 8. Feature Modules Structure

Feature modules align to backend domains and product workflows.

```text
features/
  auth/
  users/
  blogs/
  rss/
  articles/
  categories/
  search/
  promotions/
  wallet/
  payments/
  badges/
  notifications/
  support/
  founder/
  subscriptions/
  admin/
  seo/
```

Each feature may contain:

```text
feature-name/
  api/
  components/
  hooks/
  services/
  state/
  types/
  utils/
  constants/
```

Feature responsibilities:

- `api`: domain-specific API request wrappers.
- `components`: feature-specific presentation and orchestration components.
- `hooks`: feature-specific data and interaction hooks.
- `services`: feature-specific client-side orchestration.
- `state`: feature-local state where needed.
- `types`: feature-specific DTOs and view models.
- `utils`: feature-specific pure helpers.
- `constants`: feature-level options and labels.

Rules:

- Features should not directly import from unrelated feature internals.
- Cross-feature reuse moves into `shared/`.
- API contracts should remain aligned to backend DTOs.
- Feature modules should not duplicate backend authorization or business rules.

## 9. Hooks Structure

Shared hooks belong in the top-level `hooks/` folder only when they are cross-domain.

```text
hooks/
  use-current-locale
  use-direction
  use-media-query
  use-debounce
  use-disclosure
  use-copy-to-clipboard
  use-pwa-install
  use-online-status
  use-safe-redirect
```

Hook rules:

- Domain hooks belong inside their feature module.
- Shared hooks must avoid feature-specific API calls.
- Hooks that affect authentication, analytics, PWA, or localization must use the corresponding service or shared state boundary.
- Hooks should be named by behavior, not by visual component.

## 10. Services Structure

Services contain client-side orchestration that is not a visual concern.

```text
services/
  api/
  auth/
  analytics/
  storage/
  pwa/
  routing/
  errors/
  telemetry/
```

Service responsibilities:

- `api`: HTTP client, request configuration, response parsing.
- `auth`: token lifecycle, refresh coordination, logout behavior.
- `analytics`: event dispatch and provider abstraction.
- `storage`: safe wrappers around browser storage where needed.
- `pwa`: install prompt, update prompt, offline coordination.
- `routing`: route helpers and safe redirects.
- `errors`: normalized client-side error handling.
- `telemetry`: client exception and performance reporting.

Rules:

- Services should be framework-aware only when necessary.
- Services must not render UI.
- Services must not contain backend business rules.
- Sensitive values must not be written to analytics or logs.

## 11. API Client Structure

The API client is centralized and version-aware.

```text
services/
  api/
    client/
    endpoints/
    errors/
    middleware/
    pagination/
    serializers/
    types/
```

API client responsibilities:

- Base URL configuration for `/api/v1`.
- Auth header injection.
- Refresh-token coordination hooks.
- Standard response parsing.
- Standard error normalization.
- Pagination helpers.
- Query parameter serialization.
- File, XML, text, and JSON response handling.

Endpoint grouping:

```text
services/
  api/
    endpoints/
      auth/
      users/
      blogs/
      rss/
      articles/
      categories/
      search/
      promotions/
      wallet/
      payments/
      badges/
      notifications/
      support/
      founder/
      subscriptions/
      admin/
      seo/
      health/
```

Rules:

- All API calls go through the shared API client.
- Endpoint wrappers must preserve backend DTO naming where practical.
- API errors must be normalized before reaching UI surfaces.
- Authenticated responses must not be stored in shared public caches.

## 12. Localization Structure

Localization is route-based and direction-aware.

```text
i18n/
  config/
  dictionaries/
  routing/
  formatting/
  direction/
  validation-messages/
```

Localization responsibilities:

- Supported locale definitions.
- Default locale definition.
- Locale-to-direction mapping.
- Dictionary loading.
- Locale-aware routing helpers.
- Date, number, currency, and relative-time formatting.
- Localized validation and error messages.

Dictionary organization:

```text
i18n/
  dictionaries/
    en/
      common
      public
      auth
      dashboard
      admin
      errors
    ar/
    nl/
```

Rules:

- Static UI text belongs to frontend dictionaries.
- Backend content language remains backend-owned.
- All user-facing routes must resolve locale before rendering.
- RTL direction must be applied at layout level.

## 13. SEO Utilities Structure

SEO utilities provide route-level metadata support for public pages.

```text
seo/
  metadata/
  canonical/
  hreflang/
  structured-data/
  breadcrumbs/
  robots/
  sitemap/
```

SEO responsibilities:

- Metadata assembly.
- Canonical URL generation.
- Hreflang alternate generation.
- JSON-LD structured data formatting.
- Breadcrumb data modeling.
- Robots and sitemap integration strategy.

Rules:

- SEO utilities must match backend SEO contracts.
- Structured data must reflect visible content.
- Noindex rules must be explicit for auth, dashboard, admin, search result, error, and utility routes.
- Public pages should expose canonical, localized, and structured metadata where relevant.

## 14. PWA Structure

PWA structure separates technical assets, lifecycle logic, and visual entry points.

```text
pwa/
  manifest/
  service-worker/
  offline/
  install/
  updates/
  caching/
```

PWA responsibilities:

- Manifest configuration.
- Service worker registration and update strategy.
- Offline fallback behavior.
- Install prompt coordination.
- Runtime caching policy.
- Theme color and icon asset mapping.

Rules:

- PWA behavior must not cache sensitive authenticated data for cross-session reuse.
- Public cached content must communicate freshness correctly.
- Install prompts should not interrupt auth, payment, admin, or critical reading flows.
- Offline routes must be localized where possible.

## 15. State Management Structure

State is organized by ownership and volatility.

```text
state/
  auth/
  ui/
  preferences/
  pwa/
  analytics-consent/
```

State ownership:

- Server state: API query layer, not copied into global stores.
- Auth state: current session, current user, token lifecycle status.
- UI state: global navigation, dialogs, toasts, theme, transient layout state.
- Preferences state: local user display preferences before or alongside backend persistence.
- PWA state: install prompt, update availability, online/offline status.
- Analytics consent: consent and provider readiness.

Rules:

- Prefer URL state for public filters, pagination, search queries, and meaningful tabs.
- Keep global state minimal.
- Feature-local state stays inside feature modules.
- Server responses should be invalidated, not manually synchronized across stores.

## 16. Testing Structure

Testing structure should mirror product surfaces and feature boundaries.

```text
tests/
  unit/
  integration/
  e2e/
  accessibility/
  visual/
  fixtures/
  mocks/
```

Testing responsibilities:

- `unit`: pure utilities, formatting, route helpers, SEO helpers, reducers.
- `integration`: API client behavior, auth refresh behavior, feature workflows.
- `e2e`: public discovery, auth, dashboard, admin, payment handoff, promotion flows.
- `accessibility`: keyboard, screen reader labels, focus, contrast-critical patterns.
- `visual`: public cards, dashboards, RTL, dark mode, PWA install/offline states.
- `fixtures`: stable DTO examples.
- `mocks`: API mock handlers and test service doubles.

Required coverage areas:

- Locale routing and RTL.
- Authenticated route protection.
- API error normalization.
- Public SEO metadata.
- Dashboard mutation feedback.
- Admin destructive confirmations.
- PWA offline behavior.

## 17. Assets Structure

Static public assets live under `public/`.

```text
public/
  images/
  icons/
  pwa/
  fonts/
  logos/
  social/
  placeholders/
```

Asset responsibilities:

- `images`: editorial and product images.
- `icons`: static icon assets not sourced from the app icon library.
- `pwa`: app icons, masks, splash-ready images.
- `fonts`: self-hosted fonts where selected.
- `logos`: brand marks and lockups.
- `social`: social share images and Open Graph defaults.
- `placeholders`: default image placeholders for blogs and articles.

Rules:

- Assets must have clear ownership and naming.
- Public assets should be optimized for web delivery.
- Placeholder assets must work in light and dark contexts.
- Social images must support localized metadata where required.

## 18. Icons Structure

Icons are managed through a single icon strategy.

```text
shared/
  icons/
    app-icons/
    status-icons/
    domain-icons/
    direction-icons/
```

Icon categories:

- `app-icons`: common UI actions and navigation.
- `status-icons`: success, warning, danger, info, pending, verified.
- `domain-icons`: blog, article, wallet, promotion, badge, feed, support.
- `direction-icons`: arrows and navigation icons that may mirror in RTL.

Rules:

- Use one primary icon family for UI consistency.
- Directional icons must support RTL mirroring.
- Icon-only buttons require accessible labels.
- Domain icons should not replace text labels for critical actions.

## 19. Fonts Structure

Fonts must support multilingual content and both LTR and RTL scripts.

```text
public/
  fonts/
    primary/
    fallback/
    mono/
```

Font responsibilities:

- `primary`: main UI and editorial font family.
- `fallback`: locale or script-specific fallback families.
- `mono`: technical values such as tokens, IDs, and code-like verification snippets.

Font rules:

- Font choices must support required languages.
- Font loading must preserve readability and performance.
- Public article and blog text must remain legible across scripts.
- Monospace usage should be limited to technical content.
- Font metrics should be tested against long localized labels.

## 20. Naming Conventions

General naming:

- Folders use kebab-case.
- Route segments use kebab-case.
- Feature folders match backend domain names where practical.
- Shared utilities use descriptive behavior-based names.
- Types use PascalCase.
- Constants use UPPER_SNAKE_CASE only for true constants.

Route naming:

- Public route names should be human-readable and SEO-friendly.
- Dashboard routes should describe user tasks.
- Admin routes should describe managed resources.
- Dynamic route segments should use entity names such as `{blogId}`, `{blogSlug}`, `{articleId}`, `{categorySlug}`, and `{campaignId}`.

File naming:

- Route files follow Next.js conventions.
- Non-route files use kebab-case.
- Test files mirror the unit under test.
- DTO and API type names should preserve backend meaning.

Module naming:

- Feature modules use domain nouns: `blogs`, `articles`, `wallet`.
- Service modules use capability nouns: `auth`, `analytics`, `storage`.
- Hooks start with `use`.
- State stores are named by owned state domain.

Design naming:

- Color, spacing, radius, shadow, and typography tokens should use semantic names.
- UI variants should describe purpose, not raw color.
- Status labels should align with backend state names where possible.

Naming rule of thumb:

- Names should reveal product meaning before implementation detail.

# MillionBlogs Frontend Architecture

## 1. Frontend Architecture Overview

The MillionBlogs frontend is a Next.js 15 application using TypeScript, Tailwind CSS, the App Router, PWA capabilities, and a multilingual SEO-first structure. It consumes the frozen NestJS REST API and does not own business rules, authorization decisions, persistence, payments, feed processing, search ranking, or SEO source-of-truth generation.

The frontend is organized into three product surfaces:

- Public website: anonymous and optionally authenticated discovery, article, blog, category, language, search, pricing, badge, and SEO-facing pages.
- User dashboard: authenticated blogger workflows for account, blogs, feeds, verification, promotions, wallet, payments, notifications, support, and sessions.
- Admin dashboard: authenticated admin workflows for users, blogs, categories, badges, feature flags, config, subscriptions, audit logs, and platform operations.

Core architectural principles:

- Server-first rendering for SEO-critical and read-heavy public pages.
- Client components only where browser interactivity, local UI state, or protected dashboard workflows require them.
- REST API contracts mirror backend DTOs and error shapes.
- Locale and text direction are route-level concerns, not ad hoc component concerns.
- Authentication state is centralized and never duplicated across unrelated feature areas.
- Backend role, feature access, and ownership checks remain authoritative.

## 2. Folder Structure

The frontend folder structure should separate route segments, domain features, shared primitives, infrastructure integrations, and configuration. The structure below defines boundaries only; it is not an instruction to create every folder immediately.

```text
frontend/
  app/
    [locale]/
      (public)/
      (dashboard)/
      (admin)/
      auth/
    api/
    manifest.ts
    robots.ts
    sitemap.ts
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
    admin/
    seo/
  shared/
    api/
    auth/
    cache/
    config/
    errors/
    i18n/
    layout/
    seo/
    state/
    ui/
    utils/
  public/
    icons/
    images/
    locales/
  tests/
```

Boundary rules:

- `app/` owns routing, layouts, metadata, loading UI, error UI, and route composition.
- `features/` owns domain-specific query functions, mutations, view models, validation schemas, and feature-level UI orchestration.
- `shared/api/` owns the HTTP client, typed response handling, auth headers, retry policy, and error normalization.
- `shared/i18n/` owns locale resolution, dictionaries, formatting, and route helpers.
- `shared/seo/` owns frontend metadata assembly from backend SEO responses and local route context.
- `shared/ui/` owns reusable presentational primitives only.

## 3. Routing Architecture

Routing uses the App Router with route groups for product surfaces:

- `[locale]/(public)` for public pages.
- `[locale]/(dashboard)` for authenticated blogger pages.
- `[locale]/(admin)` for authenticated admin pages.
- `[locale]/auth` for login, registration, password reset, email verification, and session recovery flows.

Locale is the first route segment for all user-facing pages. Non-localized technical endpoints such as `manifest.json`, service worker assets, sitemap routes, and robots directives remain available at canonical technical paths when required by browsers and crawlers.

Route guards are layered:

- Public routes allow anonymous access and may use optional authentication.
- Dashboard routes require a valid authenticated session.
- Admin routes require authentication and an admin-capable role.
- Fine-grained feature access, ownership, and permission checks are displayed optimistically only when backed by API responses; the backend remains authoritative.

Routing should preserve canonical URL contracts documented by the backend SEO module:

- Article pages map to article canonical URLs.
- Blog pages map to blog canonical URLs.
- Category pages map to category canonical URLs.
- Language pages map to language canonical URLs.

## 4. Public Website Architecture

The public website is optimized for crawlability, fast first render, semantic HTML, structured metadata, and discoverability.

Primary public areas:

- Home and discovery pages.
- Blog directory and blog detail pages.
- Article listing and article detail pages.
- Category pages.
- Language pages.
- Search pages.
- Pricing and promotions entry points.
- Badge definition and public badge display areas.

Public pages should prefer server components and server-side data fetching when the response affects SEO, canonical metadata, structured data, pagination, or initial content. Client-side fetching may be used for autocomplete, filters that do not need indexable URLs, progressive enhancement, and interaction-only widgets.

Public pagination must use URL-addressable query parameters. Filter state that changes page meaning should be reflected in the URL so pages can be shared, crawled, and cached.

## 5. User Dashboard Architecture

The user dashboard is an authenticated application surface for bloggers. It prioritizes task completion, clear status, and reliable mutation feedback over crawlability.

Dashboard domains:

- Profile and preferences.
- Blog registration and management.
- Ownership verification.
- RSS feed connection, status, and logs.
- Article visibility and deletion workflows.
- Promotion campaign creation and cancellation.
- Wallet balance, transactions, and statements.
- Stripe checkout and payment history.
- Notifications and unread state.
- Support tickets.
- Session management and logout.

Dashboard routes should use protected layouts that validate session state before rendering private content. Data that is specific to the authenticated user should not be statically generated. Mutations must use backend responses as the source of truth and invalidate or refresh only the affected cached data.

## 6. Admin Dashboard Architecture

The admin dashboard is a separate route group and layout from the user dashboard. It must not share navigation assumptions with blogger workflows.

Admin domains:

- Platform stats.
- User search, suspension, restoration, and deletion workflows.
- Blog moderation and verification overrides.
- Category and translation management.
- Badge definition and assignment management.
- Feature flag visibility and toggles.
- System config management.
- Audit log review.
- Subscription administration.
- Support ticket oversight where exposed by the API.

Admin pages should treat every operation as privileged. The UI may hide unavailable actions based on role, but must rely on backend `401` and `403` responses for enforcement. Admin tables should be built around server-backed pagination, filtering, and sorting rather than loading entire collections into the browser.

## 7. API Integration Architecture

The frontend integrates with the backend through the versioned REST API base path:

```text
/api/v1
```

The API client architecture must provide:

- A single base URL configuration.
- Typed request and response contracts aligned to backend DTOs.
- `Authorization: Bearer <access_token>` support.
- Standard pagination support using `page` and `pageSize`.
- Standard error normalization for `401`, `403`, `404`, `409`, and `422`.
- Request correlation support when backend request IDs are exposed.
- Separate handling for JSON responses, XML SEO endpoints, plain text endpoints, and file-like downloads.

API modules should be grouped by backend domain:

- Auth
- Users
- Blogs
- RSS
- Articles
- Categories
- Search
- Promotions
- Wallet
- Payments
- Badges
- Notifications
- Support
- Admin
- SEO
- Health

The frontend must not duplicate backend validation or authorization logic beyond client-side usability checks. Backend validation errors should be mapped into field-level and form-level UI states.

## 8. Authentication Flow

Authentication follows the backend contract:

- Access token: JWT, short-lived.
- Refresh token: long-lived opaque token, rotated on refresh.
- API authorization: `Authorization: Bearer <access_token>`.
- Refresh endpoint: `/api/v1/auth/refresh`.
- Current user endpoint: `/api/v1/auth/me`.

Frontend auth flow:

1. Register or login receives tokens and user profile data.
2. Access token is used for authenticated API requests.
3. Refresh token rotation is triggered when the access token expires or an authenticated request returns `401` due to token expiry.
4. Failed refresh clears authenticated state and redirects to login with return-path preservation where appropriate.
5. Logout revokes the session through the backend and clears local auth state.
6. Logout-all revokes other sessions according to backend behavior.

Security requirements:

- Token storage strategy must be explicitly selected during implementation and reviewed against XSS and CSRF risk.
- Auth refresh must be single-flight to avoid parallel refresh races.
- Password reset and email verification tokens must only be handled in the relevant auth routes.
- Admin role checks in the UI are advisory; backend roles remain authoritative.

## 9. Internationalization Architecture

Internationalization is route-based and locale-first.

Requirements:

- Locale appears in the user-facing route path.
- Dictionaries are loaded per locale and scoped to the route or feature where possible.
- Formatting for dates, numbers, currency, and relative time uses locale-aware APIs.
- Backend-provided language metadata is respected for articles, blogs, categories, hreflang, and sitemap behavior.
- Missing translations must fall back predictably without breaking route rendering.

Translation ownership:

- Static interface strings belong to the frontend.
- Content language, article metadata, blog language, SEO alternates, and structured data source fields belong to the backend.

The i18n layer must expose:

- Supported locale list.
- Default locale.
- Locale-to-direction mapping.
- Locale-aware URL helpers.
- Dictionary loading.
- Formatting helpers.

## 10. RTL/LTR Architecture

Text direction is derived from the active locale and applied at the document/layout boundary using `dir`.

RTL/LTR rules:

- Layouts must use logical CSS properties where practical.
- Tailwind direction variants or equivalent utilities should be centralized.
- Iconography that implies direction must be mirrored or selected per direction.
- Form alignment, table alignment, navigation, breadcrumbs, and pagination must respect direction.
- Mixed-language content should rely on semantic HTML direction attributes where needed.

Direction must not be hardcoded inside individual features unless rendering mixed-direction content intentionally.

## 11. SEO Architecture

SEO is a primary frontend concern for public pages and a backend-integrated concern for metadata correctness.

Frontend SEO responsibilities:

- Render crawlable content on initial response for indexable pages.
- Generate Next.js metadata from backend SEO responses and page data.
- Emit canonical URLs.
- Emit hreflang alternates.
- Emit Open Graph and Twitter metadata.
- Emit JSON-LD structured data where provided or derived from backend contracts.
- Maintain semantic headings and accessible navigation.
- Ensure paginated and filtered pages have deliberate canonical behavior.

Backend SEO responsibilities consumed by the frontend:

- Canonical URL rules.
- Hreflang alternates.
- Metadata source fields.
- Structured data source fields.
- Sitemap and robots behavior where exposed by backend endpoints.

SEO routes:

- Public pages use route-level metadata generation.
- Sitemap and robots handling must align with backend SEO endpoints and deployment topology.
- Article, blog, category, and language pages must avoid client-only content for primary indexable text.

## 12. SSR / ISR / SSG Strategy

Rendering strategy is selected by page type:

| Page Type | Strategy | Reason |
|---|---|---|
| Home/discovery | ISR or SSR | Public, SEO-sensitive, freshness-dependent |
| Article detail | ISR or SSR | SEO-critical, content may update through RSS |
| Blog detail | ISR or SSR | SEO-critical, freshness-dependent |
| Category pages | ISR or SSR | Public listing, paginated |
| Language pages | ISR or SSR | Public listing, locale-sensitive |
| Search results | SSR | Query-dependent and freshness-sensitive |
| Auth pages | SSR shell / client interaction | Non-indexed interaction flow |
| User dashboard | SSR or dynamic rendering | Authenticated, user-specific |
| Admin dashboard | Dynamic rendering | Privileged and user-specific |
| Static legal/help pages | SSG or ISR | Stable content |

SSG is appropriate only for stable pages whose content is not user-specific and whose metadata does not require per-request state. ISR should be used for public content where regeneration windows are acceptable. SSR should be used when data must be fresh, personalized, permissioned, or query-specific.

## 13. Caching Strategy

Caching is layered:

- Browser cache for static assets, icons, fonts, and PWA assets.
- Next.js data cache for public, cacheable REST reads.
- Route-level revalidation for ISR pages.
- Client query cache for dashboard data and interactive public widgets.
- CDN cache for public HTML and SEO assets where deployment supports it.

Cache policy by data type:

- Public article, blog, category, language, pricing, and badge reads may be cached with explicit revalidation.
- Search results should have short-lived or no persistent cache depending on query volatility.
- Authenticated dashboard data must be scoped to the active user and should not be shared across users.
- Admin data should be dynamic or very short-lived.
- Wallet, payment, session, notification unread count, and verification status require freshness after mutations.

Invalidation principles:

- Mutations invalidate only affected queries and route segments.
- Payment and wallet actions refresh balance and transaction history.
- Blog and RSS mutations refresh blog, feed, verification, and article-related data.
- Admin moderation actions refresh affected admin lists and public entity pages when relevant.

## 14. PWA Architecture

The PWA architecture provides installability, resilient asset loading, and carefully scoped offline behavior.

PWA components:

- Web app manifest.
- App icons and splash-ready assets.
- Service worker.
- Offline fallback route or response.
- Runtime caching rules.
- Update detection and user-visible refresh behavior.

PWA caching rules:

- Cache static assets aggressively with hashed filenames.
- Cache public read-only content only when it does not conflict with SEO freshness expectations.
- Do not cache authenticated API responses in a way that can leak between users.
- Do not cache wallet, payment, session, admin, or security-sensitive responses for offline reuse.
- Failed dashboard requests should produce explicit offline or retry states.

PWA should enhance the app without changing backend security, authorization, or payment behavior.

## 15. Error Handling Strategy

Errors are normalized at the API layer and rendered by route-level or feature-level boundaries.

Backend error shape handling:

- `422`: map validation errors to field-level and form-level messages.
- `401`: attempt refresh when appropriate; otherwise require login.
- `403`: render access denied and remove unavailable privileged actions.
- `404`: render route-level not found or entity-specific empty state.
- `409`: render conflict state and recovery action.
- `5xx`: render retryable system error with correlation information when available.

Next.js error surfaces:

- Global error boundary for unrecoverable application failures.
- Route segment error boundaries for public, dashboard, and admin areas.
- Not-found routes for missing public entities and invalid localized paths.
- Form-level mutation errors for recoverable validation and business conflicts.

Error messaging should be localized, specific, and non-sensitive.

## 16. Loading States Strategy

Loading states must match the surface and data criticality.

Public website:

- Prefer server-rendered content for primary SEO text.
- Use route-level loading states for navigation between heavy listings.
- Use skeletons for lists, cards, and search refinements only when content cannot be server-rendered immediately.

User dashboard:

- Use optimistic UI only for reversible or low-risk interactions.
- Use pending states for forms and destructive actions.
- Disable duplicate submission while mutations are in flight.
- Refresh affected data after successful mutation.

Admin dashboard:

- Prefer explicit pending, success, failure, and confirmation states.
- Avoid optimistic state for destructive or privileged actions unless the backend response has already confirmed success.

Loading UI must preserve layout stability and avoid shifting primary navigation or action controls.

## 17. State Management Strategy

State is divided by ownership:

- Server state: REST API responses, cached and invalidated through a query/data-fetching layer.
- URL state: locale, pagination, search query, filters, tabs that affect shareable page meaning.
- Auth state: current user, access token lifecycle, refresh coordination, and session status.
- UI state: dialogs, menus, transient form steps, local toggles, and component interaction state.
- Form state: scoped to each form and synchronized with backend validation errors.

Global client state should be minimal. Server state should not be copied into unrelated global stores. URL state should be preferred for public filters and dashboard table filters that need persistence, sharing, or browser navigation support.

## 18. Analytics Integration Points

Analytics must be privacy-aware and should not replace backend audit, search analytics, or payment records.

Integration points:

- Page views on public, dashboard, and admin route changes.
- Search query submission and autocomplete selection.
- Blog registration funnel.
- Feed connection and verification funnel.
- Promotion campaign creation funnel.
- Checkout start and return states.
- PWA install prompt display and acceptance.
- Language switch events.
- Auth funnel events: registration started, registration completed, login completed, password reset requested.
- Error events for API failures, client exceptions, and offline states.

Analytics must avoid collecting raw passwords, tokens, payment details, reset links, sensitive admin data, or full private support content.

## 19. Security Considerations

Frontend security requirements:

- Treat backend authorization as authoritative.
- Never expose secrets in client bundles.
- Keep environment variables separated by server-only and public-safe prefixes.
- Sanitize and safely render any user-generated or feed-imported HTML.
- Use strict Content Security Policy compatible with required analytics, payment, and asset providers.
- Protect against XSS, especially where article excerpts, blog metadata, RSS content, or support content are rendered.
- Ensure token handling strategy is reviewed for XSS and CSRF tradeoffs.
- Prevent open redirects in auth return paths.
- Redact sensitive data from logs, analytics, error reporting, and replay tools.
- Use secure transport only in production.
- Respect backend rate limits and avoid client retry storms.
- Never cache authenticated or privileged responses in shared caches.

Admin-specific security:

- Admin routes must be isolated under the admin route group.
- Admin navigation and actions must be role-aware.
- Destructive actions require confirmation and clear result handling.
- Audit-sensitive actions should include enough UI context for operators to understand the effect before submission.

## 20. Future Scalability Considerations

The frontend should be able to scale without restructuring core boundaries.

Scalability considerations:

- API versioning must remain explicit so future backend versions can coexist.
- Feature modules should map to backend domains to allow independent ownership.
- Public routes should support CDN caching and selective revalidation.
- Search UI should support future backend ranking, language-aware search, typo tolerance, and faceting without route redesign.
- Dashboard tables should rely on server pagination and filtering from the start.
- Locale and direction architecture should support adding languages without rewriting layouts.
- SEO metadata assembly should allow additional structured data types.
- PWA caching should remain conservative as authenticated workflows expand.
- Analytics should be provider-agnostic behind a small integration layer.
- Design system primitives should remain separate from domain features.
- Admin workflows should remain separated from blogger workflows to support future internal tools or permission tiers.
- The API client should support future streaming, webhooks-to-client updates, or realtime notifications if the backend adds them later.

The frontend architecture should evolve by adding domain modules and route segments within these boundaries rather than introducing parallel data-fetching, auth, i18n, or SEO systems.

# MillionBlogs Frontend Route Map

## Routing Principles

All user-facing routes are language-aware and use the active locale as the first path segment:

```text
/{locale}/...
```

Examples:

- `/en`
- `/en/blogs`
- `/ar/dashboard`
- `/nl/admin`

Technical PWA and crawler routes may remain unlocalized when browser or search engine conventions require root-level paths.

Default assumptions:

- Public content routes are SEO indexable unless they contain private, transactional, auth, duplicate, or user-specific state.
- Dashboard, admin, wallet, payment, support, notification, and account routes are not SEO indexable.
- Backend authorization remains authoritative for role and ownership checks.
- API dependencies use the frozen REST API under `/api/v1`.

Role labels:

- `Visitor`: unauthenticated user.
- `Blogger`: authenticated standard user.
- `Admin`: authenticated admin user.
- `Super Admin`: authenticated elevated admin user.

Rendering labels:

- `SSR`: server-side rendered per request.
- `ISR`: statically generated with revalidation.
- `SSG`: statically generated at build time.
- `CSR`: client-side rendered interaction surface.

## 1. Public Website

| Route URL | Page Purpose | SEO Indexable | Authentication Required | Role Required | Strategy | API Dependencies | Primary UI Sections | Expected Loading Strategy |
|---|---|---:|---:|---|---|---|---|---|
| `/{locale}` | Public home and discovery entry | Yes | No | Visitor | ISR | `GET /api/v1/articles`, `GET /api/v1/blogs`, `GET /api/v1/categories`, `GET /api/v1/promotions/pricing` | Featured articles, featured blogs, categories, language discovery, promoted placements | Server-render primary content; skeletons for secondary discovery widgets |
| `/{locale}/blogs` | Browse public blog directory | Yes | No | Visitor | ISR | `GET /api/v1/blogs` | Filters, blog list, pagination, category/language facets | Server-render first page; skeleton list on filter transitions |
| `/{locale}/blogs/{blogSlug}` | Public blog profile | Yes | No | Visitor | ISR | `GET /api/v1/blogs/:slug`, `GET /api/v1/blogs/:id/articles`, `GET /api/v1/blogs/:id/badges` | Blog header, badges, description, article list, feed status summary | Server-render profile and initial articles; skeletons for paginated article updates |
| `/{locale}/blogs/{blogSlug}/articles` | Blog-specific article archive | Yes | No | Visitor | ISR | `GET /api/v1/blogs/:id/articles` | Blog context header, article list, filters, pagination | Server-render initial archive; skeleton rows/cards on pagination |
| `/{locale}/articles` | Browse public article directory | Yes | No | Visitor | ISR | `GET /api/v1/articles`, `GET /api/v1/categories` | Article list, category filter, language filter, pagination | Server-render initial list; skeleton cards for client-side filter transitions |
| `/{locale}/articles/{articleId}` | Public article detail | Yes | No | Visitor | ISR or SSR | `GET /api/v1/articles/:id`, SEO metadata endpoints where available | Article header, source blog, content summary/excerpt, metadata, related articles | Server-render indexable content; route-level loading on navigation |
| `/{locale}/categories` | Public category directory | Yes | No | Visitor | ISR | `GET /api/v1/categories` | Category list, descriptions, article counts where available | Server-render list; minimal loading state |
| `/{locale}/categories/{categorySlug}` | Category detail and article listing | Yes | No | Visitor | ISR | `GET /api/v1/categories/:slug`, `GET /api/v1/categories/:slug/articles` | Category header, article list, pagination, related categories | Server-render first page; skeleton cards on pagination |
| `/{locale}/languages` | Language discovery page | Yes | No | Visitor | SSG or ISR | Locale configuration, public content counts where available | Supported languages, direction indicators, language links | Static render; lightweight pending state if counts load later |
| `/{locale}/languages/{languageCode}` | Language-specific discovery | Yes | No | Visitor | ISR | `GET /api/v1/articles`, `GET /api/v1/blogs` | Language header, article list, blog list, category filters | Server-render initial content; skeleton lists on filter changes |
| `/{locale}/search` | Public search page | No | No | Visitor | SSR | `GET /api/v1/search/articles`, `GET /api/v1/search/blogs`, `GET /api/v1/search/autocomplete` | Search input, result tabs, filters, article results, blog results | SSR query results; inline loading for autocomplete and result refresh |
| `/{locale}/pricing` | Public pricing and promotion package information | Yes | No | Visitor | ISR | `GET /api/v1/promotions/pricing` | Pricing tiers, promotion package comparison, account CTA | Server-render pricing; skeleton only if pricing refreshes client-side |
| `/{locale}/badges` | Public badge definitions | Yes | No | Visitor | ISR | `GET /api/v1/badges/definitions` | Badge directory, badge meanings, trust explanation | Server-render badge definitions |
| `/{locale}/about` | Product/company information | Yes | No | Visitor | SSG | None or static content source | Mission, platform explanation, public trust signals | Static render |
| `/{locale}/contact` | Public contact entry | Yes | No | Visitor | SSG or SSR | None or support entry metadata | Contact options, support direction, account CTA | Static render with simple route loading |
| `/{locale}/privacy` | Privacy policy | Yes | No | Visitor | SSG | Static legal content | Legal text, update date, navigation | Static render |
| `/{locale}/terms` | Terms of service | Yes | No | Visitor | SSG | Static legal content | Legal text, update date, navigation | Static render |

## 2. Authentication

| Route URL | Page Purpose | SEO Indexable | Authentication Required | Role Required | Strategy | API Dependencies | Primary UI Sections | Expected Loading Strategy |
|---|---|---:|---:|---|---|---|---|---|
| `/{locale}/auth/login` | User login | No | No | Visitor | SSR + CSR form | `POST /api/v1/auth/login`, `GET /api/v1/auth/me` | Login form, password reset link, registration link | Server-render shell; pending submit state |
| `/{locale}/auth/register` | New user registration | No | No | Visitor | SSR + CSR form | `POST /api/v1/auth/register` | Registration form, password requirements, login link | Server-render shell; pending submit state |
| `/{locale}/auth/forgot-password` | Request password reset | No | No | Visitor | SSR + CSR form | `POST /api/v1/auth/forgot-password` | Email form, success confirmation | Server-render shell; pending submit state |
| `/{locale}/auth/reset-password` | Complete password reset from token | No | No | Visitor | SSR + CSR form | `POST /api/v1/auth/reset-password` | Token-aware reset form, password requirements | Server-render shell; pending submit state |
| `/{locale}/auth/verify-email` | Verify email token result | No | No | Visitor | SSR + CSR action | `POST /api/v1/auth/verify-email` | Verification status, next action | Route-level pending state while token is verified |
| `/{locale}/auth/logout` | Logout transition route | No | Yes | Blogger | CSR | `POST /api/v1/auth/logout` | Logout progress, redirect status | Blocking pending state followed by redirect |
| `/{locale}/auth/session-expired` | Session expiration explanation | No | No | Visitor | SSG | None | Explanation, login action | Static render |

## 3. User Dashboard

| Route URL | Page Purpose | SEO Indexable | Authentication Required | Role Required | Strategy | API Dependencies | Primary UI Sections | Expected Loading Strategy |
|---|---|---:|---:|---|---|---|---|---|
| `/{locale}/dashboard` | Blogger dashboard overview | No | Yes | Blogger | SSR | `GET /api/v1/auth/me`, `GET /api/v1/users/:id/blogs`, `GET /api/v1/notifications/unread-count`, `GET /api/v1/wallet` | Summary cards, setup tasks, recent activity, notifications, wallet snapshot | Protected layout loading; skeleton dashboard cards |
| `/{locale}/dashboard/profile` | Profile management | No | Yes | Blogger | SSR + CSR form | `GET /api/v1/auth/me`, `PATCH /api/v1/users/:id` | Profile form, account details, save status | Server-render current data; pending form state |
| `/{locale}/dashboard/preferences` | User preferences | No | Yes | Blogger | SSR + CSR form | `GET /api/v1/users/:id/preferences`, `PATCH /api/v1/users/:id/preferences` | Language preferences, notification preferences, display settings | Server-render preferences; pending save state |
| `/{locale}/dashboard/blogs` | Manage owned blogs | No | Yes | Blogger | SSR | `GET /api/v1/users/:id/blogs` | Blog cards, status filters, register blog action | Skeleton blog cards |
| `/{locale}/dashboard/blogs/new` | Register a new blog | No | Yes | Blogger | SSR + CSR form | `POST /api/v1/blogs` | Blog registration form, feed guidance, next steps | Form pending state |
| `/{locale}/dashboard/blogs/{blogId}` | Manage a single blog | No | Yes | Blogger | SSR | `GET /api/v1/blogs/:slug` or owner API equivalent, `GET /api/v1/blogs/:id/feed`, `GET /api/v1/blogs/:id/badges` | Blog summary, verification status, feed status, actions | Skeleton status panels |
| `/{locale}/dashboard/blogs/{blogId}/edit` | Edit blog details | No | Yes | Blogger | SSR + CSR form | `PATCH /api/v1/blogs/:id` | Edit form, metadata, save controls | Server-render current values; pending save state |
| `/{locale}/dashboard/blogs/{blogId}/verification` | Ownership verification workflow | No | Yes | Blogger | SSR + CSR actions | `POST /api/v1/blogs/:id/verification`, `GET /api/v1/blogs/:id/verification/:verificationId`, `POST /api/v1/blogs/:id/verification/:verificationId/retry` | Verification methods, token/instruction panel, status, retry action | Skeleton status; pending action states |
| `/{locale}/dashboard/blogs/{blogId}/feed` | RSS feed management | No | Yes | Blogger | SSR + CSR form/actions | `GET /api/v1/blogs/:id/feed`, `POST /api/v1/blogs/:id/feed`, `PATCH /api/v1/blogs/:id/feed`, `DELETE /api/v1/blogs/:id/feed` | Feed URL, health status, sync actions, disconnect action | Skeleton feed panel; pending mutation states |
| `/{locale}/dashboard/blogs/{blogId}/feed/logs` | RSS fetch history | No | Yes | Blogger | SSR | `GET /api/v1/blogs/:id/feed/logs` | Log table, filters, status details | Table skeleton rows |
| `/{locale}/dashboard/blogs/{blogId}/articles` | Manage imported articles for a blog | No | Yes | Blogger | SSR | `GET /api/v1/blogs/:id/articles`, `DELETE /api/v1/articles/:id` | Article table/list, filters, delete action | Table/card skeletons; pending row actions |
| `/{locale}/dashboard/sessions` | Session management | No | Yes | Blogger | SSR + CSR actions | Session endpoints documented by auth/session backend, `POST /api/v1/auth/logout-all` | Active sessions, revoke controls, logout-all action | Skeleton session list; pending revoke state |
| `/{locale}/dashboard/delete-account` | Account deletion flow | No | Yes | Blogger | SSR + CSR confirmation | `DELETE /api/v1/users/:id` | Warning, confirmation, final action | Blocking pending state for destructive action |

## 4. Founder Program

| Route URL | Page Purpose | SEO Indexable | Authentication Required | Role Required | Strategy | API Dependencies | Primary UI Sections | Expected Loading Strategy |
|---|---|---:|---:|---|---|---|---|---|
| `/{locale}/founder` | Public founder program information | Yes | No | Visitor | ISR | Founder program public endpoint where exposed | Program value, availability, eligibility, CTA | Server-render public content; skeleton availability if dynamic |
| `/{locale}/dashboard/founder` | Founder status and claim entry | No | Yes | Blogger | SSR | Founder status endpoints where exposed | Current founder status, seat availability, claim/upgrade action | Skeleton status card |
| `/{locale}/dashboard/founder/claim` | Claim founder seat | No | Yes | Blogger | SSR + CSR action | Founder claim endpoint where exposed | Claim summary, eligibility, confirmation | Pending claim state |
| `/{locale}/dashboard/founder/upgrade` | Founder upgrade flow | No | Yes | Blogger | SSR + CSR action | Founder upgrade endpoint where exposed | Upgrade options, price difference, confirmation | Pending upgrade state |

## 5. Subscription Management

| Route URL | Page Purpose | SEO Indexable | Authentication Required | Role Required | Strategy | API Dependencies | Primary UI Sections | Expected Loading Strategy |
|---|---|---:|---:|---|---|---|---|---|
| `/{locale}/dashboard/subscription` | Current subscription overview | No | Yes | Blogger | SSR | Subscription endpoints where exposed, `GET /api/v1/promotions/pricing` | Current plan, feature access, renewal state, upgrade action | Skeleton subscription card |
| `/{locale}/dashboard/subscription/plans` | Compare available plans | No | Yes | Blogger | SSR | Plan endpoints where exposed | Plan comparison, feature matrix, select action | Server-render plans; pending selection state |
| `/{locale}/dashboard/subscription/checkout` | Subscription checkout handoff | No | Yes | Blogger | SSR + CSR action | Payment checkout endpoint where exposed, `POST /api/v1/payments/checkout` | Selected plan, billing summary, Stripe handoff | Blocking pending state during checkout session creation |
| `/{locale}/dashboard/subscription/success` | Subscription payment success return | No | Yes | Blogger | SSR | Payment/subscription status endpoints where exposed | Success confirmation, active plan, next action | Server validation loading state |
| `/{locale}/dashboard/subscription/cancel` | Subscription cancellation flow | No | Yes | Blogger | SSR + CSR confirmation | Subscription cancellation endpoint where exposed | Cancellation impact, confirmation, alternatives | Pending confirmation state |

## 6. Wallet

| Route URL | Page Purpose | SEO Indexable | Authentication Required | Role Required | Strategy | API Dependencies | Primary UI Sections | Expected Loading Strategy |
|---|---|---:|---:|---|---|---|---|---|
| `/{locale}/dashboard/wallet` | Wallet overview | No | Yes | Blogger | SSR | `GET /api/v1/wallet`, `GET /api/v1/wallet/transactions` | Balance, purchased/bonus credit summary, recent transactions | Skeleton balance and transaction rows |
| `/{locale}/dashboard/wallet/transactions` | Transaction history | No | Yes | Blogger | SSR | `GET /api/v1/wallet/transactions` | Transaction table, filters, pagination | Table skeleton rows |
| `/{locale}/dashboard/wallet/statement` | Wallet statement download/preview | No | Yes | Blogger | SSR + CSR action | `GET /api/v1/wallet/statement` | Statement filters, preview, download action | Pending download state |
| `/{locale}/dashboard/payments` | Payment history | No | Yes | Blogger | SSR | `GET /api/v1/payments/history` | Payment table, status filters, receipt links where available | Table skeleton rows |
| `/{locale}/dashboard/payments/checkout` | Wallet or credit checkout handoff | No | Yes | Blogger | SSR + CSR action | `POST /api/v1/payments/checkout` | Purchase summary, Stripe handoff, terms | Blocking pending state during checkout creation |
| `/{locale}/dashboard/payments/success` | Payment success return | No | Yes | Blogger | SSR | `GET /api/v1/payments/history`, `GET /api/v1/wallet` | Payment confirmation, updated wallet balance, next action | Server validation loading state |
| `/{locale}/dashboard/payments/cancelled` | Payment cancellation return | No | Yes | Blogger | SSR | `GET /api/v1/wallet` | Cancellation explanation, retry action, wallet state | Server-render wallet state; minimal loading |

## 7. Promotions

| Route URL | Page Purpose | SEO Indexable | Authentication Required | Role Required | Strategy | API Dependencies | Primary UI Sections | Expected Loading Strategy |
|---|---|---:|---:|---|---|---|---|---|
| `/{locale}/dashboard/promotions` | Promotion campaign overview | No | Yes | Blogger | SSR | Promotion campaign endpoints, `GET /api/v1/wallet` | Campaign list, status filters, wallet summary, create action | Skeleton campaign cards/table |
| `/{locale}/dashboard/promotions/new` | Create promotion campaign | No | Yes | Blogger | SSR + CSR form | `GET /api/v1/promotions/pricing`, `GET /api/v1/users/:id/blogs`, `POST /api/v1/promotions/campaigns` | Package selection, blog selection, budget/duration, confirmation | Server-render options; pending create state |
| `/{locale}/dashboard/promotions/{campaignId}` | Campaign detail | No | Yes | Blogger | SSR | `GET /api/v1/promotions/campaigns/:id` | Campaign status, performance, budget, timeline, actions | Skeleton detail panels |
| `/{locale}/dashboard/promotions/{campaignId}/cancel` | Campaign cancellation | No | Yes | Blogger | SSR + CSR confirmation | `POST /api/v1/promotions/campaigns/:id/cancel` | Cancellation warning, campaign summary, confirmation | Pending cancellation state |
| `/{locale}/blogs/{blogSlug}/promotions` | Public promotions for a blog | Yes | No | Visitor | ISR | `GET /api/v1/blogs/:id/promotions` | Blog context, promoted campaigns, disclosure labels | Server-render promotion list |

## 8. Notifications

| Route URL | Page Purpose | SEO Indexable | Authentication Required | Role Required | Strategy | API Dependencies | Primary UI Sections | Expected Loading Strategy |
|---|---|---:|---:|---|---|---|---|---|
| `/{locale}/dashboard/notifications` | Notification inbox | No | Yes | Blogger | SSR | `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count` | Notification list, filters, unread count, bulk action | Skeleton notification rows |
| `/{locale}/dashboard/notifications/{notificationId}` | Notification detail where applicable | No | Yes | Blogger | SSR | `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read` | Notification detail, related entity link, read state | Skeleton detail panel; pending mark-read state |
| `/{locale}/dashboard/notifications/settings` | Notification preferences | No | Yes | Blogger | SSR + CSR form | `GET /api/v1/users/:id/preferences`, `PATCH /api/v1/users/:id/preferences` | Channel preferences, event preferences, save action | Server-render preferences; pending save state |

## 9. Support

| Route URL | Page Purpose | SEO Indexable | Authentication Required | Role Required | Strategy | API Dependencies | Primary UI Sections | Expected Loading Strategy |
|---|---|---:|---:|---|---|---|---|---|
| `/{locale}/support` | Public support landing | Yes | No | Visitor | SSG or ISR | Static support content | Help entry points, login/register prompt, contact guidance | Static render |
| `/{locale}/dashboard/support` | User support ticket list | No | Yes | Blogger | SSR | `GET /api/v1/support/tickets` | Ticket list, status filters, create ticket action | Skeleton ticket rows/cards |
| `/{locale}/dashboard/support/new` | Create support ticket | No | Yes | Blogger | SSR + CSR form | `POST /api/v1/support/tickets` | Ticket form, category, description, submit action | Pending submit state |
| `/{locale}/dashboard/support/{ticketId}` | Support ticket detail | No | Yes | Blogger | SSR + CSR reply | `GET /api/v1/support/tickets/:id`, support reply endpoint where exposed | Conversation, status, reply form | Skeleton conversation; pending reply state |

## 10. Admin Panel

| Route URL | Page Purpose | SEO Indexable | Authentication Required | Role Required | Strategy | API Dependencies | Primary UI Sections | Expected Loading Strategy |
|---|---|---:|---:|---|---|---|---|---|
| `/{locale}/admin` | Admin dashboard overview | No | Yes | Admin | SSR | `GET /api/v1/admin/dashboard/stats` | Platform stats, moderation queues, operational summaries | Protected layout loading; metric skeletons |
| `/{locale}/admin/users` | User administration | No | Yes | Admin | SSR | `GET /api/v1/admin/users` | User table, search, filters, row actions | Table skeleton rows |
| `/{locale}/admin/users/{userId}` | User admin detail | No | Yes | Admin | SSR | `GET /api/v1/users/:id`, admin related endpoints | Profile summary, blogs, status, admin actions | Skeleton detail panels |
| `/{locale}/admin/users/{userId}/suspend` | Suspend user confirmation | No | Yes | Admin | SSR + CSR confirmation | `POST /api/v1/admin/users/:id/suspend` | User summary, impact warning, confirmation | Pending destructive action state |
| `/{locale}/admin/blogs` | Blog administration | No | Yes | Admin | SSR | `GET /api/v1/admin/blogs` | Blog table, filters, verification status, row actions | Table skeleton rows |
| `/{locale}/admin/blogs/{blogId}` | Blog admin detail | No | Yes | Admin | SSR | Admin blog endpoints, `GET /api/v1/blogs/:id/feed/logs` where applicable | Blog summary, owner, feed, verification, moderation actions | Skeleton detail panels |
| `/{locale}/admin/blogs/{blogId}/verify` | Admin verification override | No | Yes | Admin | SSR + CSR confirmation | `POST /api/v1/admin/blogs/:id/verify` | Verification context, override warning, confirmation | Pending confirmation state |
| `/{locale}/admin/articles` | Article moderation | No | Yes | Admin | SSR | `GET /api/v1/articles` with admin filters where supported | Article table, filters, delete/restore actions | Table skeleton rows |
| `/{locale}/admin/categories` | Category management | No | Yes | Admin | SSR | `GET /api/v1/categories`, admin category endpoints | Category table, translations, create action | Table skeleton rows |
| `/{locale}/admin/categories/new` | Create category | No | Yes | Admin | SSR + CSR form | `POST /api/v1/admin/categories` | Category form, translation fields, save action | Pending form state |
| `/{locale}/admin/categories/{categoryId}/edit` | Edit category | No | Yes | Admin | SSR + CSR form | `PATCH /api/v1/admin/categories/:id`, `POST /api/v1/admin/categories/:id/translations` | Category edit form, translations, status | Server-render values; pending save state |
| `/{locale}/admin/badges` | Badge definition and assignment management | No | Yes | Admin | SSR | Admin badge endpoints, `GET /api/v1/badges/definitions` | Badge definitions, assignment tools, revoke actions | Table/list skeletons |
| `/{locale}/admin/badges/new` | Create badge definition | No | Yes | Admin | SSR + CSR form | `POST /api/v1/admin/badges/definitions` | Badge form, visual meaning, save action | Pending form state |
| `/{locale}/admin/badges/assign` | Assign badge | No | Yes | Admin | SSR + CSR form | `POST /api/v1/admin/badges/assign`, admin blog lookup endpoint | Blog selector, badge selector, confirmation | Pending assign state |
| `/{locale}/admin/promotions` | Promotion campaign administration | No | Yes | Admin | SSR | Promotion admin endpoints where exposed | Campaign table, filters, status, moderation actions | Table skeleton rows |
| `/{locale}/admin/subscriptions` | Subscription administration | No | Yes | Admin | SSR | Admin subscription endpoints | Subscription table, filters, extension actions | Table skeleton rows |
| `/{locale}/admin/plans` | Plan administration | No | Yes | Admin | SSR | Plan admin endpoints | Plan table, pricing, feature matrix | Table skeleton rows |
| `/{locale}/admin/feature-flags` | Feature flag management | No | Yes | Admin | SSR + CSR actions | `GET /api/v1/admin/feature-flags`, `PATCH /api/v1/admin/feature-flags/:key` | Flag table, status, toggle actions | Table skeleton; pending toggle state |
| `/{locale}/admin/config` | System config management | No | Yes | Super Admin | SSR + CSR actions | `GET /api/v1/admin/config`, `PUT /api/v1/admin/config/:key` | Config table, edit controls, audit warning | Table skeleton; pending save state |
| `/{locale}/admin/audit-logs` | Audit log review | No | Yes | Admin | SSR | `GET /api/v1/admin/audit-logs` | Audit table, filters, date range, actor/entity search | Table skeleton rows |
| `/{locale}/admin/support` | Admin support ticket oversight | No | Yes | Admin | SSR | Support admin endpoints where exposed | Ticket table, status filters, assignment where available | Table skeleton rows |
| `/{locale}/admin/founder` | Founder program administration | No | Yes | Admin | SSR | Founder admin endpoints where exposed | Program status, seats, claims, controls | Skeleton status panels |
| `/{locale}/admin/health` | Operational health overview | No | Yes | Admin | SSR | `GET /api/v1/health`, `GET /api/v1/health/ready`, `GET /api/v1/health/live` | Health cards, readiness, liveness, dependency status | Skeleton health cards |

## Language-Aware Routing

Language-aware routing rules:

- All public, auth, dashboard, founder, subscription, wallet, promotion, notification, support, and admin pages use `/{locale}` as the first path segment.
- Unknown locales resolve to the localized 404 strategy.
- Locale switchers preserve the current route intent when an equivalent localized route exists.
- Canonical URLs include the active locale when the localized route is indexable.
- `hreflang` alternates are emitted for public indexable routes where equivalent localized content exists.
- Auth redirects preserve locale and return path.
- Dashboard and admin routes preserve locale after login, refresh, and logout flows.

Locale-sensitive URL state:

- Pagination, filters, search terms, and tab state that affect page meaning remain in query parameters.
- Locale is never represented only in cookies or client state for user-facing routes.

## RTL/LTR Handling

Direction handling rules:

- Direction is derived from locale.
- The root layout for `/{locale}` applies the correct `dir` value.
- Public, dashboard, and admin layouts inherit direction from the locale layout.
- Directional navigation, breadcrumbs, pagination, icons, and disclosure controls mirror in RTL.
- Mixed technical values such as URLs, email addresses, verification tokens, IDs, and code-like strings remain readable using content-appropriate direction handling.
- Route transitions do not change direction until the target locale is resolved.

RTL/LTR QA must cover:

- Public article and blog cards.
- Dashboard forms and tables.
- Admin tables and row actions.
- Payment and promotion confirmation flows.
- Notification and support message layouts.

## Error Routes

| Route URL | Page Purpose | SEO Indexable | Authentication Required | Role Required | Strategy | API Dependencies | Primary UI Sections | Expected Loading Strategy |
|---|---|---:|---:|---|---|---|---|---|
| `/{locale}/not-found` | Localized not found page | No | No | Visitor | SSG | None | Error message, public navigation, search link | Static render |
| `/{locale}/error` | Localized generic error page | No | No | Visitor | SSR | None | Error explanation, retry action, home link | Route-level fallback |
| `/{locale}/access-denied` | Permission failure page | No | No | Visitor | SSR | `GET /api/v1/auth/me` when session exists | Access explanation, login or dashboard link | Server-render shell |
| `/{locale}/offline` | Offline fallback page | No | No | Visitor | SSG | None | Offline explanation, retry guidance, cached content link where applicable | Static PWA fallback |
| `/{locale}/session-expired` | Expired session page | No | No | Visitor | SSG | None | Session explanation, login action | Static render |

## 404 Strategy

404 handling:

- Missing localized public entities render the localized not-found route with `noindex`.
- Missing dashboard or admin entities render a protected not-found state after authentication and authorization checks.
- Unknown locales render a locale-aware not-found experience or redirect to default locale according to product policy.
- Soft-deleted public entities should return not found unless the authenticated admin context explicitly requests deleted records.
- Search pages with zero results are not 404s; they render an empty result state.
- Filtered listing pages with no results are not 404s; they render a filtered empty state with reset options.

## Maintenance Mode Route

| Route URL | Page Purpose | SEO Indexable | Authentication Required | Role Required | Strategy | API Dependencies | Primary UI Sections | Expected Loading Strategy |
|---|---|---:|---:|---|---|---|---|---|
| `/{locale}/maintenance` | Planned or emergency maintenance notice | No | No | Visitor | SSG or SSR | `GET /api/v1/health` where available | Maintenance message, status, retry guidance | Static or health-aware render |

Maintenance mode rules:

- Public, auth, dashboard, and admin routes may redirect or rewrite to maintenance mode based on deployment configuration.
- Health and PWA technical routes should remain available where operationally required.
- Maintenance pages must be localized and direction-aware.
- Maintenance pages must not expose internal incident details.

## PWA Routes

| Route URL | Page Purpose | SEO Indexable | Authentication Required | Role Required | Strategy | API Dependencies | Primary UI Sections | Expected Loading Strategy |
|---|---|---:|---:|---|---|---|---|---|
| `/manifest.json` | Web app manifest | No | No | Visitor | Static | None | PWA metadata, icons, display configuration | Static asset response |
| `/sw.js` | Service worker | No | No | Visitor | Static | None | Runtime caching and offline behavior | Static asset response |
| `/icons/*` | PWA icons and install assets | No | No | Visitor | Static | None | Icons, splash-ready assets | Browser asset loading |
| `/{locale}/offline` | Localized offline fallback | No | No | Visitor | SSG | None | Offline explanation, retry action | Static fallback |

PWA route rules:

- PWA technical routes stay root-level when required by browser conventions.
- Offline fallback is localized when navigated directly or served by the service worker with known locale context.
- Authenticated dashboard, wallet, payment, support, and admin API responses must not be cached for cross-session reuse.
- Public cached pages must not claim freshness beyond their cache policy.

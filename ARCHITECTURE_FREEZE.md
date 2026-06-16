# Architecture Freeze — MillionBlogs Backend

**Date:** 2026-06-16
**Scope:** All 12 phases, 34 NestJS modules, 35+ Prisma models, ~400 source files

---

## Scoring Summary

| Dimension | Score (0–10) | Interpretation |
|-----------|:------------:|----------------|
| **Architecture** | **7.5** | Well-modularized with clear layer separation. Some boundary violations and Global-module coupling. |
| **Maintainability** | **6.5** | Consistent patterns but raw SQL in repositories, direct `['prisma']` access, and no base abstractions increase cognitive load. |
| **Scalability** | **5.5** | In-process event bus, in-memory rotation engine, sequential subscription renewal, and view-count write-per-request are hard limits. |
| **Technical Debt** | **4.5** | 30 performance findings, 22 security findings, broken debit() call, fragile parameter indexing, unused version field, hold-without-lock. |

**Composite Health: 6.0 / 10** — Functional and well-organized for current scale, but several architectural decisions will break at 10× growth.

---

## 1. Module Boundaries & Dependency Graph

### 1.1 Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  API Layer (Controllers)                                     │
│  Public · User (account-scoped) · Admin · Webhook            │
├─────────────────────────────────────────────────────────────┤
│  Application Layer (Services)                                 │
│  Blog · RSS · Articles · Search · SEO · Promotions · Badges  │
│  Notifications · Support · Payments · Subscriptions · Founder │
├─────────────────────────────────────────────────────────────┤
│  Domain Layer (Services + FeatureAccess)                      │
│  Wallet · Plans · FeatureAccessService · Roles                │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer (Repositories + Global Modules)         │
│  Prisma · EventBus · Config · Security · Audit · Jobs · etc.  │
└─────────────────────────────────────────────────────────────┘
```

**Layering is largely correct.** Application modules depend on domain modules, never the reverse. Infrastructure is globally available. The dependency graph is a DAG with one exception:

### 1.2 Critical: FeatureAccessModule Creates a Quasi-Circular Dependency

```
FeatureAccessModule (GLOBAL)
  ├─ imports: FounderModule, SubscriptionsModule, PlansModule
  │
  ├─ PromotionsModule
  │   └─ imports: FeatureAccessModule ← Legal (app → domain)
  │
  └─ If FounderModule or SubscriptionsModule ever needs FeatureAccessService
     → CIRCULAR DEPENDENCY (module → global → module)
```

**Risk:** FeatureAccessModule is `@Global()` and imports three application modules. Any of those modules that later needs feature access resolution creates a circular `require`. The global scope also means `FeatureAccessService` is resolved before all its imported modules are fully initialized, which can cause `undefined` provider errors during testing.

**Recommendation:** Remove `@Global()` from `FeatureAccessModule`. Make it a regular module that other modules explicitly import. This forces explicit dependency declarations and eliminates the circular risk.

### 1.3 AuthModule Exports JwtModule — Unnecessary Leak

`AuthModule` exports `JwtModule` (line 35 of `auth.module.ts`). No other module should be signing or verifying JWTs directly — all token operations should go through `AuthService`. This leak means any module importing `AuthModule` can bypass the auth layer.

### 1.4 Global Module Count Is High (5 modules)

| Module | Reason | Risk |
|--------|--------|------|
| PrismaModule | Needs to be everywhere | Acceptable |
| EventBusModule | Events flow everywhere | Acceptable |
| SecurityModule | Guards, throttling | Acceptable |
| RolesModule | APP_GUARD global | Acceptable |
| FeatureAccessModule | Resolution service | **Unnecessary** — see 1.2 |

---

## 2. Event Design

### 2.1 In-Process Event Bus — No Persistence, No Guaranteed Delivery

**Affected:** `src/events/domain-event.publisher.ts`, `src/events/event-bus.module.ts`

Events use `EventEmitter2` (in-process). This means:

| Concern | Impact |
|---------|--------|
| **Durability** | Events lost if the process crashes between `publish()` and subscriber execution |
| **Delivery Guarantee** | `ignoreErrors: true` — if a subscriber throws, the error is silent. No retry |
| **Ordering** | No ordering guarantees across subscribers |
| **Observability** | No event log/trail for debugging or replay |
| **Cross-Process** | Does not work with multiple instances |

**80+ event publish() calls** across 20 services, but most events have zero subscribers — they're fire-and-forget audit traces. This is acceptable for audit/analytics but dangerous for critical operations (payment completed, seat claimed).

### 2.2 No Outbox Pattern

There's no transactional outbox — events are emitted AFTER database operations in the same transaction context only for wallet operations. Most services publish events outside of transactions, creating a window where:
- The DB operation succeeds but the event fails to publish → inconsistent state
- A crash between DB write and event publish → event is lost forever

### 2.3 Event Payloads Include Sensitive Data

`PASSWORD_RESET_REQUESTED` event includes the raw `token` in its payload (line 229 of `auth.service.ts`). Any subscriber (or log) that captures this payload gets a valid password reset token.

### 2.4 No Event Schema Versioning

Events are plain `Record<string, unknown>` payloads with no version field. Future changes to event structure will break existing subscribers without any detection mechanism.

---

## 3. Repository Design

### 3.1 Inconsistent Data Access Patterns

Three patterns coexist, creating cognitive overhead:

| Pattern | Used In | Issue |
|---------|---------|-------|
| Prisma ORM | Most repositories | Standard, type-safe |
| Raw SQL via `$queryRawUnsafe` | `SearchRepository` | Bypasses Prisma type safety, fragile parameter binding |
| Direct `['prisma']` access | `AuthService` accessing `sessionsRepository['prisma']` | **Encapsulation violation** — reaches into another module's private member |

### 3.2 Private Member Access Violation

```typescript
// src/auth/auth.service.ts:216
await this.sessionsRepository['prisma'].passwordReset.create({...});
// src/auth/auth.service.ts:235
const resetRecord = await this.sessionsRepository['prisma'].passwordReset.findUnique({...});
```

`AuthService` accesses `SessionsRepository`'s private `prisma` field via bracket notation. This breaks encapsulation and couples auth logic to the internal implementation of sessions. If `SessionsRepository` ever renames or removes that field, auth silently breaks.

**Fix:** Move password reset operations to their own repository or expose them via `SessionsRepository`.

### 3.3 No Base Repository Abstraction

15+ repositories all duplicate the same pagination pattern:

```typescript
const [items, total] = await Promise.all([
  this.prisma.x.findMany({ where, skip, take, orderBy, include }),
  this.prisma.x.count({ where }),
]);
return { items, total, page, pageSize };
```

A base `PaginatedRepository` or mixin would eliminate 200+ lines of duplicate code and ensure consistent cursor pagination migration (see P-25 in PERFORMANCE_AUDIT.md).

---

## 4. Service Design

### 4.1 Service ↔ Repository Coupling Is Correct

Every service depends on its own repository (good). No service directly accesses another module's repository except through the owning module's exports.

### 4.2 No CQRS / Command-Query Separation

All services mix reads and writes in the same methods. For example, `ArticlesService.findById()` returns a DTO while `ArticlesService.create()` both writes and emits events. This makes event sourcing or read-model separation difficult to introduce later.

### 4.3 FeatureAccessService Is Called Per-Request With No Cache

`resolve()` queries three separate tables (founder_seats, user_subscriptions, plans) on every invocation. For high-frequency endpoints (article list, search results, rotation), this adds 3 queries to every request. A per-user in-memory cache with TTL or invalidation-on-change would dramatically reduce database load.

### 4.4 No Rate Limiting on Business Operations

While the `ThrottlerGuard` provides HTTP-level rate limiting, there's no business-level rate limiting for expensive operations:
- Search queries (expensive FTS queries)
- Feed sync (slow network calls)
- Campaign creation (wallet debit + campaign write)

---

## 5. API Design

### 5.1 Three-Tier Controller Pattern — Well Executed

| Tier | Prefix | Auth | Purpose |
|------|--------|------|---------|
| Public | `/api/...` | Optional | Read-only, SEO, unauthenticated access |
| User | `/api/account/...` | JWT required | User's own resources |
| Admin | `/api/admin/...` | JWT + Roles | Platform administration |

This is a clean pattern that separates concerns clearly. Every module follows it consistently.

### 5.2 Inconsistency: Some Admin Controllers Lack `@Roles()` (Recently Fixed)

The security audit (C-01) identified 6 admin controllers missing role checks. This has been fixed but the fact it existed indicates the pattern wasn't enforced at the framework level.

### 5.3 Webhook Controller Is Correct

`StripeWebhookController` has no auth guard (correct — it uses Stripe signature verification). The raw body is passed through, which is required for Stripe webhook verification.

### 5.4 No API Versioning

All routes are unversioned (`/api/promotions/...`, `/api/wallet/...`). Breaking changes require coordinated frontend deployment. Add `/api/v1/` prefix for future-proofing.

---

## 6. Database Design

### 6.1 Schema Quality — Mostly Good

**Strengths:**
- UUID primary keys throughout (distributed-friendly)
- Consistent soft-delete pattern (`deletedAt`)
- Proper use of `@map` for snake_case column naming
- Unique constraints on business keys (`slug`, `email`, etc.)
- JSONB for flexible metadata fields
- Composite unique constraints on join tables (`@@unique([blogId, categoryId])`)

**Weaknesses:**
- 12 missing compound indexes (see P-01 through P-12 in PERFORMANCE_AUDIT.md)
- No partial indexes on soft-delete filters (`WHERE deleted_at IS NULL`)
- `RssFeed.url` has no unique constraint (duplicate feeds possible)
- `Article.slug` is not unique per blog (duplicate slugs possible)
- `BruteForceAttempt` has no compound index for time-window lookups

### 6.2 No Database-Level Archival Strategy

High-volume tables have no retention policy:
- `AuditLog` — unbounded growth
- `SearchAnalytics` — unbounded growth
- `Notification` — soft-deleted but never purged
- `RssFeedLog` — one row per sync, grows with every sync cycle

### 6.3 Strong Points

- **Optimistic locking on Wallet** (`version` column) — correct
- **Idempotency keys** on `WalletTransaction` and `Payment` — correct
- **`@@unique([feedId, guid])`** and **`@@unique([feedId, urlHash])`** — correct dedup constraints
- **GIN indexes on tsvector columns** — correct for FTS

---

## 7. Feature Access System

### 7.1 Design Quality

The `FeatureAccessService` is a well-designed single source of truth with clear resolution order:

```
Founder Seat → Active Subscription → Free Tier
```

**Strengths:**
- Simple, predictable resolution logic
- Clean `FeatureAccess` interface
- `hasAccess()` convenience method for quick checks
- No circular logic (each tier is mutually exclusive)

**Weaknesses:**
- `@Global()` module (see 1.2)
- No caching — 3 DB queries per resolution
- No invalidation hook when founder/subscription changes
- `any` typing on plan objects (`plans.find((p: any) => ...)`)
- Hardcoded free-tier features in service instead of DB-driven

### 7.2 Feature String Matching — Fragile

```typescript
if (!access.features.includes('promotions')) {
```

Feature checks use string matching. A typo (`'promotion'` vs `'promotions'`) silently grants or denies access. No enum or type-safe feature key system exists.

---

## 8. Promotion System

### 8.1 Architecture Score: 6/10

**Strengths:**
- Clean separation: packages, campaigns, rotation
- Proper dependency on WalletModule for credit operations
- FeatureAccess integration added
- Event emission for key lifecycle transitions

**Weaknesses:**
- Rotation engine does all computation in-memory (see P-19)
- CTR calculation via `$raw` inside Prisma `update.data` — likely evaluates to string literal, not SQL expression
- `recordAnalytics()` increments counter via parallel Promise (race condition on concurrent impressions) instead of atomic increment
- No campaign budget enforcement at rotation time (spent credits can exceed budget)
- Promotion analytics table has no `campaignId + type` compound index

---

## 9. Wallet System

### 9.1 Architecture Score: 7.5/10

**Strengths:**
- Optimistic locking with `version` column on all balance-changing operations
- `$transaction` wrapping for atomic credit/debit
- Idempotency keys prevent double-processing
- Full audit trail via WalletTransaction (immutable ledger)
- Separate `purchasedBalance` and `bonusBalance` tracking

**Weaknesses:**
- `hold()`/`release()` do not modify balance (security audit L-06)
- `getWalletWithLock()` does not actually lock (misleading method name)
- No `$transaction` wrapping in `hold()`, `refund()`, or `release()` (outside the ones that use `prisma.$transaction`)
- No balance reclamation for expired holds

---

## 10. Founder System

### 10.1 Architecture Score: 8/10

**Strengths:**
- Simple, focused module with clear responsibilities
- Atomic seat allocation prevents overselling
- Event emission for key transitions
- Clean upgrade path with price difference tracking
- Auto-close when seats are exhausted

**Weaknesses:**
- `version` field on `FounderSeat` is defined but never used (security audit M-03)
- No refund/revocation mechanism (may be intentional)
- `seedPrograms()` is idempotent only at the application level (no `onConflict`)

---

## 11. Search System

### 11.1 Architecture Score: 5/10

**Strengths:**
- PostgreSQL FTS with GIN indexes — good for the constraint of no external search engines
- Weighted ranking (title = A, excerpt = B)
- Combined blog + article results
- Search analytics tracking

**Weaknesses:**
- **Critical:** Parameter index mismatch in raw SQL (P-16) — can return wrong results
- English-only FTS — non-English content gets poor ranking
- In-memory result merging — no limit on items loaded into memory
- No fuzzy search / typo tolerance
- No stemming for non-English languages
- `LIKE '%term%'` fallback in `articles.repository.ts` cannot use indexes
- Raw SQL in repository instead of Prisma ORM — two data access patterns

---

## 12. SEO System

### 12.1 Architecture Score: 7/10

**Strengths:**
- Well-modularized into focused services (Sitemap, Robots, Canonical, Hreflang, Metadata, StructuredData)
- Clear separation of concerns

**Weaknesses:**
- No sitemap caching — regenerated on every request, expensive at scale
- No incremental sitemap updates — full rebuild on every change
- No CDN integration for SEO assets (sitemaps, robots.txt)
- No cache headers on SEO endpoints

---

## 13. Architecture Decisions to Formalize

### 13.1 Currently Implicit (Must Be Explicit)

| Decision | Current State | Recommendation |
|----------|---------------|----------------|
| Event durability | No persistence | Document fire-and-forget vs. required delivery. Add outbox pattern for critical events. |
| Transaction boundaries | Inconsistent | Every service that combines DB writes + event publishes must wrap in `$transaction`. |
| Pagination strategy | Offset-based | Document that cursor pagination will replace offset at 100K rows. |
| Cache strategy | None | Add TTL-based caching for FeatureAccess, SEO, and rotation results. |
| Multi-language FTS | English-only | Document language mapping and trigger update plan. |
| Admin access control | `@Roles()` per controller | Move to a global admin guard that checks `admin/*` prefix automatically. |

### 13.2 Missing Architecture Docs

| Topic | Should Document |
|-------|----------------|
| Event catalog | Which events have subscribers, delivery guarantees, retry strategy |
| Scaling limits | Maximum feeds, campaigns, articles, users per instance |
| Backup/DR strategy | RPO, RTO, backup validation process |
| Rate limiting per endpoint | Which endpoints have what limits, burst allowance |
| Data retention | TTL for audit logs, search analytics, notifications |

---

## 14. Architecture Weaknesses — Ranked

| # | Weakness | Impact | Effort to Fix |
|---|----------|--------|:-------------:|
| 1 | In-process event bus with `ignoreErrors: true` | Event loss, silent failures | High |
| 2 | FeatureAccessModule is `@Global()` | Circular dependency risk | Low |
| 3 | Raw SQL parameter index mismatch (search) | Wrong query results | Medium |
| 4 | Private member access (`['prisma']`) | Encapsulation broken | Low |
| 5 | Hold/release doesn't lock balance | Overspend risk | Medium |
| 6 | No outbox pattern for critical events | Inconsistent state on crash | High |
| 7 | Rotation engine in-memory | Memory pressure at 10K+ campaigns | Medium |
| 8 | View count write-per-request | DB write contention | Medium |
| 9 | No caching on FeatureAccess | 3 extra queries per request | Low |
| 10 | AuthModule exports JwtModule | Unnecessary privilege leak | Low |
| 11 | English-only FTS | Poor non-English search | Medium |
| 12 | No API versioning | Breaking change coordination | Low |
| 13 | No base repository abstraction | Code duplication (200+ lines) | Medium |
| 14 | CTR expression likely broken | Analytics data incorrect | Low |
| 15 | Sitemap no caching | Full rebuild on every request | Low |

---

## 15. Recommended Fixes Before Next Feature Work

### Critical (Blocking)
1. **Fix search parameter index mismatch** (P-16) — silent data corruption
2. **Remove private `['prisma']` access** — breaks encapsulation
3. **Add transactional outbox for payments** — payment events must be durable

### High
4. **Remove `@Global()` from FeatureAccessModule** — prevent circular dependency
5. **Fix hold/release to lock balance** — prevent overspend
6. **Add base repository pagination abstraction** — reduce duplication, enable cursor migration
7. **Add FeatureAccess caching** — reduce per-request DB load
8. **Fix CTR expression** — analytics currently showing wrong data

### Medium
9. **Add 12 missing compound indexes** — query performance at scale
10. **Document event delivery guarantees** — architectural contract
11. **Add API version prefix** — future-proofing
12. **Add sitemap caching** — reduce CPU at scale
13. **Add data retention/archival** — unbounded table growth

---

## 16. Conclusion

The codebase has a **solid foundation** with consistent patterns, clear layering, and well-separated concerns. The `FeatureAccessService` as single source of truth, optimistic locking on Wallet, atomic seat allocation, and the three-tier controller pattern are all well-architected decisions.

The primary risks are:
1. **Event bus fragility** — in-process, no persistence, silent failures
2. **Performance at 10× scale** — in-memory rotation, sequential renewals, no caching
3. **Data integrity gaps** — hold without lock, CTR expression, search param mismatch
4. **Technical debt accumulation** — raw SQL, `['prisma']` access, no base abstractions

**Architecture Health: 6.0/10** — Viable for production launch but requires focused investment in event durability, caching, and query optimization before scaling.

# MillionBlogs — Backend Architecture Document

**Version:** 1.0  
**Author:** Lead Backend Software Architect  
**Status:** Draft — Pre-Implementation

---

## Table of Contents

1. [Domain Map](#1-domain-map)
2. [Module Dependency Map](#2-module-dependency-map)
3. [High-Level System Architecture](#3-high-level-system-architecture)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [Preliminary Entity Inventory](#5-preliminary-entity-inventory)
6. [Cross-Cutting Concerns](#6-cross-cutting-concerns)

---

## 1. Domain Map

Every business capability is captured as a domain. Subdomains refine bounded contexts.

### 1.1 Auth Domain

| Subdomain | Responsibility |
|---|---|
| **Authentication** | Email/password login, JWT access & refresh token issuance, token rotation, logout |
| **Authorization** | Role-based access control (RBAC), permission checks at controller guards |
| **Identity** | Password hashing (bcrypt), email verification flows, password reset flows |

*Owns:* JWT secret management, token blacklisting, login rate limiting.

### 1.2 Users Domain

| Subdomain | Responsibility |
|---|---|
| **Registration** | Sign-up flow, duplicate detection, email uniqueness, profile creation |
| **Profile** | Display name, avatar, bio, language preference, timezone |
| **Settings** | Notification preferences, privacy settings, account deletion |

*Owns:* User lifecycle, profile data, preference storage.

### 1.3 Blogs Domain

| Subdomain | Responsibility |
|---|---|
| **Registration** | Blog URL submission, metadata extraction (title, description, favicon) |
| **Verification** | Ownership proof via DNS TXT record or meta tag, verification status lifecycle |
| **Settings** | Language, categories, default excerpt length, custom branding |
| **Discovery** | Blog listing, filtering by language/category, sorted by relevance or freshness |

*Owns:* Blog lifecycle, verification state machine, blog metadata.

### 1.4 RSS Domain

| Subdomain | Responsibility |
|---|---|
| **Feed Ingestion** | Fetching RSS/Atom XML, parsing, timed retries, timeout handling |
| **Feed Health** | Dead feed detection, polling interval backoff, admin alerts for broken feeds |
| **Scheduling** | Cron-driven polling, staggered fetch windows to avoid thundering herd |
| **Deduplication** | GUID-based and URL-based duplicate detection across feeds |

*Owns:* Feed lifecycle, ingestion pipeline, feed health monitoring.

### 1.5 Articles Domain

| Subdomain | Responsibility |
|---|---|
| **Indexing** | Title, excerpt, URL, language, metadata extraction and storage |
| **Categorization** | Automatic category suggestion by keyword analysis, manual override |
| **Deduplication** | URL/ID normalization, cross-blog duplicate handling |
| **Lifecycle** | Article creation, soft-deletion, expiry/purging policy |

*Owns:* Article records, metadata enrichment pipeline.

### 1.6 Categories Domain

| Subdomain | Responsibility |
|---|---|
| **Taxonomy** | Hierarchical category tree, localized labels |
| **Assignment** | Article-to-category mapping, blog default categories |

*Owns:* Category tree, multilingual labels, assignment logic.

### 1.7 Search Domain

| Subdomain | Responsibility |
|---|---|
| **Full-Text Search** | PostgreSQL `tsvector`-based search across article title, excerpt, blog name |
| **Filtering** | Language, category, date range, promotion status filters |
| **Ranking** | Relevancy scoring (recency, language match, promotion boost) |
| **Multilingual** | Per-language search indexes, language-aware tokenization |

*Owns:* Search query building, ranking algorithms, result pagination.

### 1.8 Promotions Domain

| Subdomain | Responsibility |
|---|---|
| **Campaigns** | Promoted listing creation, duration, budget, daily spend cap |
| **Scheduling** | Start/end date management, automatic activation/deactivation |
| **Pricing** | Cost-per-day calculation, promotional tiers |

*Owns:* Campaign lifecycle, promotion scheduling, pricing tables.

### 1.9 Wallet Domain

| Subdomain | Responsibility |
|---|---|
| **Balance** | Credit balance tracking, holds, concurrent deduction safety |
| **Transactions** | Ledger of all credits/debits, purchase history, refunds |
| **Currency** | Internal credit unit, conversion display |

*Owns:* Wallet lifecycle, transaction ledger, balance integrity.

### 1.10 Payments Domain

| Subdomain | Responsibility |
|---|---|
| **Stripe Integration** | Checkout sessions, payment intents, webhook handling |
| **Invoicing** | Receipt generation, payment history |
| **Refunds** | Full/partial refund processing, wallet reversal |

*Owns:* Stripe API interaction, webhook verification, payment records.

### 1.11 Badges Domain

| Subdomain | Responsibility |
|---|---|
| **Badge Types** | Verified owner badge, early adopter badge, promotional badge definitions |
| **SVG Generation** | Server-side SVG rendering with dynamic text/colors |
| **Assignment** | Trigger-based (verification complete, first promotion, etc.) and manual |

*Owns:* Badge templates, SVG rendering pipeline, assignment rules.

### 1.12 Notifications Domain

| Subdomain | Responsibility |
|---|---|
| **In-App** | Notification inbox, read/unread status, dismissal |
| **Email** | Transactional emails (welcome, verification, payment receipt, badge awarded) |
| **Templates** | HTML email templates, i18n placeholders |

*Owns:* Notification queue, delivery channel routing, read-receipt tracking.

### 1.13 Support Domain

| Subdomain | Responsibility |
|---|---|
| **Contact** | Public contact form submission, attachment handling |
| **Tickets** | Internal ticket management, status tracking, admin assignment |

*Owns:* Ticket lifecycle, spam filtering, triage routing.

### 1.14 Admin Domain

| Subdomain | Responsibility |
|---|---|
| **User Management** | User lookup, suspension, deletion |
| **Blog Moderation** | Blog verification override, content takedown, feed restart |
| **System Config** | Feature flags, global settings, maintenance mode |
| **Analytics** | Usage dashboards, revenue reports, system health |

*Owns:* Admin authentication guard, audit log querying, panel API surface.

### 1.15 SEO Domain

| Subdomain | Responsibility |
|---|---|
| **Sitemaps** | Dynamic XML sitemap generation per language, per category |
| **Hreflang** | Alternate language link generation, canonical URL mapping |
| **Meta Tags** | Open Graph, Twitter Card, structured data (JSON-LD) rendering hints |

*Owns:* Sitemap generation, hreflang annotations, robots.txt.

### 1.16 PWA Domain

| Subdomain | Responsibility |
|---|---|
| **Manifest** | Dynamic `manifest.json` delivery with localized name/description |
| **Service Worker** | Static asset caching strategy, offline fallback page |

*Owns:* Manifest generation, SW registration endpoint hints.

### 1.17 System Domain

| Subdomain | Responsibility |
|---|---|
| **Health** | Readiness/liveness probes, dependency health (DB, Stripe API) |
| **Config** | Centralized environment configuration, runtime settings |
| **Jobs** | Background job scheduling, cron management, job retry/backoff |
| **Feature Flags** | Toggle definitions, segment targeting, gradual rollout |

*Owns:* System state, job orchestration, configuration management.

---

## 2. Module Dependency Map

Each NestJS module is a package with explicit dependency rules. Arrows indicate `imports` in NestJS module metadata.

### 2.1 Dependency Rules

```
MODULE            → ALLOWED DEPENDENCIES                     → FORBIDDEN DEPENDENCIES
──────────────────────────────────────────────────────────────────────────────────────
System            → (none)                                   → All business modules
Config            → (none)                                   → All modules
──────────────────────────────────────────────────────────────────────────────────────
Auth              → Users, Config, System                    → Blogs, RSS, Articles, Promotions, Wallet, Payments, Badges
Users             → Config, System                           → Auth, Blogs, RSS, Articles, Promotions, Wallet, Payments
──────────────────────────────────────────────────────────────────────────────────────
Blogs             → Users, Categories, Config, System        → Auth, RSS, Articles, Payments, Wallet
Categories        → Config, System                           → Auth, Users, Blogs, Articles, any other domain
──────────────────────────────────────────────────────────────────────────────────────
RSS               → Blogs, Articles, System, Config          → Auth, Users, Wallet, Payments, Promotions, Badges
Articles          → Blogs, Categories, Config, System        → Auth, Users, Wallet, Payments, RSS (Articles must not trigger ingestion)
──────────────────────────────────────────────────────────────────────────────────────
Search            → Articles, Blogs, Categories, Config      → Auth, Users, Wallet, Payments, RSS, Promotions
Promotions        → Blogs, Wallet, Config, System            → Auth, Users, RSS, Articles (read-only through Search), Payments
Wallet            → Users, Payments, Config, System          → Auth, Blogs, RSS, Articles, Promotions, Badges
──────────────────────────────────────────────────────────────────────────────────────
Payments          → Wallet, Config, System                   → Auth, Users, Blogs, RSS, Articles, Promotions (no direct coupling)
Badges            → Blogs, Config, System                    → Auth, Users, Wallet, Payments, RSS, Articles
──────────────────────────────────────────────────────────────────────────────────────
Notifications     → Users, Config, System                    → Auth, Blogs, RSS, Articles, Wallet, Payments (events only, no direct import)
Support           → Users, Config, System                    → Auth, Blogs, RSS, Articles, Wallet, Payments
──────────────────────────────────────────────────────────────────────────────────────
Admin             → All business modules (read-only on most)  → No circular: Admin may NOT be imported by any module
──────────────────────────────────────────────────────────────────────────────────────
SEO               → Articles, Blogs, Categories, Config      → Auth, Users, Wallet, Payments, Promotions
PWA               → Config, System                           → All business modules
```

### 2.2 Key Principles

1. **Strict layering**: Dependencies flow downward. Lower modules never import higher ones.
   - `System` and `Config` are the foundation — zero business dependencies.
   - `Auth`, `Users`, `Categories` are tier-1 domains.
   - `Blogs` is tier-2.
   - `RSS`, `Articles`, `Wallet`, `Badges` are tier-3.
   - `Promotions`, `Payments`, `Search`, `SEO`, `Notifications`, `Support` are tier-4.
   - `Admin` is tier-5 and must never be imported by anyone.

2. **Event-driven cross-module communication**: When a module needs to react to something in another module (e.g., Badges needs to know when a blog is verified), it uses NestJS event emitters (`@nestjs/event-emitter`) or a lightweight internal event bus. No direct imports for cross-domain reactions.

3. **No circular imports**: The compiler enforces this. If module A needs something from module B and B needs something from A, extract the shared concern into a new lower-level module or use events.

4. **Read-only access through Search**: Modules like Promotions that need article discovery data query the Search module, not Articles directly. Search exposes a clean read-only interface.

### 2.3 Visualization (ASCII)

```
  ┌─────────────────────────────────────────┐
  │                Admin                     │  ← imports ALL (read-only focus)
  └─────────────────────────────────────────┘
            ↓        ↓       ↓
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  Search   │ │    SEO   │ │ Notifications │  ← Tier 4
  └──────────┘ └──────────┘ └──────────┘
       ↓              ↓
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │Promotions│ │ Payments  │ │ Support  │ │    PWA   │  ← Tier 4
  └──────────┘ └──────────┘ └──────────┘ └──────────┘
       ↓              ↓
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │   RSS    │ │ Articles │ │  Wallet  │ │  Badges  │  ← Tier 3
  └──────────┘ └──────────┘ └──────────┘ └──────────┘
       ↓              ↓
  ┌──────────────────┐
  │      Blogs       │  ← Tier 2
  └──────────────────┘
       ↓
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │   Auth   │ │  Users   │ │Categories│  ← Tier 1
  └──────────┘ └──────────┘ └──────────┘
       ↓              ↓
  ┌──────────────────┐ ┌──────────────────┐
  │      Config      │ │      System      │  ← Foundation
  └──────────────────┘ └──────────────────┘
```

---

## 3. High-Level System Architecture

### 3.1 Layer Diagram

```
  ┌─────────────────────────────────────────────────────────────┐
  │                    PUBLIC API LAYER                         │
  │  Controllers · Guards · Interceptors · Filters · DTOs       │
  │  Validation (class-validator) · Serialization (class-transformer) │
  │  Rate Limiting (@nestjs/throttler) · Helmet · CORS          │
  ├─────────────────────────────────────────────────────────────┤
  │                   APPLICATION LAYER                         │
  │  Application Services · Use Cases · Command/Query Handlers  │
  │  Orchestration · Transaction Management · Authorization      │
  ├─────────────────────────────────────────────────────────────┤
  │                     DOMAIN LAYER                            │
  │  Domain Entities · Value Objects · Domain Services           │
  │  Domain Events · Repository Interfaces (Ports)               │
  │  Business Rules & Invariants                                 │
  ├─────────────────────────────────────────────────────────────┤
  │                  INFRASTRUCTURE LAYER                       │
  │  Prisma Services (Adapters) · Stripe Client · RSS Parser    │
  │  Email Transport (Nodemailer/SendGrid) · Redis Cache        │
  │  Background Job Runner (Bree/Bull via @nestjs/bull)         │
  │  SVG Renderer · File Storage (S3/local)                     │
  ├─────────────────────────────────────────────────────────────┤
  │                    DATABASE LAYER                           │
  │  PostgreSQL · Full-Text Search (tsvector) · Connection Pool  │
  │  Migrations (Prisma Migrate) · WAL Archiving · Indexes      │
  └─────────────────────────────────────────────────────────────┘
```

### 3.2 Layer Responsibilities

| Layer | Responsibility |
|---|---|
| **Public API** | Accept HTTP requests, validate input, apply authentication/authorization, transform responses, handle errors uniformly. No business logic. |
| **Application** | Orchestrate use cases. Coordinate domain services, infrastructure adapters, and transaction boundaries. Dispatch domain events. |
| **Domain** | Pure business logic with zero framework or infrastructure dependencies. Entities enforce invariants. Domain events signal state changes. |
| **Infrastructure** | Implement interfaces defined in the domain layer. Database access via Prisma. External API clients. Background job processing. Caching. File generation. |
| **Database** | Persist state. Provide full-text search capabilities. Enforce referential integrity via foreign keys. Maintain indexes for query performance. |

### 3.3 Request Lifecycle

```
HTTP Request
    ↓
1. Controller         → Parse params, body, query → validate DTO
    ↓
2. Guard              → JWT extraction + RBAC check
    ↓
3. Interceptor        → Logging, response transformation
    ↓
4. Application Service → Orchestrate use case, call domain services
    ↓
5. Domain Service      → Execute business rules, emit events
    ↓
6. Repository (interface) → Persistence operation
    ↓
7. Prisma Service      → Execute SQL via Prisma Client
    ↓
8. PostgreSQL          → Return data
    ↓
9. Response            → Serialized DTO back to client
```

---

## 4. Data Flow Diagrams

### 4.1 User Registration

```
Client                     API                           Domain                          DB
  │                         │                              │                              │
  │  POST /auth/register    │                              │                              │
  │  { email, password,     │                              │                              │
  │    name }               │                              │                              │
  │ ──────────────────────► │                              │                              │
  │                         │  Validate DTO                │                              │
  │                         │  Check email uniqueness      │                              │
  │                         │ ────────────────────────────►│  User entity                 │
  │                         │                              │  - Enforce password strength  │
  │                         │                              │  - Hash password (bcrypt)    │
  │                         │                              │                              │
  │                         │                              │ ─── INSERT user ────────────►│
  │                         │                              │                              │
  │                         │  Generate JWT pair           │                              │
  │                         │    (access + refresh)        │                              │
  │                         │                              │                              │
  │                         │  Dispatch event: UserCreated │                              │
  │                         │    → Notifications           │                              │
  │                         │                              │                              │
  │  { accessToken,         │                              │                              │
  │    refreshToken,        │                              │                              │
  │    user }               │                              │                              │
  │ ◄────────────────────── │                              │                              │
```

### 4.2 Blog Verification

```
Owner                    API                         Verification Service              BlogVerification Table
  │                       │                              │                              │
  │  POST /blogs/:id/verify                             │                              │
  │ ────────────────────► │                              │                              │
  │                       │  Validate ownership          │                              │
  │                       │ ────────────────────────────►│                              │
  │                       │                              │  Generate verification token  │
  │                       │                              │  Create pending verification  │
  │                       │                              │ ─── INSERT ─────────────────►│
  │                       │                              │                              │
  │  { method: "dns",     │                              │                              │
  │    token: "mb-xxx",   │                              │                              │
  │    expected: "txt" }  │                              │                              │
  │ ◄──────────────────── │                              │                              │
  │                       │                              │                              │
  │  [Owner adds DNS TXT  │                              │                              │
  │   record or <meta>    │                              │                              │
  │   tag to blog]        │                              │                              │
  │                       │                              │                              │
  │  POST /blogs/:id/verify/check                        │                              │
  │ ────────────────────► │                              │                              │
  │                       │  Trigger verification check   │                              │
  │                       │ ────────────────────────────►│                              │
  │                       │                              │  DNS lookup / HTTP fetch      │
  │                       │                              │  Verify token match           │
  │                       │                              │  If match:                    │
  │                       │                              │    ─── UPDATE blog ──────────►│  (set verified=true)
  │                       │                              │    Dispatch: BlogVerified      │
  │                       │                              │      → Badges, Notifications  │
  │                       │                              │                              │
  │  { verified: true }   │                              │                              │
  │ ◄──────────────────── │                              │                              │
```

### 4.3 RSS Ingestion

```
Cron/Scheduler            RSS Module                       Article Module                DB
  │                         │                               │                            │
  │  Trigger                │                               │                            │
  │ ──────────────────────► │                               │                            │
  │                         │  SELECT blogs with active RSS │                            │
  │                         │ ────────────────────────────►│                            │
  │                         │                               │                            │
  │                         │  For each blog:               │                            │
  │                         │    HTTP GET feed URL          │                            │
  │                         │    Parse XML (RSS/Atom)       │                            │
  │                         │    Extract items              │                            │
  │                         │                               │                            │
  │                         │  For each item:               │                            │
  │                         │    Check dedup by GUID/URL    │                            │
  │                         │    If new:                    │                            │
  │                         │      Detect language ─────────┤                            │
  │                         │      Suggest categories ──────┤                            │
  │                         │      ─── INSERT article ──────┤ ──────────────────────────►│
  │                         │                               │                            │
  │                         │  Update feed metadata         │                            │
  │                         │    (lastFetched, nextFetch,   │                            │
  │                         │     status, errorCount)       │                            │
  │                         │ ──────────────────────────────┤ ─── UPDATE feed ──────────►│
  │                         │                               │                            │
  │                         │  Log ingestion result         │                            │
  │                         │    (articles added, errors)   │                            │
```

### 4.4 Article Indexing

```
RSS Module (or API)         Article Service                Classification Pipeline        DB
  │                           │                              │                            │
  │  New article received     │                              │                            │
  │ ─────────────────────────►│                              │                            │
  │                           │  Validate raw data           │                            │
  │                           │  Normalize URL               │                            │
  │                           │    (strip UTM, trailing /)   │                            │
  │                           │                              │                            │
  │                           │  Language Detection          │                            │
  │                           │ ────────────────────────────►│  (compact language detector │
  │                           │                              │   or CLD3-like heuristic)  │
  │                           │ ◄──── language: "en" ───────│                            │
  │                           │                              │                            │
  │                           │  Category Suggestion         │                            │
  │                           │ ────────────────────────────►│  (keyword matching against │
  │                           │                              │   category taxonomy)       │
  │                           │ ◄── suggested categories ────│                            │
  │                           │                              │                            │
  │                           │  Build tsvector search doc   │                            │
  │                           │    (title + excerpt)         │                            │
  │                           │                              │                            │
  │                           │  Emit: ArticleIndexed        │                            │
  │                           │    → Search, SEO, Badges     │                            │
  │                           │                              │                            │
  │                           │  ─── INSERT article ────────►│ ───────────────────────────►│
```

### 4.5 Promotion Purchase

```
Client                     API                         Promotions Service                 Wallet Service
  │                         │                              │                              │
  │  POST /promotions       │                              │                              │
  │  { blogId, plan,       │                              │                              │
  │    startDate, days }    │                              │                              │
  │ ──────────────────────► │                              │                              │
  │                         │  Validate input              │                              │
  │                         │  Check blog ownership        │                              │
  │                         │  Calculate cost = days × rate│                              │
  │                         │ ────────────────────────────►│                              │
  │                         │                              │  ─── Reserve funds ────────►│
  │                         │                              │                              │  Check balance >= cost
  │                         │                              │                              │  Place hold on credits
  │                         │                              │ ◄── hold confirmed ─────────│
  │                         │                              │                              │
  │                         │                              │  Create PromotionCampaign    │
  │                         │                              │  Schedule activation         │
  │                         │                              │                              │
  │                         │                              │  ─── Commit deduction ──────►│
  │                         │                              │                              │  Release hold
  │                         │                              │                              │  Debit balance
  │                         │                              │                              │  Create transaction record
  │                         │                              │                              │
  │                         │                              │  Dispatch: CampaignCreated   │
  │                         │                              │    → Notifications, Search   │
  │                         │                              │                              │
  │  { campaign,            │                              │                              │
  │    startDate,           │                              │                              │
  │    status: "scheduled" }│                              │                              │
  │ ◄────────────────────── │                              │                              │
```

### 4.6 Wallet Top-Up

```
Client                     API                         Payments Service                  Wallet Service
  │                         │                              │                              │
  │  POST /wallet/topup     │                              │                              │
  │  { amount, currency }   │                              │                              │
  │ ──────────────────────► │                              │                              │
  │                         │  Validate amount > minimum   │                              │
  │                         │  Create PaymentOrder (pending)                              │
  │                         │ ────────────────────────────►│                              │
  │                         │                              │  Create Stripe CheckoutSession│
  │                         │                              │  (amount, metadata,           │
  │                         │                              │   success/cancel URLs)        │
  │                         │                              │                              │
  │  { sessionUrl,          │                              │                              │
  │    orderId }            │                              │                              │
  │ ◄────────────────────── │                              │                              │
  │                         │                              │                              │
  │  [User completes payment│                              │                              │
  │   on Stripe Checkout]   │                              │                              │
  │                         │                              │                              │
  │  Stripe Webhook:        │                              │                              │
  │  checkout.session       │                              │                              │
  │  .completed             │                              │                              │
  │ ────────────────────────►──────────────────────────────►                              │
  │                         │                              │  Verify webhook signature     │
  │                         │                              │  Update PaymentOrder → paid   │
  │                         │                              │ ─── Credit wallet ──────────►│
  │                         │                              │                              │  Increase balance
  │                         │                              │                              │  Create credit transaction
  │                         │                              │                              │  Dispatch: WalletCredited
  │                         │                              │                              │    → Notifications
```

### 4.7 Stripe Payment

```
Client                   API                    Stripe Client                Stripe API          Webhook Endpoint
  │                      │                        │                           │                   │
  │  POST /checkout      │                        │                           │                   │
  │  { priceId,          │                        │                           │                   │
  │    metadata }        │                        │                           │                   │
  │ ────────────────────►│                        │                           │                   │
  │                      │  Create PaymentOrder   │                           │                   │
  │                      │ ─────────────────────►│                           │                   │
  │                      │                        │  stripe.checkout.sessions.create              │
  │                      │                        │ ─────────────────────────►│                   │
  │                      │                        │ ◄── { sessionId, url } ──│                   │
  │                      │ ◄── { url, sessionId } │                           │                   │
  │                      │                        │                           │                   │
  │  { url }             │                        │                           │                   │
  │ ◄────────────────────│                        │                           │                   │
  │                      │                        │                           │                   │
  │  [User completes     │                        │                           │                   │
  │   payment on Stripe] │                        │                           │                   │
  │                      │                        │                           │                   │
  │                      │                        │                           │                   │
  │                      │                        │                           │  POST /webhooks/   │
  │                      │                        │                           │  stripe            │
  │                      │                        │                           │ ──────────────────►│
  │                      │                        │                           │                   │
  │                      │                        │                           │                   │  Verify signature
  │                      │                        │                           │                   │  (Stripe webhook secret)
  │                      │                        │                           │                   │
  │                      │                        │                           │                   │  Process event type:
  │                      │                        │                           │                   │  - checkout.session.completed
  │                      │                        │                           │                   │  - invoice.paid
  │                      │                        │                           │                   │  - charge.refunded
  │                      │                        │                           │                   │
  │                      │                        │                           │                   │  Update PaymentOrder status
  │                      │                        │                           │                   │  ──► Wallet Service (credit)
  │                      │                        │                           │                   │  or ──► Promotion Service
  │                      │                        │                           │                   │
  │                      │  [Payment confirmed]   │                           │                   │
```

### 4.8 Badge Assignment

```
Trigger Event               Badges Service                  SVG Renderer                  DB
  │                           │                              │                             │
  │  BlogVerified event       │                              │                             │
  │ ─────────────────────────►│                              │                             │
  │                           │                              │                             │
  │  [Other triggers:         │                              │                             │
  │   FirstPromotion,         │                              │                             │
  │   EarlyAdopter,           │                              │                             │
  │   MilestoneReached]       │                              │                             │
  │                           │                              │                             │
  │                           │  Check assignment rules      │                             │
  │                           │    - Already assigned?       │                             │
  │                           │    - Conditions met?         │                             │
  │                           │                              │                             │
  │                           │  Generate SVG badge          │                             │
  │                           │ ───────────────────────────►│                             │
  │                           │                              │  Compose SVG from template  │
  │                           │                              │  Inject blog name, date,    │
  │                           │                              │  badge type-specific data   │
  │                           │ ◄── { svg string, url } ────│                             │
  │                           │                              │                             │
  │                           │  Store badge file            │                             │
  │                           │    (local disk / S3)         │                             │
  │                           │                              │                             │
  │                           │  Create BadgeAssignment      │                             │
  │                           │ ─── INSERT ──────────────────────────────────────────────►│
  │                           │                              │                             │
  │                           │  Dispatch: BadgeAwarded      │                             │
  │                           │    → Notifications           │                             │
```

### 4.9 Notification Delivery

```
Source Event               Notifications Service              Queue                    Delivery Channel
  │                           │                              │                             │
  │  Any domain event         │                              │                             │
  │  (UserCreated,            │                              │                             │
  │   BlogVerified,           │                              │                             │
  │   BadgeAwarded,           │                              │                             │
  │   PaymentReceived)        │                              │                             │
  │ ─────────────────────────►│                              │                             │
  │                           │                              │                             │
  │                           │  Determine notification type │                             │
  │                           │  Build notification payload  │                             │
  │                           │  Localize subject + body     │                             │
  │                           │                              │                             │
  │                           │  Create Notification record  │                             │
  │                           │ ─── INSERT ───────────────────────────────────────────────►│
  │                           │                              │                             │
  │                           │  Determine delivery channel  │                             │
  │                           │    - in_app: always          │                             │
  │                           │    - email: if user opted in │                             │
  │                           │                              │                             │
  │                           │  If email:                   │                             │
  │                           │    ─── Push to email queue ─►│                             │
  │                           │                              │  ─── Send via ────────────►│  Email Provider
  │                           │                              │      SendGrid/Nodemailer    │  (SendGrid, SMTP)
  │                           │                              │                             │
  │                           │                              │ ◄── delivery confirmed ────│
  │                           │                              │                             │
  │                           │  Update delivery status      │                             │
  │                           │  (sent_at, error, read_at)   │                             │
```

---

## 5. Preliminary Entity Inventory

| # | Entity | Domain | Purpose |
|---|---|---|---|
| 1 | **User** | Users | Registered platform user — identity, credentials, profile |
| 2 | **Session** | Auth | Refresh token storage, device tracking, session revocation |
| 3 | **Blog** | Blogs | Registered blog — URL, metadata, verification status, settings |
| 4 | **BlogVerification** | Blogs | Ownership proof attempt — token, method (dns/meta), status, timestamps |
| 5 | **RssFeed** | RSS | RSS/Atom feed configuration — URL, polling interval, status, last fetched |
| 6 | **RssFeedLog** | RSS | Ingestion history — articles found, errors, duration, status |
| 7 | **Article** | Articles | Indexed article — title, excerpt, original URL, metadata, language, published date |
| 8 | **Category** | Categories | Category definition — slug, display name, parent, language |
| 9 | **ArticleCategory** | Categories | Many-to-many link between articles and categories |
| 10 | **BlogCategory** | Categories | Default categories assigned to a blog's articles |
| 11 | **PromotionCampaign** | Promotions | Promoted listing — blog, plan, budget, dates, status |
| 12 | **PromotionPricing** | Promotions | Pricing tiers — cost per day, minimum days, feature set |
| 13 | **Wallet** | Wallet | User's credit balance — current balance, version (optimistic lock) |
| 14 | **WalletTransaction** | Wallet | Immutable ledger entry — type (credit/debit/refund/hold), amount, reference |
| 15 | **PaymentOrder** | Payments | Stripe payment record — order ID, amount, currency, status, stripe session ID |
| 16 | **BadgeDefinition** | Badges | Badge template — type, name, description, SVG template, criteria |
| 17 | **BadgeAssignment** | Badges | Awarded badge — blog, badge, awarded date, custom SVG URL |
| 18 | **Notification** | Notifications | Notification record — user, type, title, body, read status, metadata |
| 19 | **NotificationDelivery** | Notifications | Delivery attempt tracking — channel (email/in-app), status, error, timestamps |
| 20 | **SupportTicket** | Support | User support request — subject, message, status, assigned admin |
| 21 | **AuditLog** | System | Immutable audit trail — actor, action, resource, changeset, IP, timestamp |
| 22 | **FeatureFlag** | System | Toggle definitions — name, enabled, segment rules, owner |
| 23 | **SystemConfiguration** | System | Key-value configuration — maintenance mode, global limits, etc. |
| 24 | **UserPreference** | Users | Per-user settings — locale, timezone, notification channels, theme |
| 25 | **PromotionAnalytics** | Promotions | Daily impression/click data for promoted blogs (eventually) |

---

## 6. Cross-Cutting Concerns

| Concern | Approach | Implementation |
|---|---|---|
| **Logging** | Structured JSON logging with correlation IDs per request. Log levels configurable per module. | NestJS Logger with Pino transport. Correlation ID via middleware or `cls-hooked` (AsyncLocalStorage). |
| **Audit** | Immutable audit trail for all state-mutating operations on sensitive resources (users, blogs, payments). | `AuditLog` table. A NestJS interceptor captures request context + diff. Domain events also feed audit entries. |
| **Error Tracking** | Unhandled exceptions caught by global exception filter. Sentry integration for production error aggregation. | `SentryModule` (global). `AllExceptionsFilter` transforms to consistent `ApiError` response. |
| **Backups** | Automated PostgreSQL backups. Point-in-time recovery via WAL archiving. | Daily `pg_dump` to object storage. WAL archiving to S3-compatible storage. Prisma migrations version-controlled. |
| **Permissions** | Role-based access control (RBAC). Roles: `user`, `admin`, `superadmin`. Resource-level checks for blog ownership. | NestJS `@SetMetadata` + custom `RolesGuard`. Ownership guard queries blog → user association. |
| **Rate Limiting** | Per-endpoint rate limits. Stricter on auth endpoints (login, register). | `@nestjs/throttler` with Redis store for distributed rate tracking in production (in-memory acceptable in dev). |
| **Feature Flags** | System toggles for gradual rollout. Controlled via Admin panel. | `FeatureFlag` table + `@FeatureFlag(name)` decorator. Middleware checks flag before request reaches controller. |
| **Localization / i18n** | Server-side error message localization. Language preference per user or `Accept-Language` header. | NestJS i18n module. Message files per locale (en, es, fr, de, etc.). Fallback to English. |
| **Observability** | Health check endpoints for dependencies. Prometheus metrics for request count, latency, error rate. | `@nestjs/terminus` for health checks. `@nestjs/prometheus` for metrics. StatsD optional for custom metrics. |
| **Caching** | Cache frequent read queries (categories, blog metadata, promoted listings). | Redis cache via `@nestjs/cache-manager`. Cache-aside pattern. TTL per data type. |
| **Validation** | All input validated at the controller boundary. DTO-level validation for structure, service-level for business rules. | `class-validator` + `class-transformer` on DTOs. `ValidationPipe` global. |
| **Transaction Management** | Database transactions for multi-table operations. Prisma interactive transactions with retry logic for wallet operations. | Prisma `$transaction` API. Optimistic locking on Wallet (version field). |
| **Background Jobs** | Scheduled and queued jobs. RSS ingestion scheduled via cron. Email notifications queued. | `@nestjs/schedule` for cron. `@nestjs/bull` with Redis for job queues. Bull Board for admin monitoring. |
| **API Documentation** | Auto-generated OpenAPI/Swagger docs. | `@nestjs/swagger` with decorators on DTOs and controllers. |
| **Security** | HTTP security headers, CORS policy, CSRF protection for web routes, JWT best practices (short-lived access, long-lived refresh). | Helmet middleware. CORS configured per environment. `passport` + `@nestjs/jwt` + `@nestjs/passport`. |

---

*End of Architecture Document. No implementation code has been written. This document serves as the blueprint for all subsequent development phases.*

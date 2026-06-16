# MillionBlogs — Database Architecture Document

**Version:** 2.0  
**Status:** Draft — Pre-Implementation  
**Target:** PostgreSQL 15+ | UUID PKs | Soft Deletes | Immutable Financial Records

---

## Table of Contents

1. [Complete Entity Relationship Diagram](#1-complete-entity-relationship-diagram)
2. [Entity Definitions](#2-entity-definitions)
3. [Complete Field Definitions](#3-complete-field-definitions)
4. [Index Design](#4-index-design)
5. [Database Constraints](#5-database-constraints)
6. [Future Scalability Strategy](#6-future-scalability-strategy)
7. [Database Review](#7-database-review)

---

## 1. Complete Entity Relationship Diagram

### 1.1 Entity Clusters

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         USER & AUTH CLUSTER                                  │
 │                                                                              │
 │   ┌──────────┐    1:1     ┌──────────────┐                                  │
 │   │          │───────────►│     User      │──────────1:N────────►┌────────┐  │
 │   │  Wallet  │            │  Preference   │                      │ Session│  │
 │   └──────────┘            └──────────────┘                      └────────┘  │
 │        │ 1:1                         │ 1:N                                  │
 │        │                             │                                       │
 │        ▼                             ▼                                       │
 │   ┌──────────┐              ┌────────────────┐     1:N      ┌──────────────┐│
 │   │   User   │─────────────►│  SupportTicket │─────────────►│  AuditLog    ││
 │   └──────────┘              └────────────────┘              └──────────────┘│
 │        │ 1:N                       │ 1:N                                    │
 │        │                           │                                         │
 │        ▼                           ▼                                         │
 │   ┌──────────┐              ┌────────────────┐                              │
 │   │   Blog   │              │  Notification   │                              │
 │   └──────────┘              └────────────────┘                              │
 └─────────────────────────────────────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                              BLOG CLUSTER                                    │
 │                                                                              │
 │   ┌──────┐    1:N     ┌────────┐    1:1     ┌──────────┐    1:N    ┌────────┐│
 │   │ User │───────────►│  Blog  │───────────►│ RssFeed  │──────────►│RssFeed ││
 │   └──────┘            └────────┘            └──────────┘           │  Log   ││
 │                            │                                        └────────┘│
 │                        1:N │                                        ┌────────┐│
 │                            ▼                             1:N┌──────►│ Article││
 │                      ┌────────────┐                         │       └────────┘│
 │                      │    Blog    │                         │                 │
 │                      │Verification│─────────────────────────┘                 │
 │                      └────────────┘                          1:N              │
 │                            │                                  │               │
 │                         N:M │                                  │               │
 │                            ▼                                  ▼               │
 │                      ┌──────────────┐                  ┌──────────────┐       │
 │                      │ BlogCategory │                  │ ArticleCateg │       │
 │                      └──────────────┘                  │    ory       │       │
 │                            │                            └──────┬───────┘       │
 │                            │ N:M                              │ N:M           │
 │                            ▼                                  ▼               │
 │                      ┌──────────────────────────────────────────────┐         │
 │                      │                  Category                    │         │
 │                      │                                              │         │
 │                      │   ┌──────────────────────┐                   │         │
 │                      │   │ CategoryTranslation  │ 1:N               │         │
 │                      │   └──────────────────────┘                   │         │
 │                      └──────────────────────────────────────────────┘         │
 └─────────────────────────────────────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                           FINANCE CLUSTER                                    │
 │                                                                              │
 │   ┌──────┐    1:1     ┌──────────┐    1:N     ┌──────────────────┐         │
 │   │ User │───────────►│  Wallet  │────────────►│WalletTransaction  │         │
 │   └──────┘            └──────────┘             │ (Immutable)      │         │
 │                            │                   └──────────────────┘         │
 │                            │ 1:N                                            │
 │                            ▼                                                │
 │                      ┌────────────────┐                                    │
 │                      │  PaymentOrder  │────────────────────                  │
 │                      │  (Immutable)   │──────────────────── │                │
 │                      └────────────────┘                     │                │
 │                            │                                │                │
 │                     1:N  │  │ 1:N                          │                │
 │                          ▼  ▼                              ▼                │
 │              ┌─────────────────────┐              ┌────────────────────┐    │
 │              │  FounderPlan        │              │  FounderPlan       │    │
 │              │  Assignment         │              │  (Definition)      │    │
 │              └─────────────────────┘              └────────────────────┘    │
 └─────────────────────────────────────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         PROMOTION CLUSTER                                    │
 │                                                                              │
 │   ┌──────────┐              ┌────────────────────┐                          │
 │   │Promotion │    1:N       │  PromotionCampaign  │                          │
 │   │ Pricing  │─────────────►│                     │                          │
 │   └──────────┘              └────────────────────┘                          │
 │                                    │ 1:N                                     │
 │                                    ▼                                         │
 │                              ┌──────────┐                                   │
 │                              │   Blog   │                                   │
 │                              └──────────┘                                   │
 └─────────────────────────────────────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                           BADGE CLUSTER                                      │
 │                                                                              │
 │   ┌──────────────────┐    1:N     ┌──────────────────┐                      │
 │   │  BadgeDefinition │───────────►│  BadgeAssignment  │                      │
 │   └──────────────────┘            └──────────────────┘                      │
 │                                             │ 1:N                            │
 │                                             ▼                                │
 │                                       ┌──────────┐                          │
 │                                       │   Blog   │                          │
 │                                       └──────────┘                          │
 └─────────────────────────────────────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       NOTIFICATION CLUSTER                                   │
 │                                                                              │
 │   ┌──────┐    1:N     ┌──────────────┐    1:N     ┌──────────────────────┐  │
 │   │ User │───────────►│ Notification │────────────►│ NotificationDelivery │  │
 │   └──────┘            └──────────────┘             └──────────────────────┘  │
 └─────────────────────────────────────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                            SYSTEM CLUSTER                                    │
 │                                                                              │
 │   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐        │
 │   │   FeatureFlag    │   │     System       │   │    AuditLog      │        │
 │   │                  │   │  Configuration   │   │                  │        │
 │   └──────────────────┘   └──────────────────┘   └──────────────────┘        │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Relationship Table

| # | Entity A | Entity B | Cardinality | FK Column | Description |
|---|---|---|---|---|---|
| 1 | User | Blog | 1:N | Blog.user_id | A user owns many blogs |
| 2 | User | UserPreference | 1:1 | UserPreference.user_id | Each user has exactly one preference set |
| 3 | User | Session | 1:N | Session.user_id | A user can have multiple active sessions |
| 4 | User | Wallet | 1:1 | Wallet.user_id | Each user has exactly one wallet |
| 5 | User | SupportTicket | 1:N | SupportTicket.user_id | A user can create many support tickets |
| 6 | User | Notification | 1:N | Notification.user_id | A user can have many notifications |
| 7 | User | AuditLog | 1:N | AuditLog.actor_id | A user generates many audit entries |
| 8 | User | FounderPlanAssignment | 1:N | FounderPlanAssignment.user_id | A user can be assigned to many founder plans |
| 9 | Blog | BlogVerification | 1:N | BlogVerification.blog_id | A blog has many verification attempts |
| 10 | Blog | RssFeed | 1:1 | RssFeed.blog_id | Each blog has one RSS feed config |
| 11 | Blog | Article | 1:N | Article.blog_id | A blog has many articles |
| 12 | Blog | PromotionCampaign | 1:N | PromotionCampaign.blog_id | A blog can have many promotion campaigns |
| 13 | Blog | BadgeAssignment | 1:N | BadgeAssignment.blog_id | A blog can earn many badges |
| 14 | Blog | FounderPlanAssignment | 1:N | FounderPlanAssignment.blog_id | A blog can be assigned to founder plans |
| 15 | Blog | Category | N:M | BlogCategory | Blog-to-category via link table |
| 16 | RssFeed | RssFeedLog | 1:N | RssFeedLog.feed_id | Each feed ingestion creates a log entry |
| 17 | Article | Category | N:M | ArticleCategory | Article-to-category via link table |
| 18 | Category | CategoryTranslation | 1:N | CategoryTranslation.category_id | Each category has translations |
| 19 | Wallet | WalletTransaction | 1:N | WalletTransaction.wallet_id | A wallet has many transactions (immutable) |
| 20 | Wallet | PaymentOrder | 1:N | PaymentOrder.wallet_id | A wallet can have many payment orders |
| 21 | User | PaymentOrder | 1:N | PaymentOrder.user_id | A user can have many payment orders |
| 22 | BadgeDefinition | BadgeAssignment | 1:N | BadgeAssignment.badge_definition_id | A badge type can be awarded many times |
| 23 | Notification | NotificationDelivery | 1:N | NotificationDelivery.notification_id | Each notification has delivery records |
| 24 | FounderPlan | FounderPlanAssignment | 1:N | FounderPlanAssignment.plan_id | A plan definition can be assigned many times |

---

## 2. Entity Definitions

### 2.1 User

| Attribute | Value |
|---|---|
| **Purpose** | Registered platform user — identity, authentication, and profile root |
| **Owner Domain** | Users |
| **Lifecycle** | Created on sign-up → Active → (optional: suspended → reinstated) → Deleted (soft) |
| **Deletion** | Soft delete. Cascade blocks: orphan blogs must be reassigned or deleted first |

### 2.2 UserPreference

| Attribute | Value |
|---|---|
| **Purpose** | Per-user settings: locale, timezone, notification channel preferences, theme |
| **Owner Domain** | Users |
| **Lifecycle** | Created with User → Updated through settings → Deleted with User |
| **Deletion** | Soft delete. Cascade from User. |

### 2.3 Session

| Attribute | Value |
|---|---|
| **Purpose** | Refresh token tracking, device awareness, session revocation |
| **Owner Domain** | Auth |
| **Lifecycle** | Created on login → Active → Revoked on logout/password change → Expired (TTL) |
| **Deletion** | Soft delete. Periodic cleanup of expired sessions via cron. |

### 2.4 Blog

| Attribute | Value |
|---|---|
| **Purpose** | Registered blog — metadata, verification status, default language, settings |
| **Owner Domain** | Blogs |
| **Lifecycle** | Created by user → Verified (optional) → Active → (suspended → reinstated) → Deleted |
| **Deletion** | Soft delete. Cascade: Articles are orphaned and hidden from search. |

### 2.5 BlogVerification

| Attribute | Value |
|---|---|
| **Purpose** | Ownership proof attempt — tracks method, token, status across attempts |
| **Owner Domain** | Blogs |
| **Lifecycle** | Created on verification start → Pending → Verified or Failed → Retry |
| **Deletion** | Soft delete. Retained for audit. |

### 2.6 BlogCategory

| Attribute | Value |
|---|---|
| **Purpose** | Many-to-many link table — assigns default categories to a blog |
| **Owner Domain** | Categories |
| **Lifecycle** | Created/removed when blog updates its default categories |
| **Deletion** | Soft delete. Orphaned rows cleaned up on category/blog deletion. |

### 2.7 RssFeed

| Attribute | Value |
|---|---|
| **Purpose** | RSS/Atom feed configuration — URL, polling schedule, health status |
| **Owner Domain** | RSS |
| **Lifecycle** | Created with blog → Active → (dead → paused → retry) → Removed |
| **Deletion** | Soft delete. Cascade to RssFeedLog. |

### 2.8 RssFeedLog

| Attribute | Value |
|---|---|
| **Purpose** | Immutable ingestion history — articles found, errors, duration per fetch |
| **Owner Domain** | RSS |
| **Lifecycle** | Created per ingestion attempt → Archived after 90 days → Pruned |
| **Deletion** | Soft delete. Periodic archival/pruning job. |

### 2.9 Article

| Attribute | Value |
|---|---|
| **Purpose** | Indexed article — title, excerpt, original URL, language, metadata |
| **Owner Domain** | Articles |
| **Lifecycle** | Created via RSS ingestion or API → Indexed → Soft-deleted (hidden from search) |
| **Deletion** | Soft delete. Hard delete possible after 30-day grace period in archive. |

### 2.10 ArticleCategory

| Attribute | Value |
|---|---|
| **Purpose** | Many-to-many link table — assigns categories to an article |
| **Owner Domain** | Categories |
| **Lifecycle** | Created on article indexing → Removed on category/article deletion |
| **Deletion** | Soft delete. |

### 2.11 Category

| Attribute | Value |
|---|---|
| **Purpose** | Taxonomy node — hierarchical category tree with multilingual labels |
| **Owner Domain** | Categories |
| **Lifecycle** | Created by admin → Active → Deprecated → Deleted |
| **Deletion** | Soft delete. Reassign child categories before removal. |

### 2.12 CategoryTranslation

| Attribute | Value |
|---|---|
| **Purpose** | Localized category label — one row per language per category |
| **Owner Domain** | Categories |
| **Lifecycle** | Created with category → Updated → Deleted with category |
| **Deletion** | Soft delete. Cascade from Category. |

### 2.13 PromotionPricing

| Attribute | Value |
|---|---|
| **Purpose** | Pricing tier definitions — cost per day, minimum days, feature set |
| **Owner Domain** | Promotions |
| **Lifecycle** | Created by admin → Active → Deprecated → Deleted |
| **Deletion** | Soft delete. No deletion if campaigns reference it. |

### 2.14 PromotionCampaign

| Attribute | Value |
|---|---|
| **Purpose** | Promoted listing instance — blog, plan, dates, budget, status |
| **Owner Domain** | Promotions |
| **Lifecycle** | Created (pending payment) → Scheduled → Active → Completed/Cancelled → Archived |
| **Deletion** | Soft delete. Retained for financial reconciliation. |

### 2.15 Wallet

| Attribute | Value |
|---|---|
| **Purpose** | User credit balance — versioned for optimistic concurrency |
| **Owner Domain** | Wallet |
| **Lifecycle** | Created with User → Active → Frozen (on suspension) → Closed |
| **Deletion** | Soft delete. Never hard-deleted — financial record. |

### 2.16 WalletTransaction

| Attribute | Value |
|---|---|
| **Purpose** | Immutable ledger entry — every credit, debit, hold, refund, and bonus |
| **Owner Domain** | Wallet |
| **Lifecycle** | Created → Immutable (never updated or deleted) |
| **Deletion** | **Never deleted.** Hard delete forbidden at DB level. Soft delete column unused. |

### 2.17 PaymentOrder

| Attribute | Value |
|---|---|
| **Purpose** | Stripe payment record — checkout sessions, payment intents, refunds |
| **Owner Domain** | Payments |
| **Lifecycle** | Created (pending) → Processing → Completed or Failed → Refunded (optional) |
| **Deletion** | **Never deleted.** Immutable financial record. |

### 2.18 FounderPlan

| Attribute | Value |
|---|---|
| **Purpose** | Founder plan definition — price, benefits, seat limit, availability window |
| **Owner Domain** | Users / Admin |
| **Lifecycle** | Created by admin → Active → Limited → Closed → Deleted |
| **Deletion** | Soft delete. Retain assignments. |

### 2.19 FounderPlanAssignment

| Attribute | Value |
|---|---|
| **Purpose** | Links user+blog to a purchased founder plan — tracks entitlement |
| **Owner Domain** | Users / Admin |
| **Lifecycle** | Created on purchase → Active → Expired or Revoked |
| **Deletion** | Soft delete. Retained for audit. |

### 2.20 BadgeDefinition

| Attribute | Value |
|---|---|
| **Purpose** | Badge type template — name, SVG template, assignment criteria, rules |
| **Owner Domain** | Badges |
| **Lifecycle** | Created by admin → Active → Deprecated → Deleted |
| **Deletion** | Soft delete. Keep assignments even after definition is deleted. |

### 2.21 BadgeAssignment

| Attribute | Value |
|---|---|
| **Purpose** | Awarded badge — links a blog to a badge definition with custom SVG |
| **Owner Domain** | Badges |
| **Lifecycle** | Created on trigger → Active → Revoked (if conditions no longer met) |
| **Deletion** | Soft delete. Retained for historical display. |

### 2.22 Notification

| Attribute | Value |
|---|---|
| **Purpose** | User notification — in-app inbox message with type and metadata |
| **Owner Domain** | Notifications |
| **Lifecycle** | Created → Unread → Read → Dismissed → Archived |
| **Deletion** | Soft delete. Auto-archive after 90 days. |

### 2.23 NotificationDelivery

| Attribute | Value |
|---|---|
| **Purpose** | Delivery attempt record — tracks channel, status, error, timestamps |
| **Owner Domain** | Notifications |
| **Lifecycle** | Created on send → Pending → Delivered or Failed → (optional retry) |
| **Deletion** | Soft delete. Retained for delivery analytics. |

### 2.24 SupportTicket

| Attribute | Value |
|---|---|
| **Purpose** | User support request — subject, message, priority, assignment |
| **Owner Domain** | Support |
| **Lifecycle** | Created → Open → In Progress → Resolved → Closed → Reopened |
| **Deletion** | Soft delete. Retained for audit. |

### 2.25 AuditLog

| Attribute | Value |
|---|---|
| **Purpose** | Immutable audit trail — tracks who did what, when, and what changed |
| **Owner Domain** | System |
| **Lifecycle** | Created → Immutable → Archived after 1 year |
| **Deletion** | **Never deleted.** Soft delete column unused. Periodic archival to cold storage. |

### 2.26 FeatureFlag

| Attribute | Value |
|---|---|
| **Purpose** | Toggle definitions for gradual feature rollout, A/B tests, kill switches |
| **Owner Domain** | System |
| **Lifecycle** | Created → Enabled/Disabled → Deprecated → Removed |
| **Deletion** | Soft delete. |

### 2.27 SystemConfiguration

| Attribute | Value |
|---|---|
| **Purpose** | Key-value runtime configuration — maintenance mode, global caps, settings |
| **Owner Domain** | System |
| **Lifecycle** | Created → Updated → Deleted |
| **Deletion** | Soft delete. |

---

## 3. Complete Field Definitions

### 3.1 User

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | Default `gen_random_uuid()` |
| email | VARCHAR(255) | NO | YES | YES | Case-insensitive handling in app layer |
| password_hash | VARCHAR(255) | NO | NO | NO | bcrypt output |
| display_name | VARCHAR(100) | NO | NO | NO | Public-facing name |
| avatar_url | VARCHAR(2048) | YES | NO | NO | Profile image URL |
| role | VARCHAR(20) | NO | NO | YES | Enum: `user`, `admin`, `superadmin` |
| email_verified_at | TIMESTAMPTZ | YES | NO | NO | Null = not verified |
| last_login_at | TIMESTAMPTZ | YES | NO | YES | Last successful login |
| created_at | TIMESTAMPTZ | NO | NO | YES | Auto-set |
| updated_at | TIMESTAMPTZ | NO | NO | NO | Auto-updated |
| deleted_at | TIMESTAMPTZ | YES | NO | YES | Soft delete marker |

### 3.2 UserPreference

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| user_id | UUID | NO | YES | YES | FK → User.id, unique = 1:1 |
| locale | VARCHAR(10) | NO | NO | NO | e.g. `en`, `es`, `fr` |
| timezone | VARCHAR(50) | NO | NO | NO | e.g. `America/New_York` |
| email_notifications | BOOLEAN | NO | NO | NO | Default: true |
| in_app_notifications | BOOLEAN | NO | NO | NO | Default: true |
| theme | VARCHAR(20) | NO | NO | NO | Enum: `light`, `dark`, `system` |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

### 3.3 Session

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| user_id | UUID | NO | NO | YES | FK → User.id |
| refresh_token_hash | VARCHAR(255) | NO | YES | YES | SHA-256 of JWT refresh token |
| device_info | TEXT | YES | NO | NO | User agent string |
| ip_address | VARCHAR(45) | YES | NO | YES | IPv4 or IPv6 |
| expires_at | TIMESTAMPTZ | NO | NO | YES | Auto-expiry for cleanup |
| revoked_at | TIMESTAMPTZ | YES | NO | YES | Null = active |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

### 3.4 Blog

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| user_id | UUID | NO | NO | YES | FK → User.id |
| name | VARCHAR(255) | NO | NO | NO | Display name |
| slug | VARCHAR(255) | NO | YES | YES | URL-safe, SEO-friendly |
| description | TEXT | YES | NO | NO | Blog description |
| url | VARCHAR(2048) | NO | YES | YES | Full blog URL |
| favicon_url | VARCHAR(2048) | YES | NO | NO | Auto-extracted |
| language | VARCHAR(10) | NO | NO | YES | Primary language |
| is_verified | BOOLEAN | NO | NO | YES | Ownership verified? |
| verified_at | TIMESTAMPTZ | YES | NO | NO | Null = unverified |
| status | VARCHAR(20) | NO | NO | YES | Enum: `active`, `inactive`, `suspended` |
| created_at | TIMESTAMPTZ | NO | NO | YES | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

### 3.5 BlogVerification

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| blog_id | UUID | NO | NO | YES | FK → Blog.id |
| method | VARCHAR(20) | NO | NO | NO | Enum: `dns_txt`, `meta_tag`, `file_upload` |
| token | VARCHAR(255) | NO | NO | YES | Verification string (e.g. `mb-<uuid>`) |
| status | VARCHAR(20) | NO | NO | YES | Enum: `pending`, `verified`, `failed` |
| verified_at | TIMESTAMPTZ | YES | NO | NO | When verified |
| expires_at | TIMESTAMPTZ | NO | NO | NO | Token TTL (e.g. 72h) |
| attempt_count | INTEGER | NO | NO | NO | Auto-incremented on each check |
| last_checked_at | TIMESTAMPTZ | YES | NO | NO | Last re-check timestamp |
| error_message | TEXT | YES | NO | NO | Failure reason |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

### 3.6 BlogCategory

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| blog_id | UUID | NO | NO | YES | FK → Blog.id |
| category_id | UUID | NO | NO | YES | FK → Category.id |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

**Unique Constraint:** (blog_id, category_id)

### 3.7 RssFeed

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| blog_id | UUID | NO | YES | YES | FK → Blog.id, unique = 1:1 |
| feed_url | VARCHAR(2048) | NO | NO | NO | RSS/Atom URL |
| status | VARCHAR(20) | NO | NO | YES | Enum: `active`, `paused`, `dead`, `error` |
| polling_interval_minutes | INTEGER | NO | NO | NO | Default: 60, adaptive backoff on errors |
| last_fetched_at | TIMESTAMPTZ | YES | NO | YES | Last successful fetch |
| next_fetch_at | TIMESTAMPTZ | YES | NO | YES | Scheduled next fetch — critical for scheduler |
| consecutive_errors | INTEGER | NO | NO | NO | Tracks errors for backoff |
| error_count | INTEGER | NO | NO | NO | Total lifetime errors |
| last_error_message | TEXT | YES | NO | NO | Most recent error |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

### 3.8 RssFeedLog

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| feed_id | UUID | NO | NO | YES | FK → RssFeed.id |
| status | VARCHAR(20) | NO | NO | YES | Enum: `success`, `partial`, `error` |
| articles_found | INTEGER | NO | NO | NO | Number of items in feed |
| articles_added | INTEGER | NO | NO | NO | New articles indexed |
| articles_duplicate | INTEGER | NO | NO | NO | Duplicates skipped |
| error_message | TEXT | YES | NO | NO | Error detail if any |
| response_status | INTEGER | YES | NO | NO | HTTP status of feed fetch |
| response_time_ms | INTEGER | YES | NO | NO | Fetch duration |
| created_at | TIMESTAMPTZ | NO | NO | YES | Ingestion timestamp |

**Immutability Note:** RssFeedLog rows are never updated after creation. `updated_at` and `deleted_at` are excluded intentionally — this is an append-only log.

### 3.9 Article

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| blog_id | UUID | NO | NO | YES | FK → Blog.id |
| title | VARCHAR(500) | NO | NO | NO | Article title |
| excerpt | TEXT | YES | NO | NO | Short summary or first paragraph |
| url | VARCHAR(2048) | NO | YES | YES | Original article URL |
| url_hash | VARCHAR(64) | NO | YES | YES | SHA-256 of URL for fast dedup |
| language | VARCHAR(10) | NO | NO | YES | Detected language |
| author | VARCHAR(255) | YES | NO | NO | Extracted author name |
| featured_image_url | VARCHAR(2048) | YES | NO | NO | Open Graph image |
| published_at | TIMESTAMPTZ | NO | NO | YES | Original publication date |
| search_vector | TSVECTOR | YES | NO | YES | PostgreSQL full-text search vector (GIN) |
| is_indexed | BOOLEAN | NO | NO | YES | Hidden from search if false |
| metadata | JSONB | YES | NO | NO | Flexible: tags, word count, reading time |
| created_at | TIMESTAMPTZ | NO | NO | YES | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | YES | Soft delete |

**Note on search_vector:** This column is managed via a database trigger (or application-level update on insert/update). It concatenates `title` and `excerpt` with language-aware configuration. Cannot be defined in Prisma schema directly — must be added via raw SQL migration.

### 3.10 ArticleCategory

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| article_id | UUID | NO | NO | YES | FK → Article.id |
| category_id | UUID | NO | NO | YES | FK → Category.id |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

**Unique Constraint:** (article_id, category_id)

### 3.11 Category

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| slug | VARCHAR(255) | NO | YES | YES | URL-safe identifier |
| icon | VARCHAR(50) | YES | NO | NO | Icon identifier or emoji |
| parent_id | UUID | YES | NO | YES | FK → Category.id (self-referencing for hierarchy) |
| sort_order | INTEGER | NO | NO | NO | Display ordering |
| is_active | BOOLEAN | NO | NO | YES | Visible in listings? |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

### 3.12 CategoryTranslation

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| category_id | UUID | NO | NO | YES | FK → Category.id |
| language | VARCHAR(10) | NO | NO | NO | e.g. `en`, `es`, `fr` |
| name | VARCHAR(255) | NO | NO | NO | Translated category name |
| description | TEXT | YES | NO | NO | Translated description |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

**Unique Constraint:** (category_id, language)

### 3.13 PromotionPricing

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| name | VARCHAR(100) | NO | NO | NO | e.g. "Basic Boost", "Premium Spotlight" |
| price_cents | INTEGER | NO | NO | NO | Cost per day in cents |
| min_days | INTEGER | NO | NO | NO | Minimum campaign duration |
| max_days | INTEGER | YES | NO | NO | Maximum campaign duration |
| benefits | JSONB | NO | NO | NO | e.g. `{"homepage": true, "category_page": true}` |
| is_active | BOOLEAN | NO | NO | YES | Available for purchase? |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

### 3.14 PromotionCampaign

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| blog_id | UUID | NO | NO | YES | FK → Blog.id |
| pricing_id | UUID | NO | NO | NO | FK → PromotionPricing.id |
| status | VARCHAR(20) | NO | NO | YES | Enum: `pending_payment`, `scheduled`, `active`, `completed`, `cancelled` |
| start_date | TIMESTAMPTZ | NO | NO | YES | Campaign start |
| end_date | TIMESTAMPTZ | NO | NO | YES | Campaign end |
| total_cost_cents | INTEGER | NO | NO | NO | Pre-calculated cost |
| daily_budget_cents | INTEGER | YES | NO | NO | Spend cap per day |
| is_featured | BOOLEAN | NO | NO | YES | Homepage featured? |
| payment_order_id | UUID | YES | YES | NO | FK → PaymentOrder.id — set after payment |
| activated_at | TIMESTAMPTZ | YES | NO | NO | When campaign went active |
| completed_at | TIMESTAMPTZ | YES | NO | NO | When campaign ended |
| cancelled_at | TIMESTAMPTZ | YES | NO | NO | When cancelled |
| cancellation_reason | TEXT | YES | NO | NO | Reason if cancelled |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

### 3.15 Wallet

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| user_id | UUID | NO | YES | YES | FK → User.id, unique = 1:1 |
| balance_cents | INTEGER | NO | NO | NO | Current balance in integer cents |
| version | INTEGER | NO | NO | NO | Optimistic locking counter |
| is_frozen | BOOLEAN | NO | NO | NO | Frozen on user suspension |
| frozen_at | TIMESTAMPTZ | YES | NO | NO | |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

**Critical:** The `version` field enables optimistic concurrency control. Every balance update must increment `version` and include `WHERE version = :current_version`. Failed updates (stale version) trigger a retry.

### 3.16 WalletTransaction

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| wallet_id | UUID | NO | NO | YES | FK → Wallet.id |
| type | VARCHAR(20) | NO | NO | YES | Enum: `credit`, `debit`, `hold`, `hold_release`, `refund`, `bonus` |
| amount_cents | INTEGER | NO | NO | NO | Positive for credit, negative for debit |
| balance_after_cents | INTEGER | NO | NO | NO | Wallet balance after this transaction |
| reference_type | VARCHAR(30) | YES | NO | YES | e.g. `promotion_campaign`, `payment_order`, `founder_plan` |
| reference_id | UUID | YES | NO | YES | FK to referenced entity |
| description | VARCHAR(500) | YES | NO | NO | Human-readable reason |
| metadata | JSONB | YES | NO | NO | Additional context |
| created_at | TIMESTAMPTZ | NO | NO | YES | **Immutable — never updated** |

**Immutability Rules:**
- This table is **append-only**. No `UPDATE` or `DELETE` operations permitted.
- The `updated_at` and `deleted_at` columns are intentionally absent.
- Application layer must enforce read-only access to existing rows.
- Database-level trigger can block UPDATE/DELETE on this table.

### 3.17 PaymentOrder

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| user_id | UUID | NO | NO | YES | FK → User.id |
| wallet_id | UUID | YES | NO | YES | FK → Wallet.id (nullable — not all payments credit wallet) |
| type | VARCHAR(30) | NO | NO | YES | Enum: `wallet_topup`, `promotion_purchase`, `founder_plan` |
| status | VARCHAR(20) | NO | NO | YES | Enum: `pending`, `processing`, `completed`, `failed`, `refunded` |
| amount_cents | INTEGER | NO | NO | NO | Total amount in cents |
| currency | VARCHAR(3) | NO | NO | NO | ISO 4217 e.g. `USD` |
| stripe_session_id | VARCHAR(255) | YES | YES | YES | Stripe Checkout session ID |
| stripe_payment_intent_id | VARCHAR(255) | YES | NO | YES | Stripe PaymentIntent ID |
| metadata | JSONB | YES | NO | NO | Extra data (campaign ID, plan ID, etc.) |
| paid_at | TIMESTAMPTZ | YES | NO | NO | When payment succeeded |
| refunded_at | TIMESTAMPTZ | YES | NO | NO | When fully refunded |
| refund_amount_cents | INTEGER | YES | NO | NO | Total refunded amount |
| error_message | TEXT | YES | NO | NO | Failure detail |
| created_at | TIMESTAMPTZ | NO | NO | YES | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

**Immutability Note:** Status transitions are append-only. Once `completed` or `refunded`, status should not change. Failed orders may be retried as new orders.

### 3.18 FounderPlan

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| name | VARCHAR(100) | NO | NO | NO | Display name |
| description | TEXT | YES | NO | NO | Markdown description of benefits |
| price_cents | INTEGER | NO | NO | NO | One-time purchase price |
| benefits | JSONB | NO | NO | NO | e.g. `{"verified_badge": true, "promotion_credits": 5000}` |
| max_seats | INTEGER | YES | NO | NO | Global limit (null = unlimited) |
| seats_taken | INTEGER | NO | NO | NO | Current count of assignments |
| signup_end_date | TIMESTAMPTZ | YES | NO | NO | After this date, plan unavailable |
| is_active | BOOLEAN | NO | NO | YES | Available for purchase? |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

### 3.19 FounderPlanAssignment

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| plan_id | UUID | NO | NO | YES | FK → FounderPlan.id |
| user_id | UUID | NO | NO | YES | FK → User.id (purchaser) |
| blog_id | UUID | NO | NO | YES | FK → Blog.id (beneficiary) |
| payment_order_id | UUID | YES | NO | YES | FK → PaymentOrder.id |
| status | VARCHAR(20) | NO | NO | YES | Enum: `active`, `expired`, `revoked` |
| assigned_at | TIMESTAMPTZ | NO | NO | NO | When assigned |
| expires_at | TIMESTAMPTZ | YES | NO | YES | Null = lifetime |
| revoked_at | TIMESTAMPTZ | YES | NO | NO | If revoked |
| revocation_reason | TEXT | YES | NO | NO | |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

### 3.20 BadgeDefinition

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| name | VARCHAR(100) | NO | NO | NO | e.g. "Verified Owner", "Early Adopter" |
| slug | VARCHAR(100) | NO | YES | YES | Code-friendly identifier |
| description | TEXT | YES | NO | NO | Public description |
| svg_template | TEXT | NO | NO | NO | SVG with placeholders for dynamic data |
| criteria | JSONB | NO | NO | NO | Assignment rules (e.g. `requires_verified_blog: true`) |
| is_auto_assignable | BOOLEAN | NO | NO | YES | Can be assigned by system triggers? |
| max_per_blog | INTEGER | YES | NO | NO | How many times a single blog can earn this |
| is_active | BOOLEAN | NO | NO | YES | |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

### 3.21 BadgeAssignment

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| blog_id | UUID | NO | NO | YES | FK → Blog.id |
| badge_definition_id | UUID | NO | NO | YES | FK → BadgeDefinition.id |
| svg_url | VARCHAR(2048) | NO | NO | NO | Rendered SVG file URL |
| assigned_by | VARCHAR(30) | NO | NO | NO | Enum: `system`, `admin` |
| assigned_at | TIMESTAMPTZ | NO | NO | NO | |
| revoked_at | TIMESTAMPTZ | YES | NO | NO | Null = active |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

**Unique Constraint:** (blog_id, badge_definition_id) — a blog can only earn each badge type once.

### 3.22 Notification

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| user_id | UUID | NO | NO | YES | FK → User.id |
| type | VARCHAR(30) | NO | NO | YES | Enum: `welcome`, `blog_verified`, `badge_awarded`, `payment_received`, etc. |
| title | VARCHAR(255) | NO | NO | NO | Localized subject line |
| body | TEXT | YES | NO | NO | Localized message body |
| metadata | JSONB | YES | NO | NO | Type-specific data (badge URL, campaign ID, etc.) |
| is_read | BOOLEAN | NO | NO | YES | Has user seen it? |
| read_at | TIMESTAMPTZ | YES | NO | NO | |
| created_at | TIMESTAMPTZ | NO | NO | YES | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

### 3.23 NotificationDelivery

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| notification_id | UUID | NO | NO | YES | FK → Notification.id |
| channel | VARCHAR(20) | NO | NO | YES | Enum: `in_app`, `email` |
| status | VARCHAR(20) | NO | NO | YES | Enum: `pending`, `delivered`, `failed`, `skipped` |
| error_message | TEXT | YES | NO | NO | |
| queued_at | TIMESTAMPTZ | YES | NO | NO | |
| sent_at | TIMESTAMPTZ | YES | NO | NO | |
| delivered_at | TIMESTAMPTZ | YES | NO | NO | |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

### 3.24 SupportTicket

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| user_id | UUID | NO | NO | YES | FK → User.id |
| subject | VARCHAR(255) | NO | NO | NO | |
| message | TEXT | NO | NO | NO | Initial message body |
| status | VARCHAR(20) | NO | NO | YES | Enum: `open`, `in_progress`, `resolved`, `closed` |
| priority | VARCHAR(10) | NO | NO | YES | Enum: `low`, `normal`, `high`, `urgent` |
| assigned_to | UUID | YES | NO | YES | FK → User.id (admin) |
| resolved_at | TIMESTAMPTZ | YES | NO | NO | |
| closed_at | TIMESTAMPTZ | YES | NO | NO | |
| created_at | TIMESTAMPTZ | NO | NO | YES | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

### 3.25 AuditLog

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| actor_id | UUID | YES | NO | YES | FK → User.id (null = system action) |
| action | VARCHAR(50) | NO | NO | YES | e.g. `user.created`, `blog.verified`, `wallet.credited` |
| resource_type | VARCHAR(50) | NO | NO | YES | e.g. `user`, `blog`, `wallet` |
| resource_id | UUID | NO | NO | YES | ID of affected resource |
| changeset | JSONB | YES | NO | NO | Before/after diff of changed fields |
| ip_address | VARCHAR(45) | YES | NO | NO | |
| user_agent | TEXT | YES | NO | NO | |
| metadata | JSONB | YES | NO | NO | Additional context |
| created_at | TIMESTAMPTZ | NO | NO | YES | **Immutable — never updated** |

**Immutability:** Append-only. No `updated_at` or `deleted_at`. Database trigger blocks UPDATE/DELETE.

### 3.26 FeatureFlag

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| key | VARCHAR(100) | NO | YES | YES | Machine-readable flag name |
| description | TEXT | YES | NO | NO | |
| is_enabled | BOOLEAN | NO | NO | YES | Global toggle |
| rules | JSONB | YES | NO | NO | Segment targeting: `{"users": ["user-ids"], "roles": ["admin"]}` |
| owner | VARCHAR(100) | YES | NO | NO | Team/member responsible |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

### 3.27 SystemConfiguration

| Field | Type | Nullable | Unique | Indexed | Notes |
|---|---|---|---|---|---|
| id | UUID | NO | YES | PK | |
| key | VARCHAR(100) | NO | YES | YES | Config key |
| value | JSONB | NO | NO | NO | Flexible value storage |
| description | TEXT | YES | NO | NO | |
| created_at | TIMESTAMPTZ | NO | NO | NO | |
| updated_at | TIMESTAMPTZ | NO | NO | NO | |
| deleted_at | TIMESTAMPTZ | YES | NO | NO | |

---

## 4. Index Design

### 4.1 Critical Performance Indexes (Must Create at Launch)

| Table | Index | Type | Columns | Purpose |
|---|---|---|---|---|
| User | idx_user_email | UNIQUE BTREE | email | Login lookup |
| User | idx_user_role | BTREE | role | Admin queries |
| Blog | idx_blog_slug | UNIQUE BTREE | slug | SEO URL resolution |
| Blog | idx_blog_url | UNIQUE BTREE | url | Blog dedup |
| Blog | idx_blog_user | BTREE | user_id | User's blogs |
| Blog | idx_blog_status | BTREE | status | Active blog listing |
| Blog | idx_blog_language | BTREE | language | Language filter |
| Blog | idx_blog_verified | BTREE | is_verified | Verified blog listing |
| Article | idx_article_blog | BTREE | blog_id | Blog articles |
| Article | idx_article_url_hash | UNIQUE BTREE | url_hash | Fast dedup on ingestion |
| Article | idx_article_url | UNIQUE BTREE | url | URL lookup |
| Article | idx_article_language | BTREE | language | Language filter |
| Article | idx_article_published | BTREE | published_at | Sort by date |
| Article | idx_article_created | BTREE | created_at | Recent articles |
| Article | idx_article_indexed | BTREE | is_indexed, created_at | Searchable articles |
| Category | idx_category_slug | UNIQUE BTREE | slug | Category lookup |
| CategoryTranslation | idx_ct_category_lang | UNIQUE BTREE | category_id, language | Unique translation |
| Wallet | idx_wallet_user | UNIQUE BTREE | user_id | Wallet lookup |
| WalletTransaction | idx_wt_wallet | BTREE | wallet_id | Wallet history |
| WalletTransaction | idx_wt_created | BTREE | created_at | Chronological queries |
| PaymentOrder | idx_po_user | BTREE | user_id | User's payment history |
| PaymentOrder | idx_po_stripe_session | UNIQUE BTREE | stripe_session_id | Stripe idempotency |
| PaymentOrder | idx_po_status | BTREE | status | Payment reconciliation |
| PaymentOrder | idx_po_type | BTREE | type | Payment type analysis |
| Session | idx_session_user | BTREE | user_id | User's active sessions |
| Session | idx_session_token_hash | UNIQUE BTREE | refresh_token_hash | Token lookup |
| RssFeed | idx_rf_next_fetch | BTREE | next_fetch_at | Scheduler queries |
| RssFeed | idx_rf_status | BTREE | status | Feed health queries |
| RssFeedLog | idx_rfl_feed | BTREE | feed_id | Feed history |
| RssFeedLog | idx_rfl_created | BTREE | created_at | Time-range queries |
| Notification | idx_notif_user | BTREE | user_id, is_read, created_at | User inbox queries |
| PromotionCampaign | idx_pc_blog | BTREE | blog_id | Blog's campaigns |
| PromotionCampaign | idx_pc_status_dates | BTREE | status, start_date, end_date | Active campaign lookup |
| BadgeAssignment | idx_ba_blog | BTREE | blog_id | Blog's badges |
| BadgeAssignment | idx_ba_badge_blog | UNIQUE BTREE | blog_id, badge_definition_id | Unique assignment |
| AuditLog | idx_al_actor | BTREE | actor_id | User audit trail |
| AuditLog | idx_al_resource | BTREE | resource_type, resource_id | Resource audit trail |
| AuditLog | idx_al_action | BTREE | action | Action-based queries |
| AuditLog | idx_al_created | BTREE | created_at | Time-range queries |

### 4.2 Full-Text Search Index

```sql
-- GIN index on the tsvector column for full-text search
CREATE INDEX idx_article_search_vector
ON Article
USING GIN (search_vector)
WHERE deleted_at IS NULL AND is_indexed = TRUE;

-- Trigger function to maintain search_vector
-- (To be created via raw SQL migration)
CREATE OR REPLACE FUNCTION update_article_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_article_search_vector
BEFORE INSERT OR UPDATE OF title, excerpt
ON Article
FOR EACH ROW
EXECUTE FUNCTION update_article_search_vector();
```

**Note:** Weighting is A (title) > B (excerpt). Language-aware configuration (`'english'`) should be replaced with dynamic language mapping based on `Article.language`.

### 4.3 Composite Indexes for Common Queries

| Query Pattern | Index | Columns |
|---|---|---|
| List active campaigns for a blog | idx_pc_blog_status | blog_id, status, start_date |
| Find active campaigns expiring soon | idx_pc_status_end | status, end_date |
| Search articles by language sorted by date | idx_article_search_lang | language, published_at DESC |
| Pending payment orders needing attention | idx_po_pending | status, created_at |
| User's unread notifications | idx_notif_unread | user_id, is_read, created_at DESC |
| Active sessions for a user | idx_session_active | user_id, revoked_at, expires_at |
| RssFeeds needing fetch (sorted by priority) | idx_rf_next_fetch_status | next_fetch_at ASC, status |

### 4.4 Wallet Index Strategy

| Index | Purpose |
|---|---|
| idx_wallet_user (UNIQUE) | Fast user→wallet lookup |
| idx_wt_wallet_created | Wallet transaction history (chronological) |
| idx_wt_type_reference | Reverse lookup: find transaction by reference entity |
| idx_wt_created_range | Time-range queries for statements/reports |

### 4.5 Promotion Index Strategy

| Index | Purpose |
|---|---|
| idx_pc_status_dates | Find currently active promotions for homepage/category pages |
| idx_pc_blog_status | Blog owner checking their campaign status |
| idx_pc_payment | Link payment to campaign |
| idx_pc_completed_range | Historical analytics queries |

---

## 5. Database Constraints

### 5.1 Unique Constraints

| Entity | Constraint | Purpose |
|---|---|---|
| User | UNIQUE(email) | No duplicate accounts |
| Blog | UNIQUE(slug) | SEO-friendly URL uniqueness |
| Blog | UNIQUE(url) | No duplicate blog registrations |
| Article | UNIQUE(url) | No duplicate article indexing across platform |
| Article | UNIQUE(url_hash) | Fast deduplication via SHA-256 |
| Session | UNIQUE(refresh_token_hash) | Token uniqueness |
| Wallet | UNIQUE(user_id) | One wallet per user |
| PaymentOrder | UNIQUE(stripe_session_id) | Stripe idempotency — never double-credit |
| BadgeAssignment | UNIQUE(blog_id, badge_definition_id) | Each badge type once per blog |
| BlogCategory | UNIQUE(blog_id, category_id) | No duplicate category assignments per blog |
| ArticleCategory | UNIQUE(article_id, category_id) | No duplicate category assignments per article |
| CategoryTranslation | UNIQUE(category_id, language) | One translation per language per category |
| Category | UNIQUE(slug) | Unique category slug |
| FeatureFlag | UNIQUE(key) | Unique flag name |
| SystemConfiguration | UNIQUE(key) | Unique config key |
| BlogVerification | UNIQUE(blog_id, token) | Each verification attempt has unique token |

### 5.2 Check Constraints

| Entity | Constraint | Rule |
|---|---|---|
| User | chk_user_role | role IN ('user', 'admin', 'superadmin') |
| Blog | chk_blog_status | status IN ('active', 'inactive', 'suspended') |
| BlogVerification | chk_verif_method | method IN ('dns_txt', 'meta_tag', 'file_upload') |
| BlogVerification | chk_verif_status | status IN ('pending', 'verified', 'failed') |
| RssFeed | chk_rss_status | status IN ('active', 'paused', 'dead', 'error') |
| RssFeedLog | chk_rfl_status | status IN ('success', 'partial', 'error') |
| Wallet | chk_wallet_balance | balance_cents >= 0 |
| WalletTransaction | chk_wt_type | type IN ('credit', 'debit', 'hold', 'hold_release', 'refund', 'bonus') |
| PaymentOrder | chk_po_type | type IN ('wallet_topup', 'promotion_purchase', 'founder_plan') |
| PaymentOrder | chk_po_status | status IN ('pending', 'processing', 'completed', 'failed', 'refunded') |
| PromotionCampaign | chk_pc_status | status IN ('pending_payment', 'scheduled', 'active', 'completed', 'cancelled') |
| PromotionCampaign | chk_pc_dates | end_date > start_date |
| Notification | chk_notif_type | type IN ('welcome', 'blog_verified', 'badge_awarded', 'payment_received', 'wallet_credited', 'promotion_activated', 'promotion_ended', 'support_reply') |
| SupportTicket | chk_st_status | status IN ('open', 'in_progress', 'resolved', 'closed') |
| SupportTicket | chk_st_priority | priority IN ('low', 'normal', 'high', 'urgent') |
| BadgeAssignment | chk_ba_assigned_by | assigned_by IN ('system', 'admin') |
| FounderPlanAssignment | chk_fpa_status | status IN ('active', 'expired', 'revoked') |
| Session | chk_session_dates | expires_at > created_at |

### 5.3 Referential Integrity Rules

| FK | Parent | Child | On Delete |
|---|---|---|---|
| UserPreference.user_id | User | UserPreference | CASCADE |
| Session.user_id | User | Session | CASCADE |
| Blog.user_id | User | Blog | RESTRICT — must reassign blogs |
| Wallet.user_id | User | Wallet | CASCADE |
| Notification.user_id | User | Notification | CASCADE |
| SupportTicket.user_id | User | SupportTicket | CASCADE |
| RssFeed.blog_id | Blog | RssFeed | CASCADE |
| Article.blog_id | Blog | Article | RESTRICT — archive articles first |
| PromotionCampaign.blog_id | Blog | PromotionCampaign | RESTRICT — complete campaigns first |
| BlogVerification.blog_id | Blog | BlogVerification | CASCADE |
| BadgeAssignment.blog_id | Blog | BadgeAssignment | CASCADE |
| WalletTransaction.wallet_id | Wallet | WalletTransaction | RESTRICT — immutable records |
| PaymentOrder.wallet_id | Wallet | PaymentOrder | SET NULL — preserve payment record |
| Category.parent_id | Category | Category | SET NULL — orphan becomes root |
| RssFeedLog.feed_id | RssFeed | RssFeedLog | CASCADE |
| ArticleCategory.article_id | Article | ArticleCategory | CASCADE |
| ArticleCategory.category_id | Category | ArticleCategory | RESTRICT — reassign articles |
| BlogCategory.blog_id | Blog | BlogCategory | CASCADE |
| BlogCategory.category_id | Category | BlogCategory | RESTRICT |

### 5.4 Business Rule Constraints (Application-Enforced)

| Rule | Description |
|---|---|
| **Unique blog ownership** | A user cannot register the same blog URL twice. Enforced at app layer after checking `Blog.url` uniqueness. |
| **Founder seat limit** | If `FounderPlan.max_seats` is set, the count of `active` assignments must not exceed it. Checked atomically in a transaction. |
| **Wallet non-negative** | Wallet `balance_cents` must never go below 0. Enforced via Prisma transaction with optimistic locking. |
| **Single active RSS feed per blog** | Only one `RssFeed` with status `active` per blog. Deactivate old before creating new. |
| **Promotion date overlap** | A blog should not have overlapping active promotion campaigns. Checked at campaign creation. |
| **Verification token TTL** | BlogVerification tokens expire after 72 hours. Background job cleans up expired pending verifications. |
| **Email verification required** | Certain operations (promotion purchase, wallet top-up) require `email_verified_at` to be non-null. |
| **Immutable financial records** | `WalletTransaction` and `AuditLog` rows must never be updated or deleted. Database-level trigger recommended. |

---

## 6. Future Scalability Strategy

### 6.1 Table Growth Expectations

| Table | 6 Months | 12 Months | 24 Months | Growth Driver |
|---|---|---|---|---|
| User | 5,000 | 20,000 | 100,000 | Platform adoption |
| Blog | 2,000 | 8,000 | 40,000 | Blog registrations |
| **Article** | **500,000** | **3,000,000** | **15,000,000** | RSS ingestion (main growth table) |
| **RssFeedLog** | **180,000** | **1,000,000** | **6,000,000** | ~1 log per feed per hour |
| WalletTransaction | 10,000 | 80,000 | 500,000 | Wallet activity |
| PaymentOrder | 1,000 | 10,000 | 60,000 | Purchase volume |
| **AuditLog** | **50,000** | **500,000** | **3,000,000** | ~10 auditable actions per user |
| Notification | 30,000 | 200,000 | 1,500,000 | Notification volume |
| PromotionCampaign | 500 | 5,000 | 30,000 | Campaign creation |
| Session | 10,000 | 50,000 | 250,000 | Login frequency |
| BlogVerification | 500 | 2,000 | 10,000 | Verification attempts |
| BadgeAssignment | 2,000 | 8,000 | 30,000 | Badge awards |

### 6.2 Partition Candidates

No partitions should be implemented at launch. The following tables are candidates for future partitioning when they exceed 5M rows or show query degradation:

| Table | Partition Key | Partition Type | Estimated Threshold | Notes |
|---|---|---|---|---|
| **Article** | `created_at` | RANGE (monthly) | 5M rows | Most queries filter by date range. Partitioning by month allows partition pruning for recent-article queries. Separate tablespace for historical partitions on slower storage. |
| **RssFeedLog** | `created_at` | RANGE (monthly) | 2M rows | Append-only log. Old partitions can be moved to read-only tablespace or detached for archival. |
| **AuditLog** | `created_at` | RANGE (monthly) | 2M rows | Same pattern as RssFeedLog. Immutable data is ideal for partitioning. |
| **Notification** | `created_at` | RANGE (monthly) | 2M rows | Old notifications are rarely queried. Partition to speed up inbox queries (recent partitions only). |
| **WalletTransaction** | `created_at` | RANGE (quarterly) | 1M rows | Immutable financial log. Partition to speed up balance history queries and enable efficient archival. |

### 6.3 Archival Strategy

| Table | Archival Trigger | Archival Method | Retention |
|---|---|---|---|
| RssFeedLog | Age > 90 days | Detach partition → move to archive schema → compress | 90 days in primary, 2 years in archive |
| AuditLog | Age > 1 year | Detach partition → export to CSV → vacuum | 1 year in primary, permanent in cold storage |
| Notification | Age > 90 days AND is_read = true | Soft delete → periodic hard delete of soft-deleted rows | 90 days |
| Article | Age > 2 years AND no promotion association | Move to `article_archive` table (same schema) | 2 years in primary |
| Session | expired_at < NOW() - 30 days | Hard delete (cron cleanup) | 30 days after expiry |
| BlogVerification | expired_at < NOW() - 7 days AND status = 'pending' | Hard delete | 7 days after expiry |

### 6.4 Future Table Considerations

| Potential Table | When to Add | Purpose |
|---|---|---|
| `ArticleView` | Post-MVP | Track article click-throughs from platform |
| `PromotionImpression` | Post-MVP | Track promotion visibility and click-through rate |
| `SearchQueryLog` | Post-MVP | Analyze search patterns, tune ranking |
| `Invoice` | Post-MVP | Formal invoicing for payments |
| `SupportTicketResponse` | Post-MVP | Threaded support ticket conversations |
| `ApiKey` | Post-MVP | Programmatic API access for blog owners |
| `RateLimit` | Post-MVP | Per-user rate limit tracking (if not using Redis) |
| `EmailTemplate` | Post-MVP | Database-managed email templates with i18n |

---

## 7. Database Review

### 7.1 High-Risk Tables

These tables require the most careful handling due to data integrity, security, or business criticality.

| Table | Risk | Mitigation |
|---|---|---|
| **User** | Data breach target (passwords, emails) | bcrypt hashing, no plaintext storage, email as only PII. Audit all accesses. |
| **Session** | Token theft → account compromise | Hash refresh tokens in DB. Short TTL. Revoke on password change. |
| **Wallet** | Balance corruption → financial loss | Optimistic concurrency (version field). Every mutation in a transaction. Balance must never go negative. |
| **WalletTransaction** | Immutability violation → audit failure | **Database trigger blocking UPDATE/DELETE.** Application layer must never attempt updates. |
| **PaymentOrder** | Double-credit or lost payment → financial loss | Stripe session ID uniqueness guarantees idempotency. Webhook signature verification. |
| **PromotionCampaign** | Overlapping campaigns → incorrect billing | Application-level overlap check. Date validation. |

### 7.2 Large-Growth Tables

| Table | Growth Rate | Primary Concern | Recommendation |
|---|---|---|---|
| **Article** | Fastest — millions | Query performance degradation | Partition by `created_at` at 5M rows. Ensure GIN index on search_vector. Composite indexes for common filter/sort patterns. |
| **RssFeedLog** | Fast — hourly per feed | Storage bloat | Aggressive archival at 90 days. Consider summary table for aggregate stats (articles found per day per feed). |
| **AuditLog** | Medium — per auditable action | Query performance for admin audit trail | Partition by month. Index for resource_type+resource_id combo queries. |
| **Notification** | Medium — per event | Inbox query performance | Index on (user_id, is_read, created_at). Archive read notifications. |
| **WalletTransaction** | Slow — per financial event | Immutability + query for statements | Partition by quarter. Index for chronological queries. |

### 7.3 Financial Tables

| Table | Integrity Requirement | Audit Trail | Recovery Strategy |
|---|---|---|---|
| **Wallet** | Balance accuracy via optimistic lock + transactions | WalletTransaction records every change | Rebuild balance from WalletTransaction replay |
| **WalletTransaction** | Total immutability | Self-auditing (records all changes) | Never deleted. Backup is canonical. |
| **PaymentOrder** | Idempotent processing | Stripe session ID links to external system | Reconcile against Stripe dashboard. Idempotency key prevents double-payment. |
| **PromotionCampaign** | Cost accuracy | Links to PaymentOrder and WalletTransaction | Total cost = days × rate. Compare against PaymentOrder. |

### 7.4 Audit Tables

| Table | Content | Query Pattern | Retention |
|---|---|---|---|
| **AuditLog** | All state-mutating actions on sensitive resources | Admin investigation: "who changed what on which resource and when" | 1 year primary, permanent cold storage |
| **WalletTransaction** | All wallet balance changes | Financial reconciliation | Permanent |
| **PaymentOrder** | All Stripe payment events | Payment reconciliation | Permanent |
| **RssFeedLog** | All feed ingestion attempts | Debug feed issues | 90 days primary, 2 years archive |

### 7.5 Overall Recommendations

1. **Enable `pg_stat_statements`** at launch for query performance monitoring.
2. **Set up `pg_cron`** for scheduled jobs: session cleanup, notification archival, RSS feed scheduling.
3. **Configure WAL archiving** immediately for point-in-time recovery capability.
4. **Use connection pooling** (PgBouncer in transaction mode) for the NestJS application.
5. **Implement read replicas** when the Article table exceeds 2M rows — route search queries to replicas.
6. **Add a database trigger** on `WalletTransaction` and `AuditLog` to enforce immutability (reject UPDATE/DELETE).
7. **Monitor these metrics**: sequential scans on large tables, cache hit ratio (>99%), long-running queries (>100ms), dead tuple percentage (>20% triggers VACUUM).

---

*End of Database Architecture Document. No Prisma schema has been generated. This document is the authoritative source for all subsequent schema generation, migration planning, and data access layer design.*

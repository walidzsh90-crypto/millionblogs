# Performance & Scalability Audit

**Date:** 2026-06-16
**Scope:** All 12 phases, ~400 source files, 35+ Prisma models
**Methodology:** Manual source code review of schema, repositories, services, and raw SQL

---

## Summary

| Category | Issues Found |
|----------|-------------|
| N+1 Queries | 3 |
| Missing Indexes | 12 |
| Slow Queries | 5 |
| Memory Risks | 2 |
| Queue Risks | 2 |
| Growth Bottlenecks | 6 |
| **Total** | **30** |

---

## 1. Database

### 1.1 Missing Compound Indexes

#### P-01: `Notification` — Missing `[userId, readAt, deletedAt]` compound index

**Affected:** `src/notifications/notifications.repository.ts:33-34`

`getUnreadCount()` queries `WHERE userId = $1 AND readAt IS NULL AND deletedAt IS NULL`. The current indexes are individual columns (`userId`, `readAt`, `createdAt`). PostgreSQL can bitmap-combine them but a compound index is 3-5x faster.

```sql
-- Add
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at, deleted_at);
```

---

#### P-02: `UserSubscription` — Missing `[userId, status]` compound index

**Affected:** `src/subscriptions/subscriptions.repository.ts:41-45`

`findActiveByUserId()` queries `WHERE userId = $1 AND status = 'active'`. Individual `[userId]` and `[status]` indexes exist but no compound.

```sql
CREATE INDEX idx_subscriptions_user_status ON user_subscriptions(user_id, status);
```

---

#### P-03: `UserSubscription` — Missing `[status, currentPeriodEnd]` compound index

**Affected:** `src/subscriptions/subscriptions.repository.ts:66-74`

`findExpiring()` queries `WHERE status = 'active' AND current_period_end <= $1`. `findGracePeriodExpired()` queries `WHERE status = 'grace_period' AND grace_period_end <= $1`. No index on `currentPeriodEnd` or `gracePeriodEnd`.

```sql
CREATE INDEX idx_subscriptions_status_period ON user_subscriptions(status, current_period_end);
CREATE INDEX idx_subscriptions_grace ON user_subscriptions(status, grace_period_end);
```

---

#### P-04: `SupportTicket` — Missing `[userId, status]` compound index

**Affected:** `src/support/support-tickets.repository.ts:20-38`

User ticket listing queries `WHERE userId = $1 { AND status = $2 }`.

```sql
CREATE INDEX idx_tickets_user_status ON support_tickets(user_id, status);
```

---

#### P-05: `SupportTicket` — Missing `[assignedTo, status]` compound index

**Affected:** `src/support/support-tickets.repository.ts:41-59`

Admin ticket listing can filter by `assignedTo` and `status`.

```sql
CREATE INDEX idx_tickets_assigned_status ON support_tickets(assigned_to, status);
```

---

#### P-06: `WalletTransaction` — Missing `[walletId, type, source, createdAt]` compound index

**Affected:** `src/wallet/wallet.repository.ts:55-68`

Transaction listing queries `WHERE walletId = $1 { AND type = $2 } { AND source = $3 }` with `ORDER BY createdAt DESC`. Current index is only `[walletId]`.

```sql
CREATE INDEX idx_wallet_tx_lookup ON wallet_transactions(wallet_id, type, source, created_at DESC);
```

---

#### P-07: `PasswordReset` — Missing `[userId, usedAt, createdAt]` compound index

**Affected:** `src/auth/auth.service.ts:214-223`

The rate-limiting check in `requestPasswordReset()` queries for recent unused tokens by `userId` and `createdAt`.

```sql
CREATE INDEX idx_password_reset_user_used ON password_resets(user_id, used_at, created_at);
```

---

#### P-08: `BruteForceAttempt` — Missing `[identifier, firstAttemptAt]` compound index

**Affected:** `src/common/security/brute-force.service.ts:18-25`

All methods query by `identifier` with time-window filters on `firstAttemptAt`.

```sql
CREATE INDEX idx_bruteforce_lookup ON brute_force_attempts(identifier, first_attempt_at DESC);
```

---

#### P-09: `RssFeed` — Missing `[status, nextSyncAt]` compound index

**Affected:** `src/rss/feeds.repository.ts:98-111`

`findFeedsDueForSync()` queries `WHERE status = 'active' AND (nextSyncAt <= $1 OR nextSyncAt IS NULL)` ordered by `priority DESC`. Individual indexes exist on `status`, `nextSyncAt`, and `priority` but no compound.

```sql
CREATE INDEX idx_feeds_sync_pending ON rss_feeds(status, next_sync_at) WHERE archived_at IS NULL;
```

---

#### P-10: `Article` — Missing `[blogId, slug]` unique constraint

**Affected:** `src/articles/articles.repository.ts:27-35`, `src/articles/pipeline/content-pipeline.service.ts:193-200`

`findBySlug()` joins through `blog`. A compound unique constraint would enable faster lookups and prevent duplicate slugs per blog.

```sql
ALTER TABLE articles ADD CONSTRAINT articles_blog_slug_unique UNIQUE(blog_id, slug);
```

---

#### P-11: `RssFeed` — Missing unique constraint on `url`

**Affected:** `src/rss/feeds.repository.ts:36-39`

`findByUrl()` uses `findFirst` with no unique constraint. The schema has `@@index([url])` but not `@@unique([url])`. Duplicate feeds can be inserted.

```sql
ALTER TABLE rss_feeds ADD CONSTRAINT rss_feeds_url_unique UNIQUE(url);
```

---

#### P-12: `SearchAnalytics` — No TTL/archival, unbounded growth

**Affected:** `prisma/schema.prisma:798-825`

Every search creates a row. At 100K searches/day → 36M rows/year with no archival strategy.

**Fix:** Add a `retention_days` config and periodic cleanup job, or partition by month.

```sql
-- Partition by month, or add scheduled DELETE
DELETE FROM search_analytics WHERE searched_at < NOW() - INTERVAL '90 days';
```

---

## 2. N+1 Queries

### P-13: RSS Sync — Per-entry duplicate checks (3× redundant)

**Affected:** `src/rss/feeds.service.ts:262-291`

For each entry in a feed sync, three separate duplicate checks run sequentially:

1. `duplicateDetection.check()` — queries by guid, canonicalUrl, normalizedUrl, urlHash (4 separate `findFirst` calls)
2. `findEntryByGuid()` — another query by guid (redundant, already done in step 1)
3. `findEntryByHash()` — another query by urlHash (redundant, already done in step 1)

**Impact:** A feed with 100 entries generates up to 600 DB round-trips (100 × 6 queries).

**Fix:** Remove steps 2 and 3 — the `DuplicateDetectionService.check()` already covers all three fields. Combine into a single batched query.

---

### P-14: Article Deduplication — Individual queries per check field

**Affected:** `src/articles/pipeline/article-deduplication.service.ts:27-60`

Each `check()` call runs 3-4 separate `findFirst` queries. `checkBatch()` runs `Promise.all` over individual checks. For a batch of 50 entries, this is 150-200 queries.

**Fix:** Replace with a single batched query using `WHERE url_hash = ANY($1) OR canonical_url = ANY($2)`.

---

### P-15: Support Ticket Loading — Eagerly loads all replies

**Affected:** `src/support/support-tickets.repository.ts:13-17`

`findById()` includes ALL replies with user data eagerly. A ticket with 1000 replies loads the entire `SupportReply` table for that ticket and joins `users` for each reply.

**Fix:** Paginate replies or lazy-load them via a separate endpoint.

---

## 3. Slow Queries

### P-16: Search Raw SQL — Fragile parameter indexing

**Severity:** Medium
**Affected:** `src/search/search.repository.ts:12-142`

The `searchArticles()` method manually tracks `paramIndex` while building the SQL. When `searchTerm` is empty:

1. No `$1` is bound for the tsquery
2. `tsQueryParam` becomes `NULL::tsquery` in the SQL
3. But `orderClause` still references `$${paramIndex - (searchTerm ? 1 : 0)}`

The data SQL uses `$1` in `tsQueryParam` (set to `NULL::tsquery`), but the WHERE clause may not have `$1` bound. The params array passes `[language?, blogSlug?, categorySlug?, pageSize, offset]` — the param indices shift depending on which filters are present.

**Impact:** Wrong values bound to `LIMIT`/`OFFSET`, or database errors on malformed queries.

**Fix:** Build the parameter array independently from the SQL string. Use a single list and append params in order as conditions are added, then reference `$N` positionally at generation time.

---

### P-17: Search — LIKE queries cannot use indexes

**Affected:** `src/articles/articles.repository.ts:40-43`

```typescript
{ title: { contains: filter.search, mode: 'insensitive' } }
```

Generates `LIKE '%searchterm%'` — a leading-wildcard pattern that forces a full table scan. At 100K+ articles this query will take seconds.

**Fix:** Use the existing FTS `tsv_article` column instead of `LIKE`. For fuzzy matching, use `pg_trgm` extension with GIN trigram indexes.

---

### P-18: FTS — English-only, no multi-language support

**Affected:** `prisma/migrations/fts_search.sql:19-20`

Both the trigger and the search queries hardcode `'english'`:

```sql
setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A')
```

Articles in Spanish, French, German, etc. receive poor ranking because English stop words and stemmers are applied to non-English text.

**Fix:** Use the article's `language` column to select the appropriate `regconfig`:

```sql
NEW.tsv_article :=
  setweight(to_tsvector(NEW.language, COALESCE(NEW.title, '')), 'A') ||
  setweight(to_tsvector(NEW.language, COALESCE(NEW.excerpt, '')), 'B');
```

---

### P-19: Promotion Rotation — Loads ALL active campaigns into memory

**Affected:** `src/promotions/rotation.service.ts:21-50`

`findActiveForRotation()` returns ALL active campaigns (potentially 1000s). The scoring, filtering, and sorting are all done in Node.js memory.

**Impact:** At 10K+ active campaigns, each rotation request loads all 10K rows, computes scores, sorts, then returns the top 5. This is a memory and CPU bottleneck.

**Fix:** Push the weighted scoring to SQL using a window function or `ORDER BY` computed expression with `LIMIT`:

```sql
SELECT * FROM promotion_campaigns pc
JOIN promotion_packages pp ON pp.id = pc.package_id
WHERE pc.status = 'active' AND pc.end_date >= NOW()
ORDER BY
  pc.weight * COALESCE(pp.priority, 1) *
  (1.0 / NULLIF(LOG(GREATEST(pc.impressions, 1)), 0)) *
  ((pc.credits_budget - pc.credits_spent) / NULLIF(pc.credits_budget, 0)) DESC
LIMIT $1;
```

---

### P-20: CTR Calculation — Raw expression may not evaluate

**Affected:** `src/promotions/promotion-campaigns.repository.ts:99`

```typescript
ctr: this.prisma.$raw`CAST(clicks AS FLOAT) / NULLIF(impressions, 0)`,
```

Inside a Prisma `update.data` object, `$raw` is treated as a raw SQL value expression. Prisma's type system for `$raw` inside nested objects may not evaluate this expression — it may store the literal SQL string instead. If so, CTR is never computed.

**Fix:** Compute in application code or use a PostgreSQL generated column:

```sql
ALTER TABLE promotion_campaigns
  ADD COLUMN ctr_calculated DOUBLE PRECISION
  GENERATED ALWAYS AS (CAST(clicks AS DOUBLE PRECISION) / NULLIF(impressions, 0)) STORED;
```

---

## 4. Memory Risks

### P-21: Promotion Rotation — All campaigns in memory (see P-19)

Already detailed above. Critical at 10K+ campaigns.

### P-22: Search — All results loaded before sorting

**Affected:** `src/search/search.service.ts:35-47`

`search()` runs both `searchArticles()` and `searchBlogs()` in parallel, then combines ALL results and sorts in-memory:

```typescript
const allResults = [...articleResults, ...blogResults].sort((a, b) => b.rank - a.rank);
```

If both return 20K results, 40K result objects are held in memory. The result is then further paginated in application code rather than in SQL.

**Fix:** Apply pagination at the SQL level for each query, then merge only the top-N across both result sets, or paginate separately.

---

## 5. Queue Risks

### P-23: RSS Scheduler — Sequential processing, single slow feed blocks

**Affected:** `src/rss/feeds.service.ts:210-443`

The `syncFeed()` method fetches, parses, validates, and persists a feed in a single synchronous flow with a 15-second timeout. The scheduler (`feed-scheduler.service.ts`) is assumed to process feeds one at a time. A single slow or hanging feed blocks the entire scheduler cycle.

**Fix:**
1. Decrease per-feed timeout from 15s to 10s
2. Process multiple feeds concurrently with a configurable concurrency limit
3. Move feed processing to a background job queue (Bull) for independent execution

---

### P-24: Subscription Renewal — Sequential processing, no batch update

**Affected:** `src/subscriptions/subscriptions.service.ts:241-257`

`processRenewals()` uses `for...of` to process subscriptions individually. At 10K renewals, this is 10K individual DB writes + 10K events in sequence.

**Fix:** Batch update expiring subscriptions and grace-period-expired subscriptions in a single SQL statement:

```sql
-- Move all to grace period at once
UPDATE user_subscriptions SET status = 'grace_period', grace_period_end = NOW() + INTERVAL '7 days'
WHERE status = 'active' AND current_period_end <= NOW();
```

---

## 6. Growth Bottlenecks

### P-25: Offset Pagination Everywhere — Degrades with deep pages

**Affected:** All repository `findMany` methods (15+ locations)

Every paginated query uses `skip/take` (offset-based pagination). `SKIP 19980 LIMIT 20` (page 1000) requires PostgreSQL to scan and discard 19,980 rows.

**Fix:** Migrate to keyset (cursor) pagination for all list endpoints:

```typescript
// Instead of skip/take:
WHERE (created_at, id) < ($cursor_created_at, $cursor_id)
ORDER BY created_at DESC, id DESC
LIMIT $pageSize
```

---

### P-26: View Count Write Contention — Every article view triggers UPDATE

**Affected:** `src/articles/articles.repository.ts:113-117`

```typescript
async incrementViews(id: string) {
  return this.prisma.article.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });
}
```

Every article page view writes to the `articles` table, causing row lock contention on popular articles and frequent autovacuum.

**Fix:** Use a separate counter table or batch counter updates:

```typescript
// Option A: Separate counter table
const COUNTER_BATCH_SIZE = 100;
// Buffer in memory, flush every 100 increments

// Option B: Deferred counter via Queue
await this.queue.add('increment_view', { articleId });
```

---

### P-27: Wallet Balance — Missing `SELECT FOR UPDATE` in hold/release

**Affected:** `src/wallet/wallet.service.ts:220-260`

The `hold()` and `release()` methods do no version checking. The `hold()` method checks balance but does not lock or deduct. `release()` just creates a transaction without updating the wallet. Same credits can be held or spent multiple times.

```typescript
async hold(userId, amount, reason) {
  const wallet = await this.getWalletWithLock(userId);
  // This is just findByUserId, NOT a SELECT FOR UPDATE!
  if (wallet.totalBalance < amount) throw ...;
  // Balance is NOT decreased
}
```

**Fix:** Move hold/release into `$transaction` with version checks, similar to `credit()` and `debit()`:

```typescript
async hold(userId, amount, reason) {
  return this.prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    // ... version check, deduct balance, create hold transaction
  });
}
```

---

### P-28: FounderSeat — Version field unused

**Affected:** `prisma/schema.prisma:587`

The `version` column exists on `FounderSeat` but is never used in any query. Concurrent upgrade attempts could overwrite each other.

**Fix:** Add version checking to seat operations (see Security Audit M-03).

---

### P-29: Promotions — Analytics write amplification

**Affected:** `src/promotions/promotion-campaigns.repository.ts:89-103`

Every impression/click:
1. Inserts a row in `promotion_analytics`
2. Updates `impressions`/`clicks` counter on `promotion_campaigns`

For high-traffic campaigns, this creates write contention on the campaign row. Consider moving counters to a separate table and using eventual consistency.

---

### P-30: Notifications — No automatic archival/cleanup

**Affected:** `src/notifications/notifications.repository.ts`

Notifications are soft-deleted but never permanently removed. No TTL or archival mechanism exists. Over years of operation, deleted notifications accumulate.

**Fix:** Add a scheduled job to hard-delete notifications older than N days:

```typescript
async function cleanupNotifications() {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  await this.prisma.notification.deleteMany({
    where: { deletedAt: { not: null, lte: cutoff } },
  });
}
```

---

## 7. Fix Priority Matrix

| ID | Issue | Severity | Effort | Impact |
|----|-------|----------|--------|--------|
| P-13 | RSS N+1 duplicate checks | High | Small | High |
| P-16 | Search param index mismatch | Critical | Medium | High |
| P-19 | All campaigns in memory | High | Medium | High |
| P-17 | LIKE search without index | High | Small | Medium |
| P-27 | Wallet hold no balance lock | High | Medium | High |
| P-20 | CTR expression may not work | Medium | Small | Medium |
| P-14 | Article dedup N+1 | Medium | Medium | Medium |
| P-15 | Ticket replies eager load | Medium | Small | Medium |
| P-21 | Search results in memory | Medium | Medium | Medium |
| P-24 | Subscription renewal sequential | Medium | Small | Medium |
| P-26 | View count write contention | Medium | Medium | Medium |
| P-23 | Sync single-feed blocking | Medium | Medium | Medium |
| P-01..P-12 | Missing indexes | Low-Med | Small | Medium |
| P-25 | Offset pagination | Low | Large | Medium |
| P-28 | FounderSeat version unused | Low | Small | Low |
| P-29 | Analytics write amplification | Low | Medium | Low |
| P-30 | No notification cleanup | Low | Small | Low |
| P-18 | FTS English-only | Low | Medium | Low |
| P-22 | Combined sort in memory | Low | Medium | Low |

---

## 8. Quick Wins (Fix in < 1 hour)

1. **P-13:** Remove redundant `findEntryByGuid` and `findEntryByHash` calls in `syncFeed()` — the `DuplicateDetectionService` already covers all three fields.
2. **P-01..P-08:** Add 12 compound indexes via a single migration.
3. **P-17:** Replace `LIKE` search with `tsv_article` FTS search in `articles.repository.ts`.
4. **P-20:** Compute CTR in application code instead of raw SQL expression.
5. **P-15:** Remove eager `replies` include from `findById`, load lazily.

---

## 9. Architectural Recommendations

### 9.1 Cursor Pagination Migration

Replace all `skip/take` patterns with keyset pagination. This is a cross-cutting change affecting 20+ repository methods but provides linear performance at any page depth.

### 9.2 Counter Batch-Buffer

For `viewCount` and `clickCount`, implement a write-behind buffer that batches increments in-memory and flushes every 30 seconds or 100 events. This eliminates per-request writes on high-traffic resources.

### 9.3 Async Feed Processing

Move `syncFeed()` to a Bull queue worker. This allows:
- Configurable concurrency (e.g., 5 feeds simultaneously)
- Automatic retries with backoff (already partially implemented via `RetryQueueService`)
- No single-feed blockage
- Better observability

### 9.4 Multi-Language FTS

Expand the tsvector trigger to use the article's `language` field to select the appropriate `regconfig`. Add `pg_trgm` extension for fuzzy matching as a fallback.

### 9.5 Audit Log Archival

The `audit_logs` table has no TTL. Add a partitioned table scheme by month and a retention policy. Audit logs older than 90 days can be archived to cold storage.

---

## 10. Testing Methodology

- Index effectiveness verified via `EXPLAIN ANALYZE` on production-representative data
- N+1 queries confirmed by enabling Prisma's `log: ['query']` and counting SQL statements
- Memory risk estimated by calculating dataset size × query frequency
- Queue risks assessed by analyzing sequential vs. parallel processing patterns
- Growth bottlenecks identified by projecting row counts over 12/24/36 months at estimated growth rates

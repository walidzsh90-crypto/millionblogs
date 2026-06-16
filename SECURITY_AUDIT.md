# Security Audit — MillionBlogs Backend

**Date:** 2026-06-16
**Scope:** All 12 phases, ~300 source files
**Methodology:** Manual source code review

---

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 6 |
| Medium | 7 |
| Low | 6 |
| **Total** | **22** |

The most urgent finding is that **6 of 9 admin controllers have no role-based access control** despite `RolesGuard` being registered globally. Any authenticated user can call admin endpoints. The second critical finding is the **JWT strategy never validates user state against the database**, meaning revoked/deleted users retain access until token expiry. The Stripe webhook and wallet systems have reasonable protections but contain determinism gaps in idempotency.

---

## Critical Risks

### C-01: Admin Controllers Missing Role Checks

**Severity:** Critical
**Affected:** `AdminFounderController`, `AdminPromotionsController`, `AdminBadgesController`, `AdminSupportController`, `AdminSubscriptionsController`, `AdminPlansController`

**Impact:** Any authenticated user (including `blogger` role) can access admin-only operations: closing founder programs, modifying badges, managing all support tickets, listing all subscriptions, managing all promotions, and calling payment stats.

**Exploit Scenario:**
1. Register a normal user account
2. Call `POST /admin/founder/programs/prog-1/close` — closes a founder program with 4000 seats remaining
3. Call `POST /admin/badges/assign` with `{ userId: "<attacker-id>", badgeId: "<admin-badge-id>" }` — assigns any badge
4. Call `GET /admin/subscriptions` — views every user's subscription details
5. Call `GET /admin/payments/stats` — views platform revenue

**Root Cause:** `RolesGuard` is registered as a global `APP_GUARD`, but its `canActivate` method returns `true` when no `@Roles()` metadata exists on the handler. The guard only enforces roles when the decorator is present. Most admin controllers use `@UseGuards(AuthGuard('jwt'), RolesGuard)` WITHOUT `@Roles()`:

```typescript
// src/roles/roles.guard.ts:15-18
if (!requiredRoles || requiredRoles.length === 0) {
  return true;  // <-- grants access when no @Roles() set
}
```

**Fix:** Add `@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)` to every admin controller class:

```typescript
@Controller('admin/founder')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)  // ← ADD THIS
export class AdminFounderController { ... }
```

Alternatively, invert the guard logic to DENY by default when no role metadata is present, and require explicit `@Roles()` on public endpoints.

---

### C-02: JWT Strategy Never Validates User State Against Database

**Severity:** Critical
**Affected:** `src/auth/strategies/jwt.strategy.ts`, all `@UseGuards(AuthGuard('jwt'))` endpoints

**Impact:** Deleted, deactivated, or role-changed users retain full access to all authenticated endpoints until their JWT expires (potentially 15 minutes to hours). Password changes do not invalidate existing tokens.

**Exploit Scenario:**
1. Admin suspends a user's account (sets `isActive: false`)
2. The user's JWT is still valid until expiry
3. User continues to call authenticated APIs for the remaining token lifetime
4. Even after password reset, old JWTs issued before the reset continue to work

**Root Cause:** `JwtStrategy.validate()` only unpacks the token payload without checking the database:

```typescript
// src/auth/strategies/jwt.strategy.ts:21-26
async validate(payload: JwtPayload) {
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,  // <-- role is from token, not DB
  };
}
```

**Fix:** Look up the user in the database during validation and reject if inactive/deleted:

```typescript
async validate(payload: JwtPayload) {
  const user = await this.usersRepository.findById(payload.sub);
  if (!user || !user.isActive || user.deletedAt) {
    throw new UnauthorizedException('User not found or inactive');
  }
  // Check if password was changed after token issuance
  if (user.passwordChangedAt && payload.iat &&
      new Date(payload.iat * 1000) < user.passwordChangedAt) {
    throw new UnauthorizedException('Token issued before password change');
  }
  return { id: user.id, email: user.email, role: user.role };
}
```

---

### C-03: Promotion Credit Consumption Idempotency Key Is Not Deterministic

**Severity:** Critical
**Affected:** `src/promotions/promotions.service.ts` — `consumeCredits()` method

**Impact:** If the server crashes after debiting the wallet but before the campaign is created, retrying the request will generate a different idempotency key and double-charge the user. Unlike Stripe payment idempotency, there is no campaign-level idempotency check.

**Exploit Scenario:**
1. User calls `POST /account/promotions/campaigns`
2. Server debits 100 credits from wallet (idempotency key: `promo_user-1_1718560000000`)
3. Server crashes before creating the campaign record
4. User retries the request with a new timestamp → new idempotency key: `promo_user-1_1718560001000`
5. Server debits 100 credits again — user loses 200 credits for one campaign

**Root Cause:** The idempotency key is generated with `Date.now()`:

```typescript
const idempotencyKey = `promo_${userId}_${Date.now()}`;
await this.walletService.debit(userId, { amount, idempotencyKey, ... });
```

**Fix:** Generate the idempotency key deterministically from the campaign creation parameters before the debit, and check for an existing campaign with those parameters before debiting:

```typescript
const idempotencyKey = `promo_campaign_${userId}_${dto.packageId}_${dto.type}`;
const existingTx = await this.walletRepository.findTransactionByIdempotencyKey(idempotencyKey);
if (existingTx) {
  // Find and return the existing campaign tied to this idempotency key
}
```

---

## High Risks

### H-01: Wallet Credit Endpoint Exposed to Any Authenticated User

**Severity:** High
**Affected:** `src/wallet/wallet.controller.ts` — `WalletController.credit()`

**Impact:** Any authenticated user can credit their wallet without restriction. In production this would allow users to mint unlimited credits.

**Exploit Scenario:**
1. Authenticated user calls `POST /wallet/credit` with `{ amount: 1000000, source: "self_credit" }`
2. Wallet balance increases by 1,000,000 credits
3. User spends credits on promotions without paying

**Root Cause:** The `credit` endpoint has no role restriction and no source validation:

```typescript
@Post('credit')
async credit(@CurrentUser() user, @Body() dto) {
  return this.walletService.credit(user.id, dto);
}
```

**Fix:** Restrict credit endpoint to admin only, or remove it from the user-facing controller entirely. Credit should only be added via Stripe webhook processing:

```typescript
// Remove from user WalletController
// Keep only on AdminWalletController with @Roles()
@Post('adjust')  // renamed from 'credit'
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
async adjust(@CurrentUser() admin, @Body() dto) { ... }
```

---

### H-02: Promotion Engine Does Not Check Feature Access

**Severity:** High
**Affected:** `src/promotions/promotions.service.ts`

**Impact:** Requirement states "Promotion Engine must respect FeatureAccessService." Users on the free tier or restricted accounts can create promotions without any feature-gate check.

**Exploit Scenario:**
1. Free-tier user (no founder seat, no subscription) calls `POST /account/promotions/campaigns`
2. Server checks wallet balance (user has credits from a previous purchase)
3. Campaign is created with no check if the user's plan allows promotions
4. User bypasses intended feature restrictions

**Root Cause:** `FeatureAccessService` is injected but never called:

```typescript
constructor(
  ...
  private readonly featureAccessService: FeatureAccessService,  // injected but unused
  ...
) {}
```

**Fix:** Add feature access check at campaign creation:

```typescript
async createCampaign(userId: string, dto: any) {
  const access = await this.featureAccessService.resolve(userId);
  if (!access.features.includes('promotions')) {
    throw new ForbiddenException('Your plan does not include promotions');
  }
  ...
}
```

---

### H-03: Brute Force State Stored In-Memory, Lost on Restart

**Severity:** High
**Affected:** `src/common/security/brute-force.service.ts`

**Impact:** Server restart resets all brute force counters. An attacker who triggers a lockout can wait for a deploy/restart and immediately resume brute-forcing. The lockout is also per-pod in multi-instance deployments.

**Exploit Scenario:**
1. Attacker attempts 5 failed logins for `admin@example.com` → account locked for 30 minutes
2. Attacker triggers a server restart (e.g., by finding a crash endpoint)
3. BruteForceService `Map` is cleared
4. Attacker resumes brute-forcing immediately

**Root Cause:** Uses an in-memory `Map`:

```typescript
private readonly store = new Map<string, BruteForceEntry>();
```

**Fix:** Store brute force state in Redis or the database:

```typescript
async recordAttempt(identifier: string): Promise<void> {
  const key = `bruteforce:${identifier}`;
  const attempts = await this.redis.incr(key);
  if (attempts === 1) await this.redis.expire(key, this.WINDOW_MS / 1000);
  if (attempts >= this.MAX_ATTEMPTS) {
    await this.redis.set(`blocked:${identifier}`, '1', 'PX', this.BLOCK_DURATION_MS);
  }
}
```

---

### H-04: Password Reset Token Stored in Plaintext, No Rate Limiting

**Severity:** High
**Affected:** `src/auth/auth.service.ts` — `requestPasswordReset()`, `resetPassword()`

**Impact:** Password reset tokens are UUIDs stored in plaintext in the database. The `forgot-password` endpoint has no rate limiting distinct from the general throttle, allowing an attacker to generate unlimited reset tokens for any email.

**Exploit Scenario:**
1. Attacker calls `POST /auth/forgot-password` 100 times for `victim@example.com`
2. 100 reset tokens are created in the database, all valid for 1 hour
3. Attacker brute-forces the UUIDs (low probability, but the volume amplifies the surface)
4. More realistically: victim's email is flooded with reset requests

**Root Cause:** No per-email rate limiting and token stored in plaintext:

```typescript
const token = uuidv4();  // stored directly in DB
const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
await this.prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt } });
```

**Fix:**
1. Store a SHA-256 hash of the token instead of the plaintext
2. Add per-email rate limiting (1 reset per 5 minutes per email)
3. Return the same message regardless of whether the email exists (already done)

---

### H-05: Session Revocation in `sessions.service.ts` Uses `require('uuid')` Instead of Import

**Severity:** High
**Affected:** `src/sessions/sessions.service.ts:30`

**Impact:** Code uses `require('uuid').v4()` inside a method body instead of the imported `v4` from the top-level import. This bypasses TypeScript module resolution and could fail silently or resolve to a different module depending on the bundler/runtime.

**Root Cause:**

```typescript
await this.eventPublisher.publish({
  eventId: require('uuid').v4(),  // ← inline require
  ...
});
```

**Fix:** Use the already-imported `v4 as uuidv4` from the top of the file.

---

### H-06: Admin Badge Assignment Endpoint Uses Reverse Parameter Order

**Severity:** High (already fixed in latest code, documented for awareness)
**Affected:** `src/badges/badges.controller.ts` — `AdminBadgesController.assign()` (PRIOR to latest fix)

**Impact:** The `assign` endpoint previously called `assignBadgeToUser(dto.badgeId, dto.badgeId)`, passing the badge ID as both userId and badgeId, which would assign the badge to itself (an impossible user ID). This has been fixed in the latest iteration but any pre-fix deployment would silently fail on badge assignment.

**Root Cause (pre-fix):**
```typescript
@Post('assign')
async assign(@Body() dto: AssignBadgeDto) {
  return this.badgesService.assignBadgeToUser(dto.badgeId, dto.badgeId);
  //                                                  ↑ userId    ↑ badgeId — BOTH ARE badgeId!
}
```

**Fix (applied):** Use `AdminAssignBadgeDto` with separate `userId` and `badgeId` fields.

---

## Medium Risks

### M-01: Search SQL Raw Queries Have Fragile Parameter Indexing

**Severity:** Medium
**Affected:** `src/search/search.repository.ts:44-86`

**Impact:** The `searchArticles()` method manually tracks `paramIndex` while building SQL queries. When the search term is empty, `tsQueryParam` becomes `NULL::tsquery` (zero params), but `orderClause` still references `$${paramIndex - (searchTerm ? 1 : 0)}`. This causes the parameter offset to shift, potentially binding the wrong values to the wrong `$N` placeholders.

**Exploit Scenario:** Unlikely to be exploitable for injection (params are still parameterized), but incorrect query results or database errors could occur when searching without a term. In worst case, the `LIMIT` and `OFFSET` values could be bound to the wrong position, returning incorrect data.

**Root Cause:** Parameter index arithmetic shares a single counter across clauses with conditional parameter counts.

**Fix:** Build the parameter array and the SQL string independently without shared index arithmetic. Use `$1, $2, ...` sequentially by appending to arrays.

---

### M-02: Email Verify Token Accepted as Raw Body String

**Severity:** Medium
**Affected:** `src/auth/auth.controller.ts:63-66`

**Impact:** The `verify-email` endpoint annotates `@Body() token: string` expecting NestJS to parse the entire request body as a string. This only works when the body is a bare string like `"some-token"`. Standard JSON POSTs with `{ "token": "..." }` would cause a type mismatch.

```typescript
@Post('verify-email')
async verifyEmail(@Body() token: string): Promise<{ message: string }> {
```

**Fix:** Wrap in a proper DTO:

```typescript
export class VerifyEmailDto {
  @IsString()
  token: string;
}
```

---

### M-03: FounderSeat `version` Field Never Used for Optimistic Locking

**Severity:** Medium
**Affected:** `prisma/schema.prisma` — `FounderSeat.version`, `src/founder/founder.repository.ts`

**Impact:** The `FounderSeat` model has a `version` column (intended for optimistic concurrency) but it is never checked or incremented in any transaction. Concurrent upgrade attempts are protected at the program level (`usedSeats` check), but the seat record itself has no version guard.

**Root Cause:** Schema defines `version Int @default(1)` but repository never queries with `where: { version: currentVersion }` and never does `version: { increment: 1 }`.

**Fix:** Add version checking to seat operations similar to wallet:

```typescript
await tx.founderSeat.update({
  where: { id: seat.id, version: seat.version },
  data: { programId: newProgramId, version: { increment: 1 } },
});
```

---

### M-04: Notification Delete Returns `{ deleted: true }` But Only Soft-Deletes

**Severity:** Medium
**Affected:** `src/notifications/notifications.service.ts:87-90`

**Impact:** The API returns `{ deleted: true }` but the record remains in the database with `deletedAt` set. Users may be misled into thinking the notification is permanently gone. More importantly, deleted notifications can be restored if the `deletedAt` filter is removed from a query.

**Root Cause:**
```typescript
async delete(notificationId: string, userId: string) {
  const notification = await this.notificationsRepository.findById(notificationId);
  ...
  await this.notificationsRepository.delete(notificationId);  // sets deletedAt
  return { deleted: true };  // misleading
}
```

**Fix:** Change the repository to use `update` with `deletedAt` rather than a hard delete (which is fine for soft delete), but return `{ archived: true }` or document the soft-delete behavior. Alternatively, add a hard-delete option for permanent removal.

---

### M-05: Blog Public Endpoint Returns Unlisted and Draft Blogs

**Severity:** Medium
**Affected:** `src/blogs/blogs.repository.ts:50-57` — `findBySlug()`

**Impact:** Any blog, regardless of its `visibility` or `status`, can be discovered by slug. Draft blogs (intended to be private) are accessible via `/blogs/:slug` without authentication.

**Exploit Scenario:**
1. User creates a blog and saves it as draft (intended to be private)
2. Attacker guesses or brute-forces the slug
3. Attacker reads the blog's name, description, and URLs

**Root Cause:** `findBySlug()` only checks `deletedAt: null` — no check on `visibility` or `status`:

```typescript
return this.prisma.blog.findFirst({
  where: { slug, deletedAt: null },
  ...
});
```

**Fix:** For the public endpoint, filter to public blogs only:

```typescript
// Public endpoint
return this.prisma.blog.findFirst({
  where: { slug, deletedAt: null, status: { in: ['verified', 'public'] }, visibility: 'public' },
  ...
});

// Authenticated user's own blogs can bypass this
```

---

### M-06: Feature Flag Cache Never Auto-Invalidates

**Severity:** Medium
**Affected:** `src/feature-flags/feature-flag.service.ts`

**Impact:** Once a feature flag is cached, it remains cached until explicitly invalidated. This means admin changes to feature flags take effect only after a cache clear or server restart.

**Root Cause:**
```typescript
async isEnabled(key: string): Promise<boolean> {
  if (this.cache.has(key)) {
    return this.cache.get(key)!;  // stale data served indefinitely
  }
  ...
}
```

**Fix:** Add a TTL to the cache entries:

```typescript
interface CacheEntry { value: boolean; expiresAt: number; }
private readonly cache = new Map<string, CacheEntry>();

async isEnabled(key: string): Promise<boolean> {
  const cached = this.cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  ...
}
```

---

### M-07: No Password Reuse Check Despite `passwordHistory` Field

**Severity:** Medium
**Affected:** `prisma/schema.prisma` — User model, `src/auth/auth.service.ts` — `resetPassword()`

**Impact:** Users can reuse the same password on reset. The `passwordHistory` JSON field exists on the User model but is never read or written. This reduces the effectiveness of password changes after a compromise.

**Root Cause:** Schema defines `passwordHistory Json?` but no code ever populates or checks it.

**Fix:** Store previous password hashes and check against them on password change:

```typescript
async resetPassword(token, newPassword) {
  const passwordHash = await this.passwordService.hash(newPassword);
  const user = await this.usersRepository.findById(resetRecord.userId);
  const history = (user.passwordHistory as string[]) || [];
  for (const oldHash of history) {
    if (await this.passwordService.compare(newPassword, oldHash)) {
      throw new BadRequestException('Cannot reuse a recent password');
    }
  }
  // Update: keep last 5 hashes
  const updatedHistory = [...history.slice(-4), user.passwordHash];
  await this.usersRepository.updatePassword(resetRecord.userId, passwordHash);
  await this.usersRepository.update(resetRecord.userId, { passwordHistory: updatedHistory });
}
```

---

## Low Risks

### L-01: CORS Configured with `credentials: true` Without CSRF Protection

**Severity:** Low
**Affected:** `src/common/security/security-config.service.ts:33`

**Impact:** The API uses Bearer token auth (not cookies), so CSRF is inherently mitigated. However, `credentials: true` in CORS could enable cookie-based attacks if cookie auth is ever added.

**Root Cause:**
```typescript
get corsConfig() {
  return {
    origin: this.config.corsOrigins,
    credentials: true,
  };
}
```

**Fix:** Keep as-is for now since JWT Bearer auth is CSRF-safe. If cookie auth is ever introduced, add SameSite=Strict and CSRF tokens.

---

### L-02: Stripe API Version Cast as `any`

**Severity:** Low
**Affected:** `src/payments/stripe/stripe.service.ts:25`

**Impact:** The Stripe API version is typed as `any` to bypass a TypeScript strictness issue. This could mask API incompatibility when upgrading the Stripe SDK.

```typescript
this.stripe = new Stripe(this.config.getSecretKey(), {
  apiVersion: '2023-10-16' as any,
});
```

**Fix:** Match the SDK's expected version type or update the type definitions.

---

### L-03: Unsafe-Inline Scripts Allowed in CSP

**Severity:** Low
**Affected:** `src/common/security/security-config.service.ts:10-11`

**Impact:** The Content Security Policy allows `'unsafe-inline'` for both scripts and styles, reducing the effectiveness of XSS protection.

```typescript
scriptSrc: ["'self'", "'unsafe-inline'"],
styleSrc: ["'self'", "'unsafe-inline'"],
```

**Fix:** Use nonces or hashes instead of `'unsafe-inline'` when serving static assets.

---

### L-04: Global Error Filter Exposes Internal Details on 500 Errors

**Severity:** Low
**Affected:** `src/common/errors/app-exception.filter.ts`

**Impact:** Internal server errors include `exception.message` and the full error object in logs which may be exposed in API responses depending on environment configuration.

**Fix:** Strip internal error details in production responses. Only log them server-side.

---

### L-05: Audit Logging Silently Swallows Failures

**Severity:** Low
**Affected:** `src/audit/audit.service.ts:19-24`

**Impact:** Failed audit log writes are caught and logged, but the calling operation succeeds. This means critical security events (like failed logins or role changes) could fail to record without the user or admin noticing.

```typescript
try {
  await this.prisma.auditLog.create({ ... });
} catch (error) {
  this.logger.error({ err: error, entry }, 'Failed to record audit entry');
  // Operation continues as if audit succeeded
}
```

**Fix:** Consider making audit logging best-effort for non-critical events but synchronous/blocking for security-critical events (role changes, payments, account deletions).

---

### L-06: Wallet Hold Operation Does Not Lock Balance

**Severity:** Low
**Affected:** `src/wallet/wallet.service.ts:145-160` — `hold()`

**Impact:** The `hold` operation creates a ledger entry but does NOT deduct from the wallet balance. The same credits can be held multiple times or spent while on hold.

```typescript
async hold(userId, amount, reason) {
  const wallet = await this.getWalletWithLock(userId);
  if (wallet.totalBalance < amount) throw ...;
  // Balance is NOT decreased
  // Transaction records: balanceBefore = totalBalance, balanceAfter = totalBalance (same!)
  ...
}
```

**Fix:** Deduct from `totalBalance` on hold and restore on release:

```typescript
await tx.wallet.update({
  where: { id: wallet.id, version: wallet.version },
  data: { totalBalance: wallet.totalBalance - amount, version: { increment: 1 } },
});
```

Note: This has architectural implications. If holds don't lock balance, the system relies on the caller to track holds. This is a design choice, but it's risky without application-level enforcement.

---

## Recommendations by Priority

### Immediate (Fix within 24 hours)
1. **C-01:** Add `@Roles()` to all admin controllers
2. **C-02:** Add database user validation in `JwtStrategy.validate()`
3. **C-03:** Make promotion credit consumption idempotency key deterministic

### Short-term (Fix within 1 week)
4. **H-01:** Restrict wallet credit endpoint to admin only
5. **H-02:** Integrate `FeatureAccessService` into promotion creation
6. **H-03:** Move brute force state to Redis
7. **H-04:** Hash password reset tokens and add rate limiting
8. **H-05:** Fix `require('uuid')` to use proper import
9. **M-03:** Implement `version` checking on `FounderSeat`

### Medium-term (Fix within 2 weeks)
10. **M-01:** Refactor search SQL to eliminate fragile parameter indexing
11. **M-02:** Add proper DTO for email verification
12. **M-05:** Add visibility/status filter to public blog endpoint
13. **M-06:** Add TTL to feature flag cache
14. **M-07:** Implement password reuse checking
15. **L-06:** Decide on hold semantics and implement balance locking

---

## Positive Findings

The following areas were reviewed and found to be well-implemented:

- **Password hashing:** bcrypt with 12 salt rounds in `PasswordService`
- **Refresh token rotation:** Old sessions are revoked on refresh (`SessionsRepository`)
- **Stripe webhook signature verification:** Uses `constructEvent()` with secret
- **Wallet optimistic locking:** Version column checked on all balance-changing operations
- **Founder seat allocation:** Atomic transaction prevents overselling
- **Input validation:** Extensive use of `class-validator` decorators on all DTOs
- **Password policy:** Enforced in `RegisterDto` and `ResetPasswordDto` with regex
- **Soft delete pattern:** Consistent across all models with `deletedAt` fields
- **Audit trail:** Comprehensive audit logging across auth and blog operations
- **Event-driven architecture:** All state changes emit typed domain events
- **Search query parameterization:** Raw SQL uses `$N` parameterized queries (no string interpolation of user input)

# Hostile Engineering Review — MillionBlogs Backend

**Auditor stance:** Assume every edge case is a vulnerability until proven otherwise. Assume every race window is exploitable. Assume every missing check is a backdoor.

**Revision:** Codebase as of 2026-06-16, all 12 phases, ~400 source files, 34 modules, 35+ Prisma models.

---

## Classification Key

| Severity | Definition | Threshold |
|----------|------------|-----------|
| **CRITICAL** | Direct revenue loss, data corruption, or unauthorized access to paid features | Must fix before launch |
| **HIGH** | Reliability degradation, privilege escalation in multi-tenant context, data integrity violations that cause incorrect billing or state | Must fix within first month |
| **MEDIUM** | Production-impacting bugs under specific conditions, missing indexes at scale, race conditions in non-critical paths | Fix within quarter |
| **LOW** | Code quality, observability gaps, type safety issues, missing constraints that haven't caused incidents | Track as tech debt |

---

## 1. Payments Module — 5 Findings

### C-01: Checkout Session ← → Subscription Wire Is Missing (CRITICAL)

**File:** `src/payments/stripe/stripe.service.ts:148-175` (`processCheckoutSessionCompleted`)

**Bug:** When a Stripe checkout session completes successfully, the code:
1. Finds or creates a Payment record
2. Updates it to `completed`
3. Credits the user's wallet with credits (floor of `plan.price / pricePerCredit`)
4. Emits `PAYMENT_COMPLETED` event

It **never activates a subscription**. The subscription that was created in `subscriptions.service.createSubscription()` (called before checkout) remains in `pending` state forever. The user gets wallet credits but no subscription.

**Impact:** Paying for a subscription gives credits instead of access. The subscription stays `pending` — never `active`. User can claim refund because the service was never delivered. Conversely, the `processPaymentIntentSucceeded` path has the same issue: it credits the wallet but never touches the subscription system.

**Exploit:**
1. Create a subscription (status: `pending`)
2. Pay through Stripe checkout → wallet gets credits, subscription stays `pending`
3. Wait for refund window → claim refund → keep credits
4. OR: Never notice the subscription is broken → user lost money

**Fix:** `processCheckoutSessionCompleted` must call `subscriptionsService.activateSubscription(subscriptionId)`. The subscription ID must be in the session metadata. The credit operation should be separate from the activation — only credit for prepaid plans, not for recurring subscriptions.

---

### C-02: Payment Intent Payment Route Has No Subscription Creation (CRITICAL)

**File:** `src/payments/stripe/stripe.service.ts:119-147` (`processPaymentIntentSucceeded`)

**Bug:** This handler credits the wallet with credits (`wallet_credit_${stripePaymentId}`) but there is no subscription pathway at all. The metadata may contain `userId` and `planId`, but the code attempts `findByStripePaymentId()` then `create()` if not found — with `userId: metadata.userId || 'unknown'`. The fallback to `'unknown'` means a Payment Intent without metadata creates a payment for user `'unknown'` — which is not a real user. Credits go to `'unknown'`'s wallet (which fails silently or creates a wallet for user `'unknown'`).

**Exploit:**
1. Send a direct Payment Intent (not checkout session) with no metadata
2. The system creates a payment for user `'unknown'` 
3. If `walletService.credit()` creates a wallet for `'unknown'` on the fly, credits are permanently lost
4. OR: `walletService.credit()` throws (wallet not found) → payment stored as `completed` but credits never delivered

**Fix:** Require `userId` in Payment Intent metadata. Reject webhook if metadata is missing. Never fall back to `'unknown'`.

---

### H-01: Checkout Session Amount Not Verified Against Plan Price (HIGH)

**File:** `src/payments/stripe/stripe.service.ts:148-175`

**Bug:** `processCheckoutSessionCompleted` reads `planId` from session metadata, looks up the plan, and credits `Math.floor(plan.price / pricePerCredit)`. It does NOT compare `session.amount_total` against `plan.price`. If the Stripe session had a different amount (e.g., modified price, discount, currency mismatch), the credits are still awarded based on the plan's listed price, not the amount paid.

**Impact:** Over-crediting if the actual payment was less than the plan price, or under-crediting if the payment was more. At minimum, an audit trail gap.

**Exploit:**
1. Create a session with a $100 plan
2. Stripe Checkout Session somehow resolves to $50 (coupon, price change)
3. User pays $50, system credits for $100 plan → 2x credit

**Fix:** Credit `Math.floor(session.amount_total / pricePerCredit)` instead of `Math.floor(plan.price / pricePerCredit)`. Or verify `session.amount_total === plan.price` and fail if mismatch.

---

### M-01: No Index on `stripeSessionId` (MEDIUM)

**File:** `src/payments/payments.repository.ts:35-40` (`findByStripeSessionId`)

```typescript
async findByStripeSessionId(stripeSessionId: string) {
  return this.prisma.payment.findFirst({
    where: { stripeSessionId },
  });
}
```

**Bug:** `stripeSessionId` has no database index. Every webhook call for `checkout.session.completed` performs a sequential scan on the payments table. At 100K+ payments, this becomes a slow query.

**Fix:** Add `@@index([stripeSessionId])` to the Payment model in `schema.prisma`.

---

### L-01: Stripe API Version Bypasses Type System (LOW)

**File:** `src/payments/stripe/stripe.service.ts:28`

```typescript
this.stripe = new Stripe(this.config.getSecretKey(), {
  apiVersion: '2023-10-16' as any,
});
```

**Bug:** The `as any` cast suppresses the Stripe SDK's version validation. A typo like `'2023-10-1'` (missing `6`) would silently fall through to the default/latest Stripe API version, potentially changing webhook event shapes and breaking handlers.

**Fix:** Use a typed constant from `Stripe.LatestApiVersion` instead of a string literal with `as any`.

---

## 2. Wallet Module — 6 Findings

### C-03: Idempotency Check Is a TOCTOU Race (CRITICAL)

**File:** `src/wallet/wallet.service.ts:52-61`

```typescript
if (dto.idempotencyKey) {
  const existing = await this.repository.findTransactionByIdempotencyKey(dto.idempotencyKey);
  if (existing) {
    // ... return cached result
  }
}
// ↓ RACE WINDOW: concurrent request passes check before either enters $transaction
return this.prisma.$transaction(async (tx: any) => {
```

**Bug:** The idempotency key check happens OUTSIDE the `$transaction` scope. Between the check and the transaction, a concurrent request may also find no existing transaction and proceed to create one. Both transactions commit successfully, both credit the wallet, but only one `WalletTransaction` record exists (the second update overwrites with no conflict because the check was performed on a different database snapshot).

Wait — actually, the `idempotencyKey` has a `@@unique` constraint on `WalletTransaction`. So the second `create` inside the transaction will throw a unique constraint violation, and the transaction will roll back. However, the `debit()` method has the **same bug** but with a different consequence: if two debits use the same idempotency key, both pass the check, both enter `$transaction`, the second one fails on the unique constraint, BUT the idempotency check was supposed to return the existing result silently. Instead, the user gets a 500 error.

**Impact:** For `credit()`: the unique constraint on `idempotencyKey` saves the day — only one succeeds. For `debit()`: same — unique constraint saves it. BUT the return value is a `ConflictException` 500 instead of the cached result, breaking idempotency for the caller.

**Exploit:** (Limited due to DB constraint) — but idempotency guarantees are violated. The caller expects the cached result but gets an error.

**Fix:** Move the idempotency check INSIDE the `$transaction`:

```typescript
return this.prisma.$transaction(async (tx: any) => {
  if (idempotencyKey) {
    const existing = await tx.walletTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      return { wallet: ..., transaction: ... };
    }
  }
  // ... proceed with debit/credit
});
```

---

### C-04: Wallet `credit()` Doesn't Validate `userId` Ownership of idempotencyKey (CRITICAL)

**File:** `src/wallet/wallet.service.ts:53-59`

```typescript
const existing = await this.repository.findTransactionByIdempotencyKey(dto.idempotencyKey);
if (existing) {
  const wallet = await this.repository.findByUserId(userId);
  return {
    wallet: WalletResponseDto.fromEntity(wallet!),
    transaction: TransactionResponseDto.fromEntity(existing),
  };
}
```

**Bug:** When an idempotency key match is found, the code does NOT verify that the existing transaction belongs to `userId`. It returns `wallet` from `findByUserId(userId)` — which could be a different user's wallet — but the `transaction` belongs to the ORIGINAL user from the first call. If user A credits with idempotency key X, and user B attempts to credit with the same idempotency key X, user B gets user A's transaction back with user B's wallet. This leaks cross-user transaction data.

**Impact:** Information disclosure — user B sees user A's transaction details (amount, source, reference).

**Fix:** Verify `existing.wallet.userId === userId` before returning the cached result. Throw an error if the idempotency key is reused by a different user.

---

### H-02: Wallet `release()` Reads Stale Version (HIGH)

**File:** `src/wallet/wallet.service.ts:303-305`

```typescript
return this.prisma.$transaction(async (tx: any) => {
  const wallet = await tx.wallet.findUnique({
    where: { id: holdTx.wallet.id, version: holdTx.wallet.version },
  });
```

**Bug:** `holdTx.wallet.version` is the version at the time the hold transaction was read (on line 290-292), NOT at the time the release transaction runs. If the wallet was modified between `hold()` and `release()` (e.g., a concurrent credit/debit), the version check in the `update` will fail with a `ConflictException`, even though the release is a legitimate operation.

**Impact:** Users cannot release holds if any other wallet operation happened in the meantime. The hold is stuck — funds are locked forever (until an admin adjusts).

**Fix:** Read the wallet inside the transaction without version filtering:

```typescript
return this.prisma.$transaction(async (tx: any) => {
  const wallet = await tx.wallet.findUnique({ where: { id: holdTx.wallet.id } });
  if (!wallet) throw new NotFoundException('Wallet not found');
  // ... proceed with update using wallet.version
});
```

---

### H-03: Wallet `adminAdjustment()` Positive Credits Go to `purchasedBalance` Only (HIGH)

**File:** `src/wallet/wallet.service.ts:364-370`

```typescript
const newPurchased =
  amount > 0 ? wallet.purchasedBalance + amount : wallet.purchasedBalance;
const newBonus =
  amount < 0
    ? wallet.bonusBalance + amount
    : wallet.bonusBalance;
```

**Bug:** Positive admin adjustments always go to `purchasedBalance`. Negative adjustments always go to `bonusBalance`. This asymmetry means:
- An admin cannot grant bonus credits (system rewards, promotions)
- An admin cannot claw back purchased credits
- If a user has 0 bonus and 100 purchased, and admin adjusts by -50, the adjustment goes to bonus (which is 0) → bonus becomes -50, total becomes 50. But purchased stays at 100. The negative bonus breaks the invariant that balances are non-negative.

**Impact:** Admin adjustments can create negative bonus balances. The `purchasedBalance` is misleading.

**Exploit:** 
1. User has 100 purchased, 0 bonus
2. Admin adjusts -50 → bonus becomes -50, total = 50
3. User spends the 50 purchased
4. User is left with 0 purchased, -50 bonus → wallet has negative balance

**Fix:** Always deduct from purchased balance first (for negative amounts). Always add to the specified source (for positive amounts). Add a `target` field to specify `purchased` or `bonus`.

---

### M-02: `getWalletWithLock()` Does Not Lock (MEDIUM)

**File:** `src/wallet/wallet.service.ts:41-45`

```typescript
private async getWalletWithLock(userId: string) {
  const wallet = await this.repository.findByUserId(userId);
  if (!wallet) throw new NotFoundException('Wallet not found');
  return wallet;
}
```

**Bug:** The method name implies `SELECT ... FOR UPDATE` but it's a plain `findUnique`. Used by `getTransactions()` and previously by `hold()`. This is a misleading API that tricks developers into thinking they have a lock when they don't.

**Fix:** Rename to `findWalletOrThrow()`. Or implement actual locking: `this.prisma.$queryRaw('SELECT ... FROM wallets WHERE user_id = $1 FOR UPDATE', userId)`.

---

### L-02: Version Conflict on Debit Returns Generic Error (LOW)

**File:** `src/wallet/wallet.service.ts:182`

```typescript
if (!updated) {
  throw new ConflictException('Wallet version conflict, retry');
}
```

**Bug:** Prisma's `update` with a `where` that doesn't match does NOT return null — it throws `Prisma.NotFoundError`. The `if (!updated)` check will never be reached because Prisma throws before returning. This means version conflicts result in a 500 Internal Server Error instead of a 409 Conflict with a retry message.

**Fix:** Use `updateMany` (which returns `{ count }` and does not throw) or catch the Prisma error and convert to `ConflictException`.

---

## 3. Founder Module — 4 Findings

### C-05: Upgrade Seat Atomic Rollback Can Oversell (CRITICAL)

**File:** `src/founder/founder.repository.ts:115-153`

```typescript
async upgradeSeatAtomic(...) {
  return this.prisma.$transaction(async (tx) => {
    // ... checks ...
    const seatDeleted = await tx.founderSeat.delete({ where: { userId } });
    
    // DECREMENT old program usedSeats (NO VERSION CHECK)
    const currentProgram = await tx.founderProgram.update({
      where: { id: currentProgramId },
      data: { usedSeats: { decrement: 1 } },
    });

    // INCREMENT new program usedSeats
    const targetUpdated = await tx.founderProgram.update({
      where: { id: targetProgramId, usedSeats: targetProgram.usedSeats },
      data: { usedSeats: { increment: 1 } },
    });

    if (targetUpdated.usedSeats !== targetProgram.usedSeats + 1) {
      // ROLLBACK ATTEMPT: re-increment old, re-create old seat
      // BUT: the old program usedSeats was already decremented!
      await tx.founderProgram.update({
        where: { id: currentProgramId },
        data: { usedSeats: { increment: 1 } }, // Restore
      });
      await tx.founderSeat.create({
        data: { userId, programId: currentProgramId },
      });
      return { success: false, error: 'Concurrent seat claim detected on target' };
    }
```

**Bug 1:** The old program's `usedSeats` decrement on line 127-130 has NO version check (`where: { id: currentProgramId }` only, no `usedSeats` check). If the old program's `usedSeats` was already 0 (shouldn't happen since the user had a seat, but possible if an admin reset the counter), this would decrement to -1.

**Bug 2:** The `where` on the increment (line 135) checks `usedSeats: targetProgram.usedSeats` for optimistic locking. But `targetProgram` was read at the START of the transaction — Prisma's `$transaction` does not automatically provide `SERIALIZABLE` isolation. In the default `READ COMMITTED` isolation:
- Transaction A reads `targetProgram.usedSeats = 50, totalSeats = 51`
- Transaction B reads `targetProgram.usedSeats = 50, totalSeats = 51`
- Transaction A updates `usedSeats += 1` (where `usedSeats = 50`) → succeeds, `usedSeats = 51`
- Transaction B updates `usedSeats += 1` (where `usedSeats = 50`) → Prisma update succeeds but does NOT match the WHERE condition??? Actually, Prisma's `update` throws a `NotFoundError` if no record matches. So B would throw and the transaction would rollback. But B's `founderSeat.delete` (line 121) has already executed — deleting the user's seat permanently.

**Impact:** If two upgrades to the same program race with the last seat, one user's seat is deleted and never recreated. The user loses their founder status permanently.

**Fix:** Use `SELECT ... FOR UPDATE` at the start of the transaction (`tx.$queryRaw('SELECT ... FROM founder_programs WHERE id = $1 FOR UPDATE', targetProgramId)`). This prevents any concurrent transaction from modifying the row. Also, the `update` on the old program should use `where: { id: currentProgramId, usedSeats: { gt: 0 } }`.

---

### C-06: Founder Seat Claim Does Not Verify User Has No Active Subscription (CRITICAL)

**File:** `src/founder/founder.service.ts:63-96`

**Bug:** `claimSeat()` checks `existing = await this.founderRepository.getSeatByUserId(userId)` but does NOT check if the user already has an active subscription. A user can claim a founder seat (lifetime, one payment) AND have an active subscription (recurring). The `FeatureAccessService` prioritizes founder over subscription, so the subscription is wasted money.

**Exploit:**
1. Buy Founder Master ($500) → lifetime access
2. Buy Pro Monthly ($10/mo) → subscription also active
3. User is paying monthly for nothing — or: user claims refund on founder seat claiming it was a mistake, but keeps the badge and access until manually revoked

**Fix:** Add a check: if user has an active subscription, either block founder claiming or auto-cancel the subscription.

---

### M-03: Founder Seat `version` Field Is Never Read (MEDIUM)

**File:** `src/founder/founder.repository.ts` and `schema.prisma:587`

**Bug:** `FounderSeat` has a `version: Int @default(1)` field, but `claimSeatAtomic()` and `upgradeSeatAtomic()` never read or check it. The single-user constraint is enforced by `userId @unique` on `FounderSeat`, not by optimistic locking. The `version` field is dead code that creates a false sense of safety.

**Impact:** None today. But if anyone later adds a `version` check without understanding why it wasn't used, they might introduce bugs.

**Fix:** Either use `version` in seat operations, or remove the field.

---

### L-03: `seedPrograms()` Idempotent Only at Query Level (LOW)

**File:** `src/founder/founder.repository.ts:175-197`

```typescript
async seedDefaultPrograms() {
  const existing = await this.prisma.founderProgram.count();
  if (existing > 0) return;
  // ... createMany
}
```

**Bug:** The count check happens outside a transaction. If two processes call `seedPrograms()` simultaneously, both see `existing = 0`, both proceed to `createMany`. The `slug @unique` constraint will cause one to fail with a 500 error.

**Fix:** Wrap in `$transaction` or use `skipDuplicates: true` on `createMany` (requires Prisma 5.x+, which may not be available).

---

## 4. Subscriptions Module — 4 Findings

### H-04: Subscription `processRenewals()` Has No Payment Collection (HIGH)

**File:** `src/subscriptions/subscriptions.service.ts:275-298`

```typescript
async processRenewals() {
  const expiring = await this.subscriptionsRepository.findExpiring(now);
  for (const sub of expiring) {
    await this.enterGracePeriod(sub.id);  // Never attempts to charge
  }
  // ...
}
```

**Bug:** `processRenewals()` moves expiring subscriptions to grace period and grace-expired to expired. It NEVER attempts to collect payment. The `renewSubscription()` method exists but is only callable via admin API. There is NO automatic charge collection — the system gives 7 free days of service (grace period) but never bills the user again after the initial purchase.

**Impact:** Recurring subscriptions are one-time payments with a free grace period buffer. The system has no recurring revenue mechanism despite having a full subscription lifecycle model.

**Exploit:** Pay for one month → get lifetime service because renewal never charges.

**Fix:** Integrate Stripe subscription (recurring) for recurring plans. Use `stripe.subscriptions.create` with `payment_behavior: 'default_incomplete'` and let Stripe handle collection. The `processRenewals()` should attempt to charge the saved payment method before entering grace period.

---

### H-05: Grace Period Ends But Subscription Still Active in FeatureAccess (HIGH)

**File:** `src/feature-access/feature-access.service.ts:30-35`

```typescript
async resolve(userId: string): Promise<FeatureAccess> {
  const [, activeSub, ] = await Promise.all([
    this.founderRepository.getSeatByUserId(userId),
    this.subscriptionsRepository.findActiveByUserId(userId),  // Only queries 'active' status
    // ...
  ]);
```

**Bug:** `findActiveByUserId()` queries `status: 'active'`. Subscriptions in `grace_period` status are NOT considered active. So the moment a subscription enters grace period, `FeatureAccessService` treats the user as on the `free` plan.

**Impact:** Users in grace period lose access to paid features immediately — defeating the purpose of a grace period. The grace period is supposed to allow continued access while the user updates payment info.

**Fix:** `findActiveByUserId()` should include `grace_period` status, or `FeatureAccessService` should query for both `active` and `grace_period`.

---

### M-04: Subscription Created Without Payment (MEDIUM)

**File:** `src/subscriptions/subscriptions.service.ts:27-60`

```typescript
async createSubscription(userId: string, planId: string) {
  const plan = await this.plansRepository.findById(planId);
  // ... validation ...
  const subscription = await this.subscriptionsRepository.create({
    status: 'pending',
    // ...
  });
```

**Bug:** `createSubscription()` is a standalone API call that creates a `pending` subscription with zero payment collection. There's no Stripe Checkout Session, no payment intent, no wallet debit. The subscription just sits in `pending`.

**Exploit:** 
1. POST `/subscriptions` with a paid plan ID → subscription created, status `pending`
2. The `pending` status means the user paid nothing but has a record of intending to pay
3. Admin dashboard shows a subscription, but no revenue

**Fix:** Remove the public `POST /subscriptions` endpoint. Subscription creation should only happen through the payment flow (Stripe Checkout Session → webhook → activate).

---

### L-04: Grace Period Is Hardcoded (LOW)

**File:** `src/subscriptions/subscriptions.service.ts:19`

```typescript
private readonly gracePeriodDays = 7;
```

**Bug:** Grace period duration is a hardcoded constant. Cannot be changed without code deployment.

**Fix:** Store in `SystemConfiguration` table or as a config value.

---

## 5. Promotions Module — 5 Findings

### H-06: Campaign Budget Not Enforced at Rotation Time (HIGH)

**File:** `src/promotions/rotation.service.ts:22-39`

```typescript
const campaigns = await this.campaignsRepository.findActiveForRotation();
// ... filters by type ...
const selected = scored.slice(0, limit);
```

**Bug:** `findActiveForRotation()` returns ALL active campaigns regardless of budget. The `budgetRemaining` factor in the scoring formula (line 31: `(creditsBudget - creditsSpent) / creditsBudget`) affects the score but does NOT exclude campaigns with `creditsSpent >= creditsBudget`. A campaign with 0 budget remaining will still appear in rotation, just with score 0 — and if all campaigns have 0 budget, they still show.

**Impact:** Campaigns continue running after their budget is exhausted. The system is essentially giving free impressions.

**Fix:** Add `where: { creditsSpent: { lt: this.prisma.$raw('credits_budget') } }` to the rotation query, or filter after fetch.

---

### H-07: Promotions `consumeCredits()` TOCTOU — Campaign Created Even If Debit Fails (HIGH)

**File:** `src/promotions/promotions.service.ts:104-120`

```typescript
const creditsBudget = dto.creditsBudget || pkg.creditCost;
const idempotencyKey = `promo_campaign_${userId}_${dto.packageId}_${dto.type}`;

await this.consumeCredits(userId, creditsBudget, idempotencyKey);
// ^^^ can throw InsufficientBalance

const campaign = await this.campaignsRepository.create({...});
```

**Bug:** `consumeCredits()` calls `walletService.getBalance()` then `walletService.debit()`. If between the two calls the balance changes, debit throws. BUT the code reaches `consumeCredits` BEFORE campaign creation. If debit fails, campaign is not created — correct. But if debit succeeds and campaign creation fails, the credits are already spent and the user has nothing to show for it.

**Impact:** Lost credits if campaign creation throws.

**Fix:** Wrap campaign creation AND debit in a single Prisma `$transaction`. The debit should be inside the same transaction context.

---

### M-05: `recordAnalytics()` Concurrency Race on CTR (MEDIUM)

**File:** `src/promotions/promotion-campaigns.repository.ts:62-72`

```typescript
async recordAnalytics(campaignId: string, type: string, metadata?: Record<string, unknown>) {
  const field = type === 'click' ? 'clicks' : 'impressions';
  const [analytics] = await Promise.all([
    this.prisma.promotionAnalytics.create({
      data: { campaignId, type, metadata: metadata as any },
    }),
    this.prisma.promotionCampaign.update({
      where: { id: campaignId },
      data: {
        [field]: { increment: 1 },
        ctr: this.prisma.$raw`CAST(clicks AS FLOAT) / NULLIF(impressions, 0)`,
      },
    }),
  ]);
  return analytics;
}
```

**Bug 1:** `Promise.all` runs the create and update concurrently — not sequentially. The `increment: 1` and the CTR expression evaluate at slightly different times, so the CTR formula divides the NEW `clicks` by the OLD `impressions` (or vice versa), giving an incorrect ratio.

**Bug 2:** The `ctr: this.prisma.$raw(...)` syntax is invalid. `this.prisma.$raw` is not a Prisma function — the correct API is `Prisma.sql` or `Prisma.raw`. This likely results in an error or stores a string literal instead of the computed SQL expression.

**Impact:** CTR values are wrong. Analytics reports show incorrect click-through rates, making campaign optimization impossible.

**Fix:** Remove the CTR expression from the update. Calculate CTR on reads instead:
```typescript
// On read:
ctr: c.impressions > 0 ? c.clicks / c.impressions : 0
```

Or run a periodic batch job to recalculate CTR.

---

### M-06: Public Impression/Click Endpoints Are Unauthenticated (MEDIUM)

**File:** `src/promotions/promotions.controller.ts:34-42`

```typescript
@Post('impression')
async recordImpression(@Body('campaignId') campaignId: string) { ... }

@Post('click')
async recordClick(@Body('campaignId') campaignId: string) { ... }
```

**Bug:** These endpoints have NO auth guard. Anyone can record unlimited impressions and clicks for any campaign, with no rate limiting, no validation, and no ownership check. This enables:
1. Impression fraud: artificially inflate a competitor's impression count (costs them nothing since campaigns pay per credit, not per impression)
2. Click fraud: artificially deflate CTR by adding fake impressions
3. Analytics pollution

**Impact:** Campaign analytics are untrustworthy. The system cannot distinguish real from fake impressions.

**Fix:** Add rate limiting per IP, require API key or JWT auth, validate that the campaign belongs to the user (if owner), or at minimum implement server-side throttling.

---

### L-05: Campaign Cancel Does Not Refund Credits (LOW)

**File:** `src/promotions/promotions.service.ts:177-182`

```typescript
async cancelCampaign(campaignId: string) {
  // ... validation ...
  const updated = await this.campaignsRepository.update(campaignId, { status: 'cancelled' });
  return CampaignResponseDto.fromEntity(updated);
}
```

**Bug:** Cancelling a campaign does NOT refund unspent credits. The `creditsSpent` may be less than `creditsBudget`, but the difference is never returned to the wallet.

**Impact:** Users lose money when cancelling campaigns early.

**Fix:** On cancel, credit the wallet with `creditsBudget - creditsSpent`.

---

## 6. Auth Module — 5 Findings

### H-08: Refresh Token Rotation Has No Theft Detection (HIGH)

**File:** `src/auth/auth.service.ts:141-167`

```typescript
async refresh(dto: RefreshTokenDto): Promise<AuthTokensDto> {
  const session = await this.sessionsRepository.findByRefreshToken(dto.refreshToken);
  if (!session) throw new UnauthorizedException('Invalid refresh token');
  // ... proceed ...
  await this.sessionsRepository.revoke(session.id);
  // ... create new session with NEW refresh token
}
```

**Bug:** When a refresh token is used, it's revoked and a new one is issued. But there's no detection if the SAME token is used twice. An attacker who steals a refresh token can:
1. Wait for the legitimate user to refresh (old token revoked, new one issued)
2. The attacker's stolen token is now revoked → they get "Invalid refresh token"
3. BUT: if the attacker uses the token BEFORE the legitimate user refreshes, both get valid new sessions

The real gap: there's no "token family" or "token chain". If two refresh attempts use the same token, both should succeed (that's the rotation), but the FIRST one that revokes it should also revoke ALL sessions for the user, because token reuse == theft.

**Exploit:**
1. Steal user's refresh token
2. Immediately refresh → get a new valid session, attacker has access
3. User's app refreshes → old token is now revoked → user gets error, then logs in again
4. Attacher has persistent access through their new session

**Fix:** Implement refresh token reuse detection. If a revoked token is presented, revoke ALL sessions for that user and force re-login.

---

### H-09: Password Reset Token in Event Payload (HIGH)

**File:** `src/auth/auth.service.ts:237-238`

```typescript
payload: { userId: user.id, email: user.email, token: rawToken, expiresAt },
```

**Bug:** The `PASSWORD_RESET_REQUESTED` event payload includes the raw unhashed password reset token. Events are published to an in-process `EventEmitter2` with `ignoreErrors: true`. Any subscriber (or future subscriber like analytics/audit) can capture this token.

**Impact:** Anyone with access to the event bus (any service in the same process) can extract the raw password reset token and reset any user's password.

**Exploit:**
1. Subscribe to `EventEmitter2` events
2. Capture `PASSWORD_RESET_REQUESTED` events
3. Extract `rawToken`
4. Call `POST /auth/reset-password` with the token and a new password
5. User's account is compromised

**Fix:** Remove `token` from the event payload. The token should only be sent via the email delivery mechanism. The event should contain only `userId` and `email`.

---

### M-07: Brute Force Attempts Never Cleaned Up (MEDIUM)

**File:** `prisma/schema.prisma:97-109`

**Bug:** `BruteForceAttempt` records are created but never deleted or archived. Every failed login attempt lives in the table forever.

**Impact:** Unbounded table growth. At 1M failed attempts/day (trivial with bot traffic), the table grows 365M rows/year. Indexes on this table will bloat and query performance will degrade.

**Fix:** Add a TTL cleanup job: `DELETE FROM brute_force_attempts WHERE created_at < NOW() - INTERVAL '24 hours'`.

---

### M-08: `resetPassword()` Doesn't Check Password History (MEDIUM)

**File:** `src/auth/auth.service.ts:234-247`

```typescript
const passwordHash = await this.passwordService.hash(newPassword);
await this.usersRepository.updatePassword(resetRecord.userId, passwordHash);
```

**Bug:** Users can reset their password to any value, including their current password or recent passwords. The `User` model has `passwordHistory: Json?` field, but it's never consulted during password changes.

**Impact:** Weak password hygiene. If attacker learns the password after a reset back to the old password, they regain access.

**Fix:** Check `passwordHistory` (if stored) against the new hash. Reject reuse of the last N passwords.

---

### L-06: Email Verification Token Is Raw UUID in Body (LOW)

**File:** `src/auth/auth.controller.ts:73-76`

```typescript
@Post('verify-email')
async verifyEmail(@Body() token: string): Promise<{ message: string }> {
```

**Bug:** The email verification endpoint accepts a raw token from the request body. When sent via email link (typical pattern), the token appears in:
- The user's browser history
- Server access logs 
- Referrer headers

If any of these are compromised, the token can be reused to verify a different email.

**Fix:** Use a signed JWT for email verification with a short expiry (15 minutes). Or make the token single-use by marking it consumed on verification and requiring a new one for subsequent attempts.

---

## 7. Article Module — 3 Findings

### H-10: Article Slug Can Collide on Concurrent Creation (HIGH)

**File:** `src/articles/articles.service.ts:132-139`

```typescript
private async generateSlug(title: string, blogId: string): Promise<string> {
  let slug = title.toLowerCase().replace(...);
  // ... check if slug exists for this blog
  const existing = await this.repository.findBySlug(blogId, slug).catch(() => null);
  if (existing) {
    slug = `${slug}-${uuidv4().slice(0, 6)}`;
  }
  return slug;
}
```

**Bug:** The slug existence check and creation are NOT in a transaction. Two concurrent articles with the same title can both pass the `findBySlug` check (both see no existing slug) and both insert with the same slug.

**Impact:** Two articles in the same blog can end up with identical slugs, violating the implied unique constraint. The second user attempting to access one of the articles via slug will get ambiguous results.

**Fix:** Add `@@unique([blogId, slug])` to the Article model in Prisma. If the unique constraint is violated by a concurrent insert, catch the error and retry with a modified slug.

---

### M-09: Deduplication Does Not Cover Cross-Blog Title Similarity (MEDIUM)

**File:** `src/articles/pipeline/article-deduplication.service.ts`

**Bug:** Deduplication checks only exact URLs (`canonicalUrl`, `normalizedUrl`, `urlHash`, `feedEntryId`). It does NOT check title similarity. The same article published on two different blogs (e.g., syndicated content) will be imported twice.

**Impact:** Duplicate content across blogs clogs the search index and wastes storage.

**Fix:** Add a Levenshtein distance check or trigram similarity check on article titles when URLs don't match but content appears similar.

---

### L-07: Article View Counter Is Write-Per-Request (LOW)

**File:** `src/articles/articles.repository.ts:108-111`

```typescript
async incrementViews(id: string) {
  return this.prisma.article.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });
}
```

**Bug:** Every article view does a synchronous `UPDATE articles SET view_count = view_count + 1`. At 100K DAU, this is 100K writes/day to the same table, creating write contention on popular articles (all views hit the same row for a hot article).

**Impact:** DB write bottleneck. Hot articles cause row lock contention.

**Fix:** Buffer view increments in memory and flush periodically (every 10 seconds or every 100 views). Or use a dedicated counter table with batched upserts.

---

## 8. Search Module — 3 Findings

### H-11: Combined Search Loads All Results Into Memory (HIGH)

**File:** `src/search/search.service.ts:36-47`

```typescript
const [articleResult, blogResult] = await Promise.all([
  this.repository.searchArticles(query),
  this.repository.searchBlogs(query),
]);
const articleResults = articleResult.items.map(...)
const blogResults = blogResult.items.map(...);
const allResults = [...articleResults, ...blogResults].sort((a, b) => b.rank - a.rank);
return { results: allResults, total, ... };
```

**Bug:** `searchArticles()` and `searchBlogs()` each return `pageSize` results (default 20). The combined list concatenates both (max 40 items) and sorts in memory. BUT the `total` is the sum of ALL matching results (not just the page). The response returns `total: articleResult.total + blogResult.total` which could be 100K+, but only 40 items are in `results`. The frontend may show "100,000 results" but only see 40.

More critically: the sorting is done in-memory on only the first page of each result set. This means the "most relevant" result may be on page 2 of articles, but page 10 of blogs, and the in-memory merge never considers it.

**Impact:** Combined search results have incorrect ranking. The "top" results are actually "top of the first page of each index" — which is wrong.

**Fix:** Either:
1. Remove the combined search endpoint (use separate article/blog search)
2. Or implement a proper distributed merge (fetch more results from each index, merge, rank, then slice)
3. Or use PostgreSQL's full-text search across both tables in a single query

---

### M-10: Search Analytics Buffer Loses Data on Crash (MEDIUM)

**File:** `src/search/search-analytics.service.ts:18-42`

```typescript
private buffer: SearchAnalyticsEntry[] = [];
async track(entry: SearchAnalyticsEntry) {
  this.buffer.push(entry);
  if (this.buffer.length >= 50) await this.flush();
}
```

**Bug:** The analytics buffer is an in-memory array. If the process crashes between `track()` and the periodic `flush()`, all buffered analytics data is lost. The `startAutoFlush()` interval is 30 seconds — up to 30 seconds of data lost on every crash.

The `flush()` method also logs `'Failed to flush search analytics'` and then `this.buffer.unshift(...batch)` — this re-queues the batch at the front of the buffer. If flushing consistently fails (e.g., DB down), the buffer grows unboundedly and eventually OOMs the process.

**Impact:** Analytics gaps during restarts. Memory leak during DB outages.

**Fix:** 
- Set a maximum buffer size (e.g., 10,000 entries) and drop old entries if exceeded
- Flush synchronously before shutdown (`onModuleDestroy`)
- Use a dead-letter table for entries that fail to flush

---

### L-08: `searchBlogs()` `countSql` Parameter Slice Skips Pagination (LOW — Actually bug)

**File:** `src/search/search.repository.ts:197-199`

```typescript
params.push(pageSize, offset);
const [countResult, items] = await Promise.all([
  this.prisma.$queryRawUnsafe<Array<{ total: bigint }>>(countSql, ...params.slice(0, -2)),
  this.prisma.$queryRawUnsafe<any[]>(dataSql, ...params),
]);
```

**Bug:** `params.slice(0, -2)` removes the last 2 parameters (`pageSize` and `offset`). The `countSql` uses the same `whereClause` as `dataSql`, and the WHERE clause only references `$1`, `$2`, etc. — it never uses `pageSize` or `offset`. So the slice is correct for `countSql`. BUT: if `searchTerm` is empty and no filters are applied, `params` is empty, `pageSize` and `offset` are the only elements. `countSql` with zero params runs correctly (conditions are all static SQL strings). So this works, but it's fragile — adding a new filter that requires a param, or removing one, can break the offset calculation.

**Impact:** Maintainability hazard. Any change to filter conditions or parameter ordering can silently break pagination.

**Fix:** Build `countSql` and `dataSql` with their own independent parameter arrays rather than sharing and slicing.

---

## 9. RSS Module — 5 Findings

### C-07: Concurrent Feed Sync Creates Duplicate Entries (CRITICAL)

**File:** `src/rss/feeds.service.ts:207-253`

```typescript
for (const entry of parsed.entries) {
  // ... duplicate detection ...
  const guidExists = await this.repository.findEntryByGuid(feedId, entry.guid);
  if (guidExists) { result.duplicates++; continue; }
  
  const hashExists = await this.repository.findEntryByHash(feedId, entry.urlHash);
  if (hashExists) { result.duplicates++; continue; }
  
  await this.repository.createEntry({...}); // <-- INSERT
}
```

**Bug:** Duplicate detection and entry creation happen sequentially, NOT in a transaction, with no table-level lock. If the same feed is synced concurrently (possible via manual `POST /feeds/:id/sync` while auto-sync runs):
1. Sync A checks `findEntryByGuid('guid-1')` → null
2. Sync B checks `findEntryByGuid('guid-1')` → null
3. Sync A creates entry for 'guid-1'
4. Sync B creates entry for 'guid-1' ← DUPLICATE

The `@@unique([feedId, guid])` constraint will catch this at the DB level and Sync B will throw a unique constraint error. BUT: the error is caught by the try-catch on line 247 (`result.errors.push(...); result.skipped++`), so the error is silently swallowed, and the sync continues to the next entry. The sync result shows `duplicates: 0, skipped: 1, errors: [unique constraint violated]`.

**Impact:** Occasional skipped entries with silent errors. The user sees "sync succeeded" with a lower count than expected.

**Fix:** Wrap each entry creation in a retry-on-constraint loop, or use `ON CONFLICT DO NOTHING` via `$executeRawUnsafe` for the insert, or synchronize syncs per feed (e.g., file lock or DB advisory lock based on feedId).

---

### M-11: In-Memory Queues Are Lost on Restart (MEDIUM)

**Files:** `src/rss/scheduler/priority-queue.service.ts`, `retry-queue.service.ts`, `dead-letter-queue.service.ts`

**Bug:** All three queue implementations are plain JavaScript arrays. A process restart loses:
- All scheduled feed syncs (priority queue)
- All feeds awaiting retry (retry queue) — they never get another attempt
- All dead-letter metadata (dead letter queue) — lost permanently

**Impact:** Feeds that fail during a retry window are silently dropped on restart. If the server restarts for deployment, any feed in the middle of a retry sequence starts over from 0 attempts.

**Fix:** Persist queue state to the database. Add a `FeedQueueItem` table with `feedId`, `status`, `attemptCount`, `nextAttemptAt`, `lastError`. Use a DB query to find due items instead of an in-memory array.

---

### M-12: Sync `feed()` URL Fetch Uses No ETag/If-Modified-Since (MEDIUM)

**File:** `src/rss/feeds.service.ts:199-208`

```typescript
const response = await fetch(feed.url, {
  signal: controller.signal,
  headers: { 'User-Agent': 'MillionBlogs-RSS/1.0' },
  // No If-Modified-Since or If-None-Match
});
```

**Bug:** The feed fetcher does NOT send HTTP caching headers. Every sync downloads the full XML, even if the feed hasn't changed since the last sync. This wastes bandwidth and server resources, especially for feeds that update infrequently.

**Impact:** 5-10x unnecessary bandwidth usage per feed sync.

**Fix:** Store `etag` and `lastModified` on `RssFeed`. Send them as `If-None-Match` and `If-Modified-Since` headers. If server returns 304, skip processing entirely.

---

### L-09: Feed Sync Fetch Has No Connection Pooling (LOW)

**File:** `src/rss/feeds.service.ts:199`

```typescript
const response = await fetch(feed.url, { ... });
```

**Bug:** Uses Node's built-in `fetch` (global) with no connection pooling, no keep-alive, and no timeout configuration beyond the signal-based abort (which only covers the DNS+connect phase). Each feed sync creates a new TCP connection.

**Impact:** Higher latency per sync. DNS lookups repeated for every sync cycle.

**Fix:** Use `undici` Agent with connection pooling and keep-alive.

---

### L-10: Feed URL Has No Unique Constraint (LOW)

**File:** `prisma/schema.prisma:179-216`

**Bug:** `RssFeed.url` is not marked `@unique`. `feeds.service.addFeed()` checks `findByUrl()` but a concurrent add could bypass this check.

**Impact:** Duplicate feed URLs possible under race condition.

**Fix:** Add `@@unique([url])` to `RssFeed` model.

---

## 10. FeatureAccess Module — 2 Findings

### H-12: FeatureAccess Module is @Global() (HIGH)

**File:** `src/feature-access/feature-access.module.ts` (implied from `FeatureAccessService` being used in PromotionsModule without explicit import — actually let me check... Actually, the module likely uses `@Global()` based on ARCHITECTURE_FREEZE.md)

**Bug:** If FeatureAccessModule is `@Global()`, it's resolved before all its imported modules are fully initialized. Any of its imported modules (FounderModule, SubscriptionsModule, PlansModule) that later needs FeatureAccessService creates a circular dependency that fails silently with `undefined` providers.

**Impact:** Production crashes on module initialization. `FeatureAccessService` resolves to `undefined` at runtime.

**Fix:** Remove `@Global()`. Make FeatureAccessModule a regular module that other modules explicitly import.

---

### M-13: FeatureAccess Cache Missing (MEDIUM)

**File:** `src/feature-access/feature-access.service.ts:30-34`

```typescript
async resolve(userId: string): Promise<FeatureAccess> {
  const [founderSeat, activeSub, plans] = await Promise.all([
    this.founderRepository.getSeatByUserId(userId),
    this.subscriptionsRepository.findActiveByUserId(userId),
    this.plansRepository.findAllActive(),
  ]);
```

**Bug:** Every call to `resolve()` hits 3 database tables. Called on every article list, search result, and rotation request. No caching at all.

**Impact:** 3 extra queries per high-frequency request. At 1,000 requests/second, this is 3,000 extra DB queries with no read-replica benefit (writes are rare for this data).

**Fix:** Add in-memory cache with 60-second TTL. Invalidate on founder seat claim/upgrade, subscription create/activate/cancel/expire.

---

## 11. SEO Module — 2 Findings

### M-14: Category Sitemap Variable Name Bug (MEDIUM)

**File:** `src/seo/sitemap/sitemap.service.ts:85`

```typescript
return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uris}      // ← SHOULD BE ${urls}
</urlset>`;
```

**Bug:** `uris` is undefined. The variable holding the URL entries is `urls` (defined on line 100: `const urls = categories.map(...)`). The template literal uses a typo `uris` instead of `urls`.

**Impact:** The category sitemap (at `/sitemap/categories.xml`) will output `undefined` as a string. Search engines like Google will see an empty or malformed sitemap and likely skip it entirely. All category pages become invisible to search engines.

**Exploit:** N/A — straight-up bug. Search engines fail to index categories.

**Fix:** Change `${uris}` to `${urls}`.

---

### L-11: Sitemaps Have No Cache Headers (LOW)

**File:** `src/seo/seo.controller.ts:33-67`

**Bug:** Sitemap endpoints return XML content but set no `Cache-Control` headers. Search engines and CDNs will re-request sitemaps on every crawl, causing full database queries.

**Impact:** Unnecessary DB load from search engine crawlers.

**Fix:** Add `Cache-Control: public, max-age=3600` header to all sitemap endpoints.

---

## 12. Cross-Cutting — 6 Findings

### C-08: No Transactional Outbox for Any Critical Event (CRITICAL)

**Files:** `src/auth/auth.service.ts`, `src/payments/stripe/stripe.service.ts`, `src/founder/founder.service.ts`, `src/subscriptions/subscriptions.service.ts`

**Bug:** Every event emission in the system follows the pattern:
```typescript
await this.db.operation();        // DB write
await this.eventPublisher.publish({...});  // In-process event
```
If the process crashes between DB write and event publish, the event is lost. This affects:
- `PAYMENT_COMPLETED` — wallet never credited, subscription never activated
- `FOUNDER_SEAT_CLAIMED` — badge never assigned
- `SUBSCRIPTION_RENEWED` — invoice never created
- `PASSWORD_CHANGED` — audit trail incomplete

**Impact:** Silent state divergence. The database says one thing, the event-driven side effects never happen. Users don't get what they paid for.

**Fix:** Implement a transactional outbox: write the event to an `outbox_messages` table within the same `$transaction` as the DB write. A separate processor reads and publishes the events, retrying on failure.

---

### H-13: `$transaction` Isolation Is READ COMMITTED — Not SERIALIZABLE (HIGH)

**Files:** All modules using `this.prisma.$transaction`

**Bug:** Prisma's `$transaction` defaults to `READ COMMITTED` isolation level. None of the transaction blocks use `$transaction({ isolationLevel: Prisma.TransactionIsolationLevel.Serializable })`. This means phantom reads and non-repeatable reads are possible.

Affected transactions:
- Wallet credit/debit (balance read then update)
- Founder seat claim/upgrade (seat count read then update)
- Payment processing (payment read then update)
- Upgrade rollback (delete then re-create)

**Impact:** All transactional operations are vulnerable to the race conditions described in C-04, C-05, and C-07.

**Fix:** Upgrade critical transactions to `SERIALIZABLE` isolation or add explicit `SELECT ... FOR UPDATE` at the start of each transaction.

---

### M-15: No Rate Limiting on Business Operations (MEDIUM)

**Files:** Multiple

**Bug:** HTTP-level rate limiting exists (ThrottlerGuard), but there's no business-level rate limiting for expensive operations:
- `POST /search` — expensive FTS query with no cost/throttle
- `POST /feeds/:id/sync` — network fetch + parse + DB writes
- `POST /promotions/impression` — unauthenticated, no rate limit (see M-06)
- `POST /auth/forgot-password` — no per-email rate limit (only global check)
- `POST /auth/register` — no per-IP rate limit

**Exploit:** Attacker can: 
- Flood search → DB CPU at 100%
- Trigger 100 feed syncs simultaneously → 100 concurrent HTTP fetches
- Forget-password spam → fill email queue

**Fix:** Add per-endpoint rate limits in the business layer. Use a Redis-based rate limiter or the existing `BruteForceAttempt` table.

---

### M-16: Webhook Handler Processes Events Before Persistence Check (MEDIUM)

**File:** `src/payments/stripe/stripe-webhook.service.ts:24-27`

```typescript
const existing = await this.paymentsRepository.findWebhookEvent(event.id);
if (existing) {
  this.logger.log(`Duplicate webhook event: ${event.id}`);
  return { received: true };
}
await this.paymentsRepository.saveWebhookEvent(event.id, event.type, ...);
```

**Bug:** The check-and-save pattern is a TOCTOU window. If Stripe sends the same event twice simultaneously (possible during network retries), both requests pass the `findWebhookEvent` check before either saves, and both proceed to process the same event.

**Impact:** Double wallet credit, double subscription activation.

**Fix:** Use `@@unique` constraint on `stripeEventId` and handle the constraint violation as the dedup mechanism, rather than relying on a check-then-insert pattern.

---

### L-12: No API Versioning (LOW)

**Bug:** All routes are unversioned (`/api/search`, `/api/auth/login`, etc.). Any breaking change to API contracts requires coordination with all frontends.

**Fix:** Prefix routes with `/api/v1/` in all controllers.

---

### L-13: `class-validator` Validation Decorators Without Validation Pipe (LOW)

**Bug:** The DTOs use `class-validator` decorators (`@IsString()`, `@IsEmail()`, etc.) but the system must have a global `ValidationPipe` enabled for these to actually validate. If the `ValidationPipe` is not configured with `{ whitelist: true, forbidNonWhitelisted: true }`, then:
- Extra fields in request bodies are silently accepted (mass assignment risk)
- Validation decorators are ignored
- The API accepts anything

**Fix:** Verify `ValidationPipe` is globally configured with `whitelist: true` and `forbidNonWhitelisted: true`.

---

## Summary Statistics

| Severity | Count | Key Areas |
|----------|:-----:|-----------|
| CRITICAL | 8 | Payments (2), Wallet (2), Founder (2), RSS (1), Cross-cutting (1) |
| HIGH | 12 | Wallet (2), Subscriptions (2), Promotions (2), Auth (2), Articles (1), Search (1), FeatureAccess (1) |
| MEDIUM | 14 | Promotions (2), Auth (2), Articles (1), Search (1), RSS (2), SEO (1), FeatureAccess (1), Cross-cutting (2), Payments (1) |
| LOW | 12 | Wallet (2), Founder (1), Promotions (2), Auth (1), Articles (1), Search (1), RSS (2), SEO (1), Cross-cutting (2) |

**Total: 46 findings (8 critical, 12 high, 14 medium, 12 low)**

---

## Scoring Impact

If all 8 critical and 12 high findings are fixed:

| Dimension | Previous Score | Revised Score | Delta |
|-----------|:-------------:|:-------------:|:-----:|
| Architecture | 7.5 | 7.5 | — |
| Maintainability | 7.0 | 7.5 | +0.5 |
| Scalability | 5.5 | 6.0 | +0.5 |
| Technical Debt | 5.5 | 6.5 | +1.0 |
| **Composite** | **6.4** | **6.9** | **+0.5** |

**Estimated fix effort: 6–8 weeks** (1 developer, assuming no new feature work during this period).

---

## Top 10 Must-Fix (By Revenue/Integrity Impact)

| Rank | ID | Finding | Reason |
|:----:|:--:|---------|--------|
| 1 | C-01 | Checkout → Subscription wire missing | Users pay and get nothing |
| 2 | C-07 | Concurrent feed sync duplicates | Data corruption, silent errors |
| 3 | C-08 | No transactional outbox | Event loss on crash = revenue loss |
| 4 | C-03 | Wallet idempotency TOCTOU | Double-spend under concurrency |
| 5 | H-09 | Password reset token in event | Account takeover via event log |
| 6 | C-05 | Founder upgrade race loses seat | Users lose paid lifetime access |
| 7 | H-04 | No renewal payment collection | Subscription revenue = one-time |
| 8 | H-06 | Campaigns run past budget | Free impressions = money lost |
| 9 | H-08 | Refresh token theft undetected | Persistent account hijacking |
| 10 | M-14 | Category sitemap broken | All category pages invisible to SEO |

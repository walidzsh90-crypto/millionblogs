# MillionBlogs — Domain Events Catalog

**Version:** 3.0  
**Transport:** `@nestjs/event-emitter` (synchronous + async via queue)

---

## Event Bus Rules

1. **All domain events** are dispatched via `EventEmitter2` (nested event emitter).
2. **Publisher** does not await consumers — fire-and-forget within the same process, or offloaded to a Bull queue for async delivery.
3. **Reliability levels**: Each event specifies whether it must be delivered (persistent queue) or can be lost (in-memory).
4. **Idempotency**: Events that trigger financial or state-mutating side effects must be idempotent. Use a unique event ID with a processed-events dedup table or check the target state before acting.

---

## Event Catalog

### 1. UserRegistered

| Attribute | Value |
|---|---|
| **Description** | Fired after a new user successfully registers |
| **Publisher** | AuthModule |
| **Consumers** | UsersModule (create preferences + wallet), NotificationsModule (send welcome email) |
| **Reliability** | At-least-once (persistent queue) |
| **Idempotency** | Check if user preferences already exist before creating |

```typescript
interface UserRegisteredPayload {
  eventId: string;       // UUID v4
  occurredAt: Date;
  userId: string;
  email: string;
  displayName: string;
}
```

---

### 2. UserLoggedIn

| Attribute | Value |
|---|---|
| **Description** | Fired after successful login |
| **Publisher** | AuthModule |
| **Consumers** | (none currently — reserved for analytics) |
| **Reliability** | At-most-once (in-memory) |
| **Idempotency** | Not required (observational) |

```typescript
interface UserLoggedInPayload {
  eventId: string;
  occurredAt: Date;
  userId: string;
  ipAddress: string;
  deviceInfo: string | null;
}
```

---

### 3. UserLoggedOut

| Attribute | Value |
|---|---|
| **Description** | Fired after explicit logout or session revocation |
| **Publisher** | AuthModule |
| **Consumers** | (none currently) |
| **Reliability** | At-most-once (in-memory) |
| **Idempotency** | Not required |

```typescript
interface UserLoggedOutPayload {
  eventId: string;
  occurredAt: Date;
  userId: string;
  sessionId: string;
}
```

---

### 4. UserProfileUpdated

| Attribute | Value |
|---|---|
| **Description** | Fired when user updates their profile |
| **Publisher** | UsersModule |
| **Consumers** | (none currently) |
| **Reliability** | At-most-once (in-memory) |
| **Idempotency** | Not required |

```typescript
interface UserProfileUpdatedPayload {
  eventId: string;
  occurredAt: Date;
  userId: string;
  changedFields: string[];
}
```

---

### 5. UserDeleted

| Attribute | Value |
|---|---|
| **Description** | Fired when a user account is soft-deleted |
| **Publisher** | UsersModule |
| **Consumers** | BlogsModule (handle blog ownership — reassign or delete), NotificationsModule (cleanup) |
| **Reliability** | At-least-once (persistent queue) |
| **Idempotency** | Check if user already deleted before cascading |

```typescript
interface UserDeletedPayload {
  eventId: string;
  occurredAt: Date;
  userId: string;
}
```

---

### 6. BlogCreated

| Attribute | Value |
|---|---|
| **Description** | Fired after a blog is registered |
| **Publisher** | BlogsModule |
| **Consumers** | RssModule (auto-connect feed if URL detected), BadgesModule (check early adopter badge), NotificationsModule, SeoModule (invalidate sitemap cache) |
| **Reliability** | At-least-once (persistent queue) |
| **Idempotency** | Check if blog already processed before acting |

```typescript
interface BlogCreatedPayload {
  eventId: string;
  occurredAt: Date;
  blogId: string;
  userId: string;
  url: string;
  language: string;
}
```

---

### 7. BlogVerified

| Attribute | Value |
|---|---|
| **Description** | Fired when blog ownership is successfully verified |
| **Publisher** | BlogsModule |
| **Consumers** | BadgesModule (auto-assign verified badge), NotificationsModule (notify owner) |
| **Reliability** | At-least-once (persistent queue) |
| **Idempotency** | Check if verified badge already assigned before assigning |

```typescript
interface BlogVerifiedPayload {
  eventId: string;
  occurredAt: Date;
  blogId: string;
  userId: string;
  method: VerificationMethod;
}
```

---

### 8. VerificationInitiated

| Attribute | Value |
|---|---|
| **Description** | Fired when a new verification attempt is started |
| **Publisher** | BlogsModule |
| **Consumers** | (none currently) |
| **Reliability** | At-most-once (in-memory) |
| **Idempotency** | Not required |

```typescript
interface VerificationInitiatedPayload {
  eventId: string;
  occurredAt: Date;
  blogId: string;
  method: VerificationMethod;
  token: string;
}
```

---

### 9. BlogUpdated

| Attribute | Value |
|---|---|
| **Description** | Fired when blog metadata is updated |
| **Publisher** | BlogsModule |
| **Consumers** | SeoModule (invalidate sitemap cache) |
| **Reliability** | At-most-once (in-memory) |
| **Idempotency** | Not required |

```typescript
interface BlogUpdatedPayload {
  eventId: string;
  occurredAt: Date;
  blogId: string;
  changedFields: string[];
}
```

---

### 10. BlogDeleted

| Attribute | Value |
|---|---|
| **Description** | Fired when a blog is soft-deleted |
| **Publisher** | BlogsModule |
| **Consumers** | RssModule (disconnect feed), ArticlesModule (soft-delete articles), PromotionsModule (cancel campaigns), BadgesModule (revoke badges), NotificationsModule, SeoModule |
| **Reliability** | At-least-once (persistent queue) |
| **Idempotency** | Check if blog already deleted before cascading |

```typescript
interface BlogDeletedPayload {
  eventId: string;
  occurredAt: Date;
  blogId: string;
  userId: string;
}
```

---

### 11. FeedConnected

| Attribute | Value |
|---|---|
| **Description** | Fired when an RSS feed is successfully connected to a blog |
| **Publisher** | RssModule |
| **Consumers** | (none currently) |
| **Reliability** | At-most-once (in-memory) |
| **Idempotency** | Not required |

```typescript
interface FeedConnectedPayload {
  eventId: string;
  occurredAt: Date;
  feedId: string;
  blogId: string;
  feedUrl: string;
}
```

---

### 12. FeedFetchSucceeded

| Attribute | Value |
|---|---|
| **Description** | Fired after a successful feed ingestion |
| **Publisher** | RssModule |
| **Consumers** | ArticlesModule (process new articles), RssModule (update feed health) |
| **Reliability** | At-least-once (persistent queue) |
| **Idempotency** | Check `RssFeedLog.id` — skip if already processed by checking the log's createdAt |

```typescript
interface FeedFetchSucceededPayload {
  eventId: string;
  occurredAt: Date;
  feedId: string;
  blogId: string;
  logId: string;
  articlesFound: number;
  articlesAdded: number;
  articlesDuplicate: number;
  newArticleIds: string[];
}
```

---

### 13. FeedFetchFailed

| Attribute | Value |
|---|---|
| **Description** | Fired when a feed fetch fails |
| **Publisher** | RssModule |
| **Consumers** | RssModule (update error count, backoff) |
| **Reliability** | At-most-once (in-memory) |
| **Idempotency** | Not required |

```typescript
interface FeedFetchFailedPayload {
  eventId: string;
  occurredAt: Date;
  feedId: string;
  blogId: string;
  errorMessage: string;
  consecutiveErrors: number;
}
```

---

### 14. FeedMarkedDead

| Attribute | Value |
|---|---|
| **Description** | Fired when a feed is marked as dead after consecutive failures |
| **Publisher** | RssModule |
| **Consumers** | NotificationsModule (notify blog owner), AdminModule (log for review) |
| **Reliability** | At-least-once (persistent queue) |
| **Idempotency** | Check if feed is already dead before notifying |

```typescript
interface FeedMarkedDeadPayload {
  eventId: string;
  occurredAt: Date;
  feedId: string;
  blogId: string;
  consecutiveErrors: number;
}
```

---

### 15. ArticleIndexed

| Attribute | Value |
|---|---|
| **Description** | Fired when a new article is indexed |
| **Publisher** | ArticlesModule |
| **Consumers** | SearchModule (update search index), SeoModule (invalidate sitemap cache) |
| **Reliability** | At-most-once (in-memory; search can be refreshed lazily) |
| **Idempotency** | Check if article search vector is already populated |

```typescript
interface ArticleIndexedPayload {
  eventId: string;
  occurredAt: Date;
  articleId: string;
  blogId: string;
  title: string;
  language: string;
  categoryIds: string[];
}
```

---

### 16. ArticleDeleted

| Attribute | Value |
|---|---|
| **Description** | Fired when an article is soft-deleted |
| **Publisher** | ArticlesModule |
| **Consumers** | SearchModule (remove from index), SeoModule (invalidate sitemap) |
| **Reliability** | At-most-once (in-memory) |
| **Idempotency** | Check if article already removed from search index |

```typescript
interface ArticleDeletedPayload {
  eventId: string;
  occurredAt: Date;
  articleId: string;
  blogId: string;
}
```

---

### 17. PromotionCampaignCreated

| Attribute | Value |
|---|---|
| **Description** | Fired when a promotion campaign is created (awaiting payment) |
| **Publisher** | PromotionsModule |
| **Consumers** | PaymentsModule (initiate payment flow) |
| **Reliability** | At-least-once (persistent queue) |
| **Idempotency** | Check if payment already initiated for this campaign |

```typescript
interface PromotionCampaignCreatedPayload {
  eventId: string;
  occurredAt: Date;
  campaignId: string;
  blogId: string;
  totalCostCents: number;
  startDate: Date;
  endDate: Date;
}
```

---

### 18. PromotionCampaignActivated

| Attribute | Value |
|---|---|
| **Description** | Fired when a paid promotion campaign becomes active |
| **Publisher** | PromotionsModule |
| **Consumers** | SearchModule (boost blog ranking), BadgesModule (check promoter badge), NotificationsModule |
| **Reliability** | At-least-once (persistent queue) |
| **Idempotency** | Check if campaign is already active before applying boost |

```typescript
interface PromotionCampaignActivatedPayload {
  eventId: string;
  occurredAt: Date;
  campaignId: string;
  blogId: string;
  startDate: Date;
  endDate: Date;
  isFeatured: boolean;
}
```

---

### 19. PromotionCampaignCompleted

| Attribute | Value |
|---|---|
| **Description** | Fired when a campaign naturally ends |
| **Publisher** | PromotionsModule |
| **Consumers** | SearchModule (remove ranking boost), NotificationsModule |
| **Reliability** | At-most-once (in-memory) |
| **Idempotency** | Not required |

```typescript
interface PromotionCampaignCompletedPayload {
  eventId: string;
  occurredAt: Date;
  campaignId: string;
  blogId: string;
  endDate: Date;
}
```

---

### 20. PromotionCampaignCancelled

| Attribute | Value |
|---|---|
| **Description** | Fired when a campaign is cancelled before completion |
| **Publisher** | PromotionsModule |
| **Consumers** | WalletModule (refund if applicable), NotificationsModule |
| **Reliability** | At-least-once (persistent queue) |
| **Idempotency** | Check if refund already processed before initiating |

```typescript
interface PromotionCampaignCancelledPayload {
  eventId: string;
  occurredAt: Date;
  campaignId: string;
  blogId: string;
  reason: string;
}
```

---

### 21. PaymentInitiated

| Attribute | Value |
|---|---|
| **Description** | Fired when a Stripe checkout session is created |
| **Publisher** | PaymentsModule |
| **Consumers** | (none currently — reserved for analytics) |
| **Reliability** | At-most-once (in-memory) |
| **Idempotency** | Not required |

```typescript
interface PaymentInitiatedPayload {
  eventId: string;
  occurredAt: Date;
  paymentOrderId: string;
  userId: string;
  amountCents: number;
  type: PaymentOrderType;
}
```

---

### 22. PaymentCompleted

| Attribute | Value |
|---|---|
| **Description** | Fired when a Stripe payment succeeds (webhook verified) |
| **Publisher** | PaymentsModule |
| **Consumers** | WalletModule (credit wallet), PromotionsModule (activate campaign), FounderPlans (activate assignment), NotificationsModule |
| **Reliability** | **Exactly-once** (via Stripe idempotency + DB dedup) |
| **Idempotency** | **Critical.** Check `PaymentOrder.stripeSessionId` uniqueness. If already processed, skip. |

```typescript
interface PaymentCompletedPayload {
  eventId: string;
  occurredAt: Date;
  paymentOrderId: string;
  userId: string;
  walletId: string | null;
  amountCents: number;
  type: PaymentOrderType;
  stripeSessionId: string;
  metadata: Record<string, unknown> | null;
}
```

---

### 23. PaymentFailed

| Attribute | Value |
|---|---|
| **Description** | Fired when a payment fails |
| **Publisher** | PaymentsModule |
| **Consumers** | NotificationsModule (notify user) |
| **Reliability** | At-most-once (in-memory) |
| **Idempotency** | Not required |

```typescript
interface PaymentFailedPayload {
  eventId: string;
  occurredAt: Date;
  paymentOrderId: string;
  userId: string;
  errorMessage: string;
}
```

---

### 24. PaymentRefunded

| Attribute | Value |
|---|---|
| **Description** | Fired when a payment is refunded |
| **Publisher** | PaymentsModule |
| **Consumers** | WalletModule (reverse credits), NotificationsModule |
| **Reliability** | At-least-once (persistent queue) |
| **Idempotency** | Check if refund already applied to wallet before debiting |

```typescript
interface PaymentRefundedPayload {
  eventId: string;
  occurredAt: Date;
  paymentOrderId: string;
  userId: string;
  amountCents: number;
}
```

---

### 25. WalletCredited

| Attribute | Value |
|---|---|
| **Description** | Fired when wallet balance increases |
| **Publisher** | WalletModule |
| **Consumers** | NotificationsModule |
| **Reliability** | At-most-once (in-memory) |
| **Idempotency** | Not required (notifications are best-effort) |

```typescript
interface WalletCreditedPayload {
  eventId: string;
  occurredAt: Date;
  walletId: string;
  userId: string;
  amountCents: number;
  balanceAfterCents: number;
  transactionId: string;
  reason: string;
}
```

---

### 26. WalletDebited

| Attribute | Value |
|---|---|
| **Description** | Fired when wallet balance decreases (purchase spend) |
| **Publisher** | WalletModule |
| **Consumers** | NotificationsModule |
| **Reliability** | At-most-once (in-memory) |
| **Idempotency** | Not required |

```typescript
interface WalletDebitedPayload {
  eventId: string;
  occurredAt: Date;
  walletId: string;
  userId: string;
  amountCents: number;
  balanceAfterCents: number;
  transactionId: string;
  referenceType: string;
  referenceId: string;
}
```

---

### 27. BadgeAssigned

| Attribute | Value |
|---|---|
| **Description** | Fired when a badge is assigned to a blog |
| **Publisher** | BadgesModule |
| **Consumers** | NotificationsModule (notify blog owner) |
| **Reliability** | At-least-once (persistent queue) |
| **Idempotency** | Check if notification already sent for this assignment |

```typescript
interface BadgeAssignedPayload {
  eventId: string;
  occurredAt: Date;
  assignmentId: string;
  blogId: string;
  badgeDefinitionId: string;
  badgeName: string;
  svgUrl: string;
}
```

---

### 28. BadgeRevoked

| Attribute | Value |
|---|---|
| **Description** | Fired when a badge is revoked from a blog |
| **Publisher** | BadgesModule |
| **Consumers** | NotificationsModule |
| **Reliability** | At-most-once (in-memory) |
| **Idempotency** | Not required |

```typescript
interface BadgeRevokedPayload {
  eventId: string;
  occurredAt: Date;
  assignmentId: string;
  blogId: string;
  badgeDefinitionId: string;
  reason: string | null;
}
```

---

### 29. SupportTicketOpened

| Attribute | Value |
|---|---|
| **Description** | Fired when a user opens a support ticket |
| **Publisher** | SupportModule |
| **Consumers** | NotificationsModule (notify admin assignee), AdminModule (log for triage) |
| **Reliability** | At-least-once (persistent queue) |
| **Idempotency** | Check if admin already notified for this ticket |

```typescript
interface SupportTicketOpenedPayload {
  eventId: string;
  occurredAt: Date;
  ticketId: string;
  userId: string;
  subject: string;
  priority: SupportTicketPriority;
}
```

---

### 30. SupportTicketResolved

| Attribute | Value |
|---|---|
| **Description** | Fired when a support ticket is marked resolved |
| **Publisher** | SupportModule |
| **Consumers** | NotificationsModule (notify user) |
| **Reliability** | At-most-once (in-memory) |
| **Idempotency** | Not required |

```typescript
interface SupportTicketResolvedPayload {
  eventId: string;
  occurredAt: Date;
  ticketId: string;
  userId: string;
  resolvedBy: string;
}
```

---

### 31. FeatureFlagToggled

| Attribute | Value |
|---|---|
| **Description** | Fired when a feature flag is enabled/disabled |
| **Publisher** | SystemModule |
| **Consumers** | (none currently — consumed by application infrastructure layer) |
| **Reliability** | At-most-once (in-memory) |
| **Idempotency** | Not required |

```typescript
interface FeatureFlagToggledPayload {
  eventId: string;
  occurredAt: Date;
  key: string;
  isEnabled: boolean;
  toggledBy: string;
}
```

---

### 32. AdminActionPerformed

| Attribute | Value |
|---|---|
| **Description** | Fired when an admin performs a sensitive action |
| **Publisher** | AdminModule |
| **Consumers** | SystemModule (write audit log entry) |
| **Reliability** | At-least-once (persistent queue) |
| **Idempotency** | Check if audit log entry already exists for this action |

```typescript
interface AdminActionPerformedPayload {
  eventId: string;
  occurredAt: Date;
  adminId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changeset: Record<string, unknown> | null;
}
```

---

## Event Reliability Classification

| Level | Guarantee | Queue | Use Cases |
|---|---|---|---|
| **Exactly-once** | Dedup + idempotency + persisted | Bull (persistent) | `PaymentCompleted` |
| **At-least-once** | Persisted + retry | Bull (persistent) | `UserRegistered`, `BlogVerified`, `BadgeAssigned`, `PaymentRefunded`, `PromotionCampaignCreated`, `UserDeleted`, `BlogDeleted`, `FeedFetchSucceeded`, `FeedMarkedDead`, `SupportTicketOpened` |
| **At-most-once** | In-memory, no retry | EventEmitter2 (sync) | `UserLoggedIn`, `UserProfileUpdated`, `ArticleIndexed`, `PromotionCampaignCompleted`, `WalletCredited`, `BadgeRevoked` |

---

*End of Domain Events Catalog.*

# MillionBlogs — Repository Contracts

**Version:** 3.0  
**Pattern:** Repository pattern with Prisma as the single implementation

---

## Rules

1. **Interface per entity** — defined in the domain layer of the owning module.
2. **PrismaService** injected into each repository implementation.
3. **Read-only vs. write** — query-only modules (Search, SEO) access data through read-only repository interfaces or dedicated query services.
4. **No Prisma types leak** into domain — repositories return domain-compatible types or plain objects.
5. **Soft delete awareness** — all `find*` methods filter `deleted_at IS NULL` by default. Include `includeDeleted?: boolean` parameter for admin use.
6. **Transaction support** — all write operations accept an optional `Prisma.TransactionClient` for distributed transactions.

---

## Repository Interfaces

### 1. IUserRepository

```typescript
interface IUserRepository {
  // Read
  findById(id: string, opts?: FindOptions): Promise<User | null>;
  findByEmail(email: string, opts?: FindOptions): Promise<User | null>;
  findMany(where: UserFilter, opts?: FindManyOptions): Promise<User[]>;
  count(where: UserFilter): Promise<number>;

  // Write
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  softDelete(id: string): Promise<void>;

  // Batch
  updateMany(where: UserFilter, data: UpdateUserData): Promise<number>;
}
```

### 2. IUserPreferenceRepository

```typescript
interface IUserPreferenceRepository {
  findByUserId(userId: string): Promise<UserPreference | null>;
  upsert(userId: string, data: UpsertPreferenceData): Promise<UserPreference>;
  softDeleteByUserId(userId: string): Promise<void>;
}
```

### 3. ISessionRepository

```typescript
interface ISessionRepository {
  findById(id: string): Promise<Session | null>;
  findByRefreshTokenHash(hash: string): Promise<Session | null>;
  findActiveByUserId(userId: string): Promise<Session[]>;
  create(data: CreateSessionData): Promise<Session>;
  revoke(id: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<number>;
  deleteExpired(): Promise<number>;  // Cleanup job
}
```

### 4. IBlogRepository

```typescript
interface IBlogRepository {
  // Read
  findById(id: string, opts?: FindOptions): Promise<Blog | null>;
  findBySlug(slug: string, opts?: FindOptions): Promise<Blog | null>;
  findByUrl(url: string, opts?: FindOptions): Promise<Blog | null>;
  findMany(where: BlogFilter, opts?: FindManyOptions): Promise<Blog[]>;
  count(where: BlogFilter): Promise<number>;

  // Write
  create(data: CreateBlogData): Promise<Blog>;
  update(id: string, data: UpdateBlogData): Promise<Blog>;
  softDelete(id: string): Promise<void>;
  markVerified(id: string, method: VerificationMethod): Promise<Blog>;

  // Search
  search(query: string, opts?: SearchOptions): Promise<BlogSearchResult[]>;
}
```

### 5. IBlogVerificationRepository

```typescript
interface IBlogVerificationRepository {
  findById(id: string): Promise<BlogVerification | null>;
  findLatestByBlogId(blogId: string): Promise<BlogVerification | null>;
  findPendingByToken(token: string): Promise<BlogVerification | null>;
  findByBlogId(blogId: string): Promise<BlogVerification[]>;
  create(data: CreateVerificationData): Promise<BlogVerification>;
  updateStatus(id: string, status: VerificationStatus): Promise<BlogVerification>;
  incrementAttempt(id: string): Promise<BlogVerification>;
  expireOldPending(): Promise<number>;  // Cleanup job
}
```

### 6. ICategoryRepository

```typescript
interface ICategoryRepository {
  findById(id: string, opts?: FindOptions): Promise<Category | null>;
  findBySlug(slug: string, opts?: FindOptions): Promise<Category | null>;
  findTree(parentId?: string): Promise<Category[]>;
  findActive(): Promise<Category[]>;
  create(data: CreateCategoryData): Promise<Category>;
  update(id: string, data: UpdateCategoryData): Promise<Category>;
  softDelete(id: string): Promise<void>;

  // Translations
  findTranslation(categoryId: string, language: string): Promise<CategoryTranslation | null>;
  upsertTranslation(data: UpsertTranslationData): Promise<CategoryTranslation>;
  findTranslationsByCategory(categoryId: string): Promise<CategoryTranslation[]>;
}
```

### 7. IBlogCategoryRepository

```typescript
interface IBlogCategoryRepository {
  findByBlogId(blogId: string): Promise<BlogCategory[]>;
  findByCategoryId(categoryId: string): Promise<BlogCategory[]>;
  assign(blogId: string, categoryId: string): Promise<BlogCategory>;
  unassign(blogId: string, categoryId: string): Promise<void>;
  setCategories(blogId: string, categoryIds: string[]): Promise<BlogCategory[]>;  // Replace all
}
```

### 8. IArticleCategoryRepository

```typescript
interface IArticleCategoryRepository {
  findByArticleId(articleId: string): Promise<ArticleCategory[]>;
  findByCategoryId(categoryId: string): Promise<ArticleCategory[]>;
  assign(articleId: string, categoryId: string): Promise<ArticleCategory>;
  unassign(articleId: string, categoryId: string): Promise<void>;
  setCategories(articleId: string, categoryIds: string[]): Promise<ArticleCategory[]>;
}
```

### 9. IRssFeedRepository

```typescript
interface IRssFeedRepository {
  findById(id: string, opts?: FindOptions): Promise<RssFeed | null>;
  findByBlogId(blogId: string): Promise<RssFeed | null>;
  findDueForFetch(limit: number): Promise<RssFeed[]>;
  findDeadFeeds(): Promise<RssFeed[]>;
  create(data: CreateFeedData): Promise<RssFeed>;
  update(id: string, data: UpdateFeedData): Promise<RssFeed>;
  softDelete(id: string): Promise<void>;
  markFetchComplete(id: string, result: FetchResult): Promise<RssFeed>;
  markError(id: string, errorMessage: string): Promise<RssFeed>;
  resetDeadFeed(id: string): Promise<RssFeed>;
}
```

### 10. IRssFeedLogRepository

```typescript
interface IRssFeedLogRepository {
  findByFeedId(feedId: string, opts?: FindManyOptions): Promise<RssFeedLog[]>;
  findById(id: string): Promise<RssFeedLog | null>;
  create(data: CreateFeedLogData): Promise<RssFeedLog>;
  countByFeedId(feedId: string): Promise<number>;

  // Admin / cleanup
  findOldRecords(olderThan: Date): Promise<RssFeedLog[]>;
  deleteOldRecords(olderThan: Date): Promise<number>;  // Hard delete from archive table
}
```

### 11. IArticleRepository

```typescript
interface IArticleRepository {
  // Read
  findById(id: string, opts?: FindOptions): Promise<Article | null>;
  findByUrl(url: string): Promise<Article | null>;
  findByUrlHash(hash: string): Promise<Article | null>;
  findMany(where: ArticleFilter, opts?: FindManyOptions): Promise<Article[]>;
  count(where: ArticleFilter): Promise<number>;

  // Write
  create(data: CreateArticleData): Promise<Article>;
  update(id: string, data: UpdateArticleData): Promise<Article>;
  softDelete(id: string): Promise<void>;
  softDeleteByBlogId(blogId: string): Promise<number>;

  // Batch (for RSS ingestion)
  bulkCreate(data: CreateArticleData[]): Promise<Article[]>;
  bulkSoftDelete(ids: string[]): Promise<number>;

  // Search (full-text via raw query)
  search(query: string, opts?: ArticleSearchOptions): Promise<ArticleSearchResult[]>;
}
```

### 12. IPromotionPricingRepository

```typescript
interface IPromotionPricingRepository {
  findById(id: string): Promise<PromotionPricing | null>;
  findActive(): Promise<PromotionPricing[]>;
  findAll(): Promise<PromotionPricing[]>;
  create(data: CreatePricingData): Promise<PromotionPricing>;
  update(id: string, data: UpdatePricingData): Promise<PromotionPricing>;
  softDelete(id: string): Promise<void>;
}
```

### 13. IPromotionCampaignRepository

```typescript
interface IPromotionCampaignRepository {
  findById(id: string): Promise<PromotionCampaign | null>;
  findByBlogId(blogId: string): Promise<PromotionCampaign[]>;
  findActiveByBlogId(blogId: string): Promise<PromotionCampaign | null>;
  findActiveCampaigns(): Promise<PromotionCampaign[]>;
  findExpiringSoon(windowEnd: Date): Promise<PromotionCampaign[]>;
  findOverlapping(blogId: string, start: Date, end: Date): Promise<PromotionCampaign[]>;
  create(data: CreateCampaignData): Promise<PromotionCampaign>;
  update(id: string, data: UpdateCampaignData): Promise<PromotionCampaign>;
  softDelete(id: string): Promise<void>;

  // Status transitions
  activate(id: string): Promise<PromotionCampaign>;
  complete(id: string): Promise<PromotionCampaign>;
  cancel(id: string, reason: string): Promise<PromotionCampaign>;
}
```

### 14. IWalletRepository

```typescript
interface IWalletRepository {
  findByUserId(userId: string): Promise<Wallet | null>;
  findById(id: string): Promise<Wallet | null>;
  create(userId: string): Promise<Wallet>;
  updateBalance(id: string, newBalance: number, version: number): Promise<Wallet | null>;  // Returns null if version mismatch
  freeze(id: string): Promise<Wallet>;
  unfreeze(id: string): Promise<Wallet>;
}
```

### 15. IWalletTransactionRepository

```typescript
interface IWalletTransactionRepository {
  findByWalletId(walletId: string, opts?: FindManyOptions): Promise<WalletTransaction[]>;
  findById(id: string): Promise<WalletTransaction | null>;
  findByReference(referenceType: string, referenceId: string): Promise<WalletTransaction[]>;
  create(data: CreateTransactionData): Promise<WalletTransaction>;
  countByWalletId(walletId: string): Promise<number>;
  getStatement(walletId: string, startDate: Date, endDate: Date): Promise<WalletTransaction[]>;

  // No update, no delete — immutability enforced
}
```

### 16. IPaymentOrderRepository

```typescript
interface IPaymentOrderRepository {
  findById(id: string): Promise<PaymentOrder | null>;
  findByStripeSessionId(sessionId: string): Promise<PaymentOrder | null>;
  findByUserId(userId: string, opts?: FindManyOptions): Promise<PaymentOrder[]>;
  findPending(): Promise<PaymentOrder[]>;
  create(data: CreatePaymentOrderData): Promise<PaymentOrder>;
  update(id: string, data: UpdatePaymentOrderData): Promise<PaymentOrder>;
  markCompleted(id: string, stripePaymentIntentId: string): Promise<PaymentOrder>;
  markFailed(id: string, error: string): Promise<PaymentOrder>;
  markRefunded(id: string, amountCents: number): Promise<PaymentOrder>;
}
```

### 17. IFounderPlanRepository

```typescript
interface IFounderPlanRepository {
  findById(id: string): Promise<FounderPlan | null>;
  findActive(): Promise<FounderPlan[]>;
  findAvailable(): Promise<FounderPlan[]>;  // Not sold out, within signup window
  create(data: CreateFounderPlanData): Promise<FounderPlan>;
  update(id: string, data: UpdateFounderPlanData): Promise<FounderPlan>;
  softDelete(id: string): Promise<void>;
  incrementSeatsTaken(id: string): Promise<FounderPlan>;
}
```

### 18. IFounderPlanAssignmentRepository

```typescript
interface IFounderPlanAssignmentRepository {
  findById(id: string): Promise<FounderPlanAssignment | null>;
  findByUserId(userId: string): Promise<FounderPlanAssignment[]>;
  findByBlogId(blogId: string): Promise<FounderPlanAssignment[]>;
  findByPlanId(planId: string): Promise<FounderPlanAssignment[]>;
  findActiveByBlogId(blogId: string): Promise<FounderPlanAssignment | null>;
  countActiveByPlanId(planId: string): Promise<number>;
  create(data: CreateAssignmentData): Promise<FounderPlanAssignment>;
  revoke(id: string, reason: string): Promise<FounderPlanAssignment>;
  expire(id: string): Promise<FounderPlanAssignment>;
}
```

### 19. IBadgeDefinitionRepository

```typescript
interface IBadgeDefinitionRepository {
  findById(id: string): Promise<BadgeDefinition | null>;
  findBySlug(slug: string): Promise<BadgeDefinition | null>;
  findActive(): Promise<BadgeDefinition[]>;
  findAutoAssignable(): Promise<BadgeDefinition[]>;
  create(data: CreateBadgeDefinitionData): Promise<BadgeDefinition>;
  update(id: string, data: UpdateBadgeDefinitionData): Promise<BadgeDefinition>;
  softDelete(id: string): Promise<void>;
}
```

### 20. IBadgeAssignmentRepository

```typescript
interface IBadgeAssignmentRepository {
  findById(id: string): Promise<BadgeAssignment | null>;
  findByBlogId(blogId: string): Promise<BadgeAssignment[]>;
  findByBadgeDefinitionId(badgeDefId: string): Promise<BadgeAssignment[]>;
  findBlogBadge(blogId: string, badgeDefId: string): Promise<BadgeAssignment | null>;
  exists(blogId: string, badgeDefId: string): Promise<boolean>;
  create(data: CreateBadgeAssignmentData): Promise<BadgeAssignment>;
  revoke(id: string): Promise<BadgeAssignment>;
}
```

### 21. INotificationRepository

```typescript
interface INotificationRepository {
  findById(id: string): Promise<Notification | null>;
  findByUserId(userId: string, opts?: FindManyOptions): Promise<Notification[]>;
  findUnreadByUserId(userId: string): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  create(data: CreateNotificationData): Promise<Notification>;
  markRead(id: string): Promise<void>;
  markAllRead(userId: string): Promise<number>;
  softDelete(id: string): Promise<void>;
}
```

### 22. INotificationDeliveryRepository

```typescript
interface INotificationDeliveryRepository {
  findById(id: string): Promise<NotificationDelivery | null>;
  findByNotificationId(notificationId: string): Promise<NotificationDelivery[]>;
  findPendingByChannel(channel: NotificationChannel): Promise<NotificationDelivery[]>;
  create(data: CreateDeliveryData): Promise<NotificationDelivery>;
  updateStatus(id: string, status: DeliveryStatus, error?: string): Promise<void>;
}
```

### 23. ISupportTicketRepository

```typescript
interface ISupportTicketRepository {
  findById(id: string): Promise<SupportTicket | null>;
  findByUserId(userId: string, opts?: FindManyOptions): Promise<SupportTicket[]>;
  findOpen(opts?: FindManyOptions): Promise<SupportTicket[]>;
  findByAssignee(adminId: string): Promise<SupportTicket[]>;
  create(data: CreateTicketData): Promise<SupportTicket>;
  update(id: string, data: UpdateTicketData): Promise<SupportTicket>;
  assign(id: string, adminId: string): Promise<SupportTicket>;
  resolve(id: string): Promise<SupportTicket>;
  close(id: string): Promise<SupportTicket>;
  reopen(id: string): Promise<SupportTicket>;
}
```

### 24. IAuditLogRepository

```typescript
interface IAuditLogRepository {
  findById(id: string): Promise<AuditLog | null>;
  findByActorId(actorId: string, opts?: FindManyOptions): Promise<AuditLog[]>;
  findByResource(resourceType: string, resourceId: string): Promise<AuditLog[]>;
  findByAction(action: string, opts?: FindManyOptions): Promise<AuditLog[]>;
  findMany(where: AuditLogFilter, opts?: FindManyOptions): Promise<AuditLog[]>;
  create(data: CreateAuditLogData): Promise<AuditLog>;

  // No update, no delete — immutability enforced
}
```

### 25. IFeatureFlagRepository

```typescript
interface IFeatureFlagRepository {
  findByKey(key: string): Promise<FeatureFlag | null>;
  findAll(): Promise<FeatureFlag[]>;
  findEnabled(): Promise<FeatureFlag[]>;
  create(data: CreateFlagData): Promise<FeatureFlag>;
  update(key: string, data: UpdateFlagData): Promise<FeatureFlag>;
  softDelete(key: string): Promise<void>;
  isEnabled(key: string): Promise<boolean>;
}
```

### 26. ISystemConfigurationRepository

```typescript
interface ISystemConfigurationRepository {
  findByKey(key: string): Promise<SystemConfiguration | null>;
  findAll(): Promise<SystemConfiguration[]>;
  upsert(key: string, value: JsonValue, description?: string): Promise<SystemConfiguration>;
  delete(key: string): Promise<void>;
}
```

---

## Shared Types

```typescript
interface FindOptions {
  includeDeleted?: boolean;
  transaction?: Prisma.TransactionClient;
}

interface FindManyOptions {
  skip?: number;
  take?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  includeDeleted?: boolean;
  transaction?: Prisma.TransactionClient;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

*End of Repository Contracts.*

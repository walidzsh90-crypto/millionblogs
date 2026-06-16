# MillionBlogs — Service Contracts

**Version:** 3.0  
**Pattern:** Application Service → Domain Service → Repository

---

## Contract Format

Each service defines:
- **Input DTO** (typed interface)
- **Output DTO** (typed interface)  
- **Validation Rules** (class-validator decorators)
- **Error Cases** (exceptions thrown)

---

## 1. AuthModule Services

### 1.1 AuthService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `register` | `RegisterDto` | `AuthTokensDto` | `EmailAlreadyExists`, `WeakPassword` |
| `login` | `LoginDto` | `AuthTokensDto` | `InvalidCredentials`, `EmailNotVerified` |
| `refresh` | `RefreshTokenDto` | `AuthTokensDto` | `InvalidRefreshToken`, `SessionExpired` |
| `logout` | `LogoutDto` | `void` | `SessionNotFound` |
| `verifyEmail` | `VerifyEmailDto` | `void` | `InvalidToken`, `TokenExpired` |
| `requestPasswordReset` | `PasswordResetRequestDto` | `void` | `UserNotFound` |
| `resetPassword` | `PasswordResetDto` | `void` | `InvalidToken`, `TokenExpired` |

```typescript
// Input DTOs
interface RegisterDto {
  email: string;           // @IsEmail()
  password: string;        // @MinLength(8) @MaxLength(128)
  displayName: string;     // @MinLength(2) @MaxLength(100)
}

interface LoginDto {
  email: string;           // @IsEmail()
  password: string;
}

interface RefreshTokenDto {
  refreshToken: string;    // @IsString() @IsNotEmpty()
}

interface LogoutDto {
  refreshToken: string;
}

interface VerifyEmailDto {
  token: string;
}

interface PasswordResetRequestDto {
  email: string;
}

interface PasswordResetDto {
  token: string;
  newPassword: string;     // @MinLength(8)
}

// Output DTOs
interface AuthTokensDto {
  accessToken: string;     // JWT, short-lived (15 min)
  refreshToken: string;    // JWT, long-lived (7 days)
  expiresIn: number;       // Seconds until access token expiry
  user: UserProfileDto;
}

interface UserProfileDto {
  id: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
}
```

---

## 2. UsersModule Services

### 2.1 UserService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `getProfile` | `userId: string` | `UserProfileDto` | `UserNotFound` |
| `updateProfile` | `UpdateProfileDto` | `UserProfileDto` | `UserNotFound`, `EmailAlreadyTaken` |
| `updatePreferences` | `UpdatePreferencesDto` | `UserPreferenceDto` | `UserNotFound` |
| `deleteAccount` | `userId: string` | `void` | `UserNotFound`, `HasActiveCampaigns` |

```typescript
interface UpdateProfileDto {
  displayName?: string;
  avatarUrl?: string;
}

interface UpdatePreferencesDto {
  locale?: string;         // @Matches(/^[a-z]{2}(-[A-Z]{2})?$/)
  timezone?: string;       // @Matches timezone format
  emailNotifications?: boolean;
  inAppNotifications?: boolean;
  theme?: 'light' | 'dark' | 'system';
}

// Output
interface UserPreferenceDto {
  locale: string;
  timezone: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  theme: string;
}
```

---

## 3. BlogsModule Services

### 3.1 BlogService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `create` | `CreateBlogDto` | `BlogDto` | `BlogUrlAlreadyExists`, `UserNotFound` |
| `update` | `UpdateBlogDto` | `BlogDto` | `BlogNotFound`, `NotOwner` |
| `getById` | `blogId: string` | `BlogDto` | `BlogNotFound` |
| `getBySlug` | `slug: string` | `BlogDto` | `BlogNotFound` |
| `listByUser` | `userId: string` | `BlogDto[]` | — |
| `softDelete` | `blogId: string` | `void` | `BlogNotFound`, `NotOwner` |

```typescript
interface CreateBlogDto {
  name: string;               // @MinLength(2) @MaxLength(255)
  url: string;                // @IsUrl() @MaxLength(2048)
  description?: string;       // @MaxLength(5000)
  language: string;           // @Matches(/^[a-z]{2}$/)
  categoryIds?: string[];
}

interface UpdateBlogDto {
  name?: string;
  description?: string;
  language?: string;
  categoryIds?: string[];
}

interface BlogDto {
  id: string;
  name: string;
  slug: string;
  url: string;
  description: string | null;
  faviconUrl: string | null;
  language: string;
  isVerified: boolean;
  status: string;
  categories: CategorySummaryDto[];
  createdAt: Date;
}
```

### 3.2 VerificationService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `initiate` | `InitiateVerificationDto` | `VerificationDto` | `BlogNotFound`, `NotOwner`, `AlreadyVerified` |
| `checkStatus` | `verificationId: string` | `VerificationDto` | `VerificationNotFound` |
| `retry` | `verificationId: string` | `VerificationDto` | `VerificationNotFound`, `NotExpired` |

```typescript
interface InitiateVerificationDto {
  blogId: string;
  method: VerificationMethod;
}

interface VerificationDto {
  id: string;
  blogId: string;
  method: string;
  token: string;
  status: string;
  expiresAt: Date;
  attemptCount: number;
  lastCheckedAt: Date | null;
}
```

---

## 4. RssModule Services

### 4.1 RssFeedService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `connect` | `ConnectFeedDto` | `RssFeedDto` | `BlogNotFound`, `NotOwner`, `FeedAlreadyConnected`, `InvalidFeedUrl` |
| `disconnect` | `feedId: string` | `void` | `FeedNotFound`, `NotOwner` |
| `forceFetch` | `feedId: string` | `RssFeedLogDto` | `FeedNotFound`, `FetchInProgress` |
| `updateConfig` | `UpdateFeedConfigDto` | `RssFeedDto` | `FeedNotFound`, `NotOwner` |
| `getFeedLogs` | `feedId: string` | `RssFeedLogDto[]` | `FeedNotFound` |

```typescript
interface ConnectFeedDto {
  blogId: string;
  feedUrl: string;           // @IsUrl()
}

interface UpdateFeedConfigDto {
  feedId: string;
  pollingIntervalMinutes?: number;  // @Min(15) @Max(1440)
}

interface RssFeedDto {
  id: string;
  blogId: string;
  feedUrl: string;
  status: string;
  pollingIntervalMinutes: number;
  lastFetchedAt: Date | null;
  nextFetchAt: Date | null;
  consecutiveErrors: number;
}

interface RssFeedLogDto {
  id: string;
  feedId: string;
  status: string;
  articlesFound: number;
  articlesAdded: number;
  articlesDuplicate: number;
  errorMessage: string | null;
  responseTimeMs: number | null;
  createdAt: Date;
}
```

---

## 5. ArticlesModule Services

### 5.1 ArticleService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `getById` | `articleId: string` | `ArticleDto` | `ArticleNotFound` |
| `getByUrl` | `url: string` | `ArticleDto` | `ArticleNotFound` |
| `listByBlog` | `blogId: string` | `ArticleDto[]` | `BlogNotFound` |
| `index` | `IndexArticleDto` | `ArticleDto` | `BlogNotFound`, `DuplicateUrl` |
| `batchIndex` | `IndexArticleDto[]` | `BatchIndexResultDto` | `BlogNotFound` |
| `softDelete` | `articleId: string` | `void` | `ArticleNotFound`, `NotOwner` |

```typescript
interface IndexArticleDto {
  blogId: string;
  title: string;              // @MinLength(1) @MaxLength(500)
  excerpt?: string;
  url: string;                // @IsUrl() @MaxLength(2048)
  language: string;
  author?: string;
  featuredImageUrl?: string;
  publishedAt: string;        // ISO date string
  categoryIds?: string[];
  metadata?: Record<string, unknown>;
}

interface ArticleDto {
  id: string;
  blogId: string;
  blogName: string;
  title: string;
  excerpt: string | null;
  url: string;
  language: string;
  author: string | null;
  featuredImageUrl: string | null;
  publishedAt: Date;
  categories: CategorySummaryDto[];
  createdAt: Date;
}

interface BatchIndexResultDto {
  total: number;
  added: number;
  duplicates: number;
  errors: number;
  errorDetails: Array<{ index: number; error: string }>;
}

interface CategorySummaryDto {
  id: string;
  slug: string;
  name: string;
}
```

---

## 6. SearchModule Services

### 6.1 SearchService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `searchArticles` | `SearchArticlesDto` | `PaginatedResult<ArticleSearchHitDto>` | — |
| `searchBlogs` | `SearchBlogsDto` | `PaginatedResult<BlogSearchHitDto>` | — |
| `autocomplete` | `AutocompleteDto` | `string[]` | — |

```typescript
interface SearchArticlesDto {
  query: string;              // @MinLength(2) @MaxLength(200)
  language?: string;
  categorySlug?: string;
  page?: number;              // @Min(1) @Default(1)
  pageSize?: number;          // @Min(1) @Max(50) @Default(20)
  sortBy?: 'relevance' | 'date' | 'popularity';
}

interface SearchBlogsDto {
  query: string;
  language?: string;
  page?: number;
  pageSize?: number;
}

interface AutocompleteDto {
  query: string;              // @MinLength(1)
  language?: string;
  limit?: number;             // @Max(10)
}

interface ArticleSearchHitDto {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  language: string;
  publishedAt: Date;
  blog: { id: string; name: string; slug: string };
  categories: CategorySummaryDto[];
  score: number;
}

interface BlogSearchHitDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  language: string;
  isVerified: boolean;
  badges: string[];
}
```

---

## 7. WalletModule Services

### 7.1 WalletService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `getBalance` | `userId: string` | `WalletDto` | `WalletNotFound` |
| `getTransactions` | `GetTransactionsDto` | `PaginatedResult<TransactionDto>` | `WalletNotFound` |
| `getStatement` | `GetStatementDto` | `TransactionDto[]` | `WalletNotFound` |

```typescript
interface GetTransactionsDto {
  userId: string;
  page?: number;
  pageSize?: number;
  type?: WalletTransactionType;
}

interface GetStatementDto {
  userId: string;
  startDate: string;
  endDate: string;
}

interface WalletDto {
  id: string;
  userId: string;
  balanceCents: number;
  isFrozen: boolean;
  createdAt: Date;
}

interface TransactionDto {
  id: string;
  type: string;
  amountCents: number;
  balanceAfterCents: number;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: Date;
}
```

**Internal methods** (not exposed via API, called by other modules):
- `credit(userId, amount, reference, description)` → `TransactionDto`
- `debit(userId, amount, reference, description)` → `TransactionDto`
- `hold(userId, amount, reference)` → `TransactionDto`
- `releaseHold(userId, holdTransactionId)` → `TransactionDto`
- `refund(userId, originalTransactionId, amount)` → `TransactionDto`

---

## 8. PaymentsModule Services

### 8.1 PaymentService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `createCheckoutSession` | `CreateCheckoutDto` | `CheckoutSessionDto` | `UserNotFound`, `InvalidAmount` |
| `verifyWebhook` | `rawBody: Buffer, signature: string` | `StripeEventDto` | `InvalidSignature` |
| `getPaymentHistory` | `GetPaymentHistoryDto` | `PaginatedResult<PaymentOrderDto>` | — |

```typescript
interface CreateCheckoutDto {
  userId: string;
  type: PaymentOrderType;
  amountCents: number;         // @Min(50) — minimum $0.50
  currency?: string;           // @Default('USD')
  successUrl: string;          // @IsUrl()
  cancelUrl: string;           // @IsUrl()
  metadata?: Record<string, unknown>;
}

interface CheckoutSessionDto {
  sessionId: string;
  url: string;                 // Stripe Checkout URL
  expiresAt: number;
}

interface GetPaymentHistoryDto {
  userId: string;
  page?: number;
  pageSize?: number;
  type?: PaymentOrderType;
}

interface PaymentOrderDto {
  id: string;
  type: string;
  status: string;
  amountCents: number;
  currency: string;
  paidAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
}

interface StripeEventDto {
  type: string;
  paymentOrderId: string;
  stripeSessionId: string;
  stripePaymentIntentId: string;
}
```

---

## 9. PromotionsModule Services

### 9.1 PromotionService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `createCampaign` | `CreateCampaignDto` | `CampaignDto` | `BlogNotFound`, `PricingNotFound`, `InsufficientBalance`, `OverlappingDates` |
| `getCampaign` | `campaignId: string` | `CampaignDto` | `CampaignNotFound` |
| `listBlogCampaigns` | `blogId: string` | `CampaignDto[]` | — |
| `cancelCampaign` | `cancelCampaignId: string` | `CampaignDto` | `CampaignNotFound`, `CannotCancelCompleted` |

```typescript
interface CreateCampaignDto {
  blogId: string;
  pricingId: string;
  startDate: string;              // ISO date, future only
  endDate: string;                // ISO date, > startDate
}

interface CampaignDto {
  id: string;
  blogId: string;
  pricingId: string;
  status: string;
  startDate: Date;
  endDate: Date;
  totalCostCents: number;
  isFeatured: boolean;
  paymentOrderId: string | null;
  activatedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
}

interface CancelCampaignDto {
  campaignId: string;
  reason?: string;
}
```

### 9.2 PromotionPricingService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `listActive` | — | `PricingDto[]` | — |
| `getById` | `pricingId: string` | `PricingDto` | `PricingNotFound` |

```typescript
interface PricingDto {
  id: string;
  name: string;
  priceCents: number;
  minDays: number;
  maxDays: number | null;
  benefits: Record<string, unknown>;
}
```

---

## 10. BadgesModule Services

### 10.1 BadgeService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `getBlogBadges` | `blogId: string` | `BadgeAssignmentDto[]` | — |
| `assign` | `AssignBadgeDto` | `BadgeAssignmentDto` | `BadgeAlreadyAssigned`, `BlogNotFound`, `BadgeNotFound` |
| `revoke` | `revokeAssignmentId: string` | `void` | `AssignmentNotFound` |
| `checkAndAutoAssign` | `blogId: string` | `BadgeAssignmentDto[]` | — |

```typescript
interface AssignBadgeDto {
  blogId: string;
  badgeDefinitionId: string;
  assignedBy: BadgeAssignmentSource;
}

interface BadgeAssignmentDto {
  id: string;
  blogId: string;
  badgeName: string;
  badgeSlug: string;
  svgUrl: string;
  assignedBy: string;
  assignedAt: Date;
  revokedAt: Date | null;
}
```

---

## 11. NotificationsModule Services

### 11.1 NotificationService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `getUserNotifications` | `GetNotificationsDto` | `PaginatedResult<NotificationDto>` | — |
| `getUnreadCount` | `userId: string` | `{ count: number }` | — |
| `markRead` | `notificationId: string` | `void` | `NotificationNotFound` |
| `markAllRead` | `userId: string` | `number` | — |
| `send` | `SendNotificationDto` | `NotificationDto` | `UserNotFound` |

```typescript
interface GetNotificationsDto {
  userId: string;
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

interface SendNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
  channels?: NotificationChannel[];  // Default: ['in_app']
}

interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
```

---

## 12. SupportModule Services

### 12.1 SupportService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `createTicket` | `CreateTicketDto` | `TicketDto` | `UserNotFound` |
| `getUserTickets` | `userId: string` | `TicketDto[]` | — |
| `getTicketById` | `ticketId: string` | `TicketDto` | `TicketNotFound` |
| `updateStatus` | `UpdateTicketStatusDto` | `TicketDto` | `TicketNotFound` |

```typescript
interface CreateTicketDto {
  userId: string;
  subject: string;             // @MinLength(5) @MaxLength(255)
  message: string;             // @MinLength(20) @MaxLength(10000)
  priority?: SupportTicketPriority;
}

interface UpdateTicketStatusDto {
  ticketId: string;
  status: SupportTicketStatus;
  assignedTo?: string;
}

interface TicketDto {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  closedAt: Date | null;
}
```

---

## 13. AdminModule Services

### 13.1 AdminUserService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `listUsers` | `AdminListDto` | `PaginatedResult<UserProfileDto>` | — |
| `suspendUser` | `userId: string` | `void` | `UserNotFound`, `CannotSuspendAdmins` |
| `restoreUser` | `userId: string` | `void` | `UserNotFound` |
| `deleteUser` | `userId: string` | `void` | `UserNotFound` |

### 13.2 AdminBlogService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `listBlogs` | `AdminListDto` | `PaginatedResult<BlogDto>` | — |
| `verifyBlog` | `blogId: string` | `void` | `BlogNotFound` |
| `suspendBlog` | `blogId: string` | `void` | `BlogNotFound` |
| `restoreBlog` | `blogId: string` | `void` | `BlogNotFound` |

### 13.3 AdminSystemService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `getStats` | — | `PlatformStatsDto` | — |
| `toggleFeatureFlag` | `ToggleFlagDto` | `FeatureFlagDto` | `FlagNotFound` |
| `setConfig` | `SetConfigDto` | `SystemConfigDto` | — |
| `getAuditLogs` | `AuditLogFilterDto` | `PaginatedResult<AuditLogDto>` | — |

```typescript
interface AdminListDto {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
}

interface PlatformStatsDto {
  totalUsers: number;
  totalBlogs: number;
  totalArticles: number;
  verifiedBlogs: number;
  activeCampaigns: number;
  totalRevenueCents: number;
  activeFeeds: number;
  deadFeeds: number;
}

interface ToggleFlagDto {
  key: string;
  isEnabled: boolean;
}

interface FeatureFlagDto {
  id: string;
  key: string;
  isEnabled: boolean;
  description: string | null;
  rules: Record<string, unknown> | null;
}

interface SetConfigDto {
  key: string;
  value: unknown;
  description?: string;
}

interface SystemConfigDto {
  key: string;
  value: unknown;
  description: string | null;
}

interface AuditLogFilterDto {
  actorId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

interface AuditLogDto {
  id: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  changeset: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
}
```

---

## 14. SeoModule Services

### 14.1 SitemapService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `generateSitemap` | language?: string | `string` (XML) | — |
| `generateCategorySitemap` | categorySlug: string, language?: string | `string` (XML) | `CategoryNotFound` |
| `generateMainSitemapIndex` | — | `string` (XML sitemap index) | — |

### 14.2 SeoTagService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `getArticleMeta` | articleId: string | `ArticleMetaDto` | `ArticleNotFound` |
| `getBlogMeta` | blogSlug: string | `BlogMetaDto` | `BlogNotFound` |

```typescript
interface ArticleMetaDto {
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null;
  ogUrl: string;
  canonicalUrl: string;
  hreflangTags: Array<{ lang: string; url: string }>;
  jsonLd: Record<string, unknown>;
}

interface BlogMetaDto {
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null;
  ogUrl: string;
  canonicalUrl: string;
}
```

---

## 15. PwaModule Services

### 15.1 ManifestService

| Operation | Input | Output | Errors |
|---|---|---|---|
| `generateManifest` | — | `Record<string, unknown>` (JSON) | — |

---

*End of Service Contracts.*

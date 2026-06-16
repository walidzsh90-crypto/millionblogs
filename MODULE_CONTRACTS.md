# MillionBlogs — Module Contracts

**Version:** 3.0  
**Pattern:** NestJS Modular Monolith

---

## Module Architecture Rules

1. **Explicit `exports`**: A module only exposes what is listed in its `@Module({ exports: [...] })`.
2. **Strict direction**: Dependencies flow downward. No module imports from a higher-tier module.
3. **Event-driven coupling**: Cross-module reactions use `@nestjs/event-emitter` exclusively.
4. **Interface ownership**: Repository interfaces live in the domain layer of the owning module. Implementation is injected via the module's `providers`.
5. **No circular imports**: Enforced by NestJS module resolution and verified by ESLint `import/no-cycle`.

---

## Module Contracts

### 1. SystemModule

**Tier:** Foundation (0)

| Attribute | Value |
|---|---|
| **Responsibilities** | Health checks, configuration management, feature flags, background job orchestration, system-wide settings |
| **Owned Entities** | FeatureFlag, SystemConfiguration |
| **Public Interfaces** | `SystemConfigService` (get/set config values), `FeatureFlagService` (check if enabled, get all flags), `HealthService` (dependency health checks) |
| **Events Published** | `FeatureFlagToggled` |
| **Events Consumed** | (none) |
| **Dependencies** | NestJS core, `@nestjs/schedule`, `@nestjs/bull` |
| **Forbidden Dependencies** | Any domain module |

---

### 2. ConfigModule

**Tier:** Foundation (0)

| Attribute | Value |
|---|---|
| **Responsibilities** | Centralized environment variable loading, validation, and typed configuration objects |
| **Owned Entities** | (none — pure configuration) |
| **Public Interfaces** | `ConfigService` (typed getters for each config section: database, jwt, stripe, redis, etc.) |
| **Events Published** | (none) |
| **Events Consumed** | (none) |
| **Dependencies** | `@nestjs/config` |
| **Forbidden Dependencies** | Any domain module |

---

### 3. AuthModule

**Tier:** 1

| Attribute | Value |
|---|---|
| **Responsibilities** | Email/password authentication, JWT access+refresh token lifecycle, RBAC guards, password hashing, email verification |
| **Owned Entities** | Session |
| **Public Interfaces** | `AuthService` (login, register, refresh, logout, verifyEmail, resetPassword), `JwtAuthGuard`, `RolesGuard`, `CurrentUser` decorator |
| **Events Published** | `UserRegistered`, `UserLoggedIn`, `UserLoggedOut`, `PasswordResetRequested` |
| **Events Consumed** | (none) |
| **Dependencies** | UsersModule (User entity lookup), ConfigModule (JWT secret, token TTL), SystemModule |
| **Forbidden Dependencies** | BlogsModule, RssModule, ArticlesModule, WalletModule, PaymentsModule, PromotionsModule, BadgesModule, NotificationsModule, SupportModule, AdminModule, SearchModule, SeoModule, PwaModule |

---

### 4. UsersModule

**Tier:** 1

| Attribute | Value |
|---|---|
| **Responsibilities** | User profile management, preferences, account settings, email uniqueness |
| **Owned Entities** | User, UserPreference |
| **Public Interfaces** | `UserService` (findById, findByEmail, updateProfile, updatePreferences, softDelete), `UserQueryService` (read-only lookups for other modules) |
| **Events Published** | `UserProfileUpdated`, `UserDeleted`, `UserPreferencesChanged` |
| **Events Consumed** | `UserRegistered` (create default preferences + wallet) |
| **Dependencies** | ConfigModule, SystemModule |
| **Forbidden Dependencies** | AuthModule, BlogsModule, RssModule, ArticlesModule, WalletModule, PaymentsModule, PromotionsModule, BadgesModule, NotificationsModule, SupportModule, AdminModule, SearchModule, SeoModule, PwaModule |

---

### 5. CategoriesModule

**Tier:** 1

| Attribute | Value |
|---|---|
| **Responsibilities** | Category taxonomy management, hierarchical tree, multilingual labels, category-to-article/blog assignment |
| **Owned Entities** | Category, CategoryTranslation, BlogCategory, ArticleCategory |
| **Public Interfaces** | `CategoryService` (CRUD for categories, translations), `CategoryQueryService` (tree, by language, by slug, for article/blog assignment) |
| **Events Published** | `CategoryCreated`, `CategoryUpdated`, `CategoryDeleted` |
| **Events Consumed** | (none) |
| **Dependencies** | ConfigModule, SystemModule |
| **Forbidden Dependencies** | AuthModule, UsersModule, BlogsModule, RssModule, ArticlesModule, WalletModule, PaymentsModule, PromotionsModule, BadgesModule, NotificationsModule, SupportModule, AdminModule, SearchModule, SeoModule, PwaModule |

---

### 6. BlogsModule

**Tier:** 2

| Attribute | Value |
|---|---|
| **Responsibilities** | Blog registration, metadata management, ownership verification, blog listing |
| **Owned Entities** | Blog, BlogVerification |
| **Public Interfaces** | `BlogService` (create, update, verify, list, softDelete), `BlogQueryService` (findByUser, findBySlug, findVerified, language-filtered queries), `VerificationService` (initiate, check, retry verification) |
| **Events Published** | `BlogCreated`, `BlogUpdated`, `BlogDeleted`, `BlogVerified`, `VerificationInitiated`, `VerificationFailed` |
| **Events Consumed** | `UserDeleted` (handle blog ownership changes) |
| **Dependencies** | UsersModule (user lookup), CategoriesModule (default category assignment), ConfigModule, SystemModule |
| **Forbidden Dependencies** | AuthModule, RssModule, ArticlesModule, WalletModule, PaymentsModule, PromotionsModule, BadgesModule, NotificationsModule, SupportModule, AdminModule, SearchModule, SeoModule, PwaModule |

---

### 7. RssModule

**Tier:** 3

| Attribute | Value |
|---|---|
| **Responsibilities** | RSS/Atom feed ingestion, feed health monitoring, scheduling, deduplication |
| **Owned Entities** | RssFeed, RssFeedLog |
| **Public Interfaces** | `RssFeedService` (connect, disconnect, forceFetch, updateConfig), `RssFeedQueryService` (findDueForFetch, feedHealth), `RssFeedLogService` (query logs) |
| **Events Published** | `FeedConnected`, `FeedDisconnected`, `FeedFetchSucceeded`, `FeedFetchFailed`, `FeedPaused`, `FeedMarkedDead` |
| **Events Consumed** | `BlogCreated` (auto-setup RSS if blog provides feed URL), `BlogDeleted` (disconnect feed) |
| **Dependencies** | BlogsModule (blog lookup), ArticlesModule (save parsed articles), SystemModule (job scheduling), ConfigModule |
| **Forbidden Dependencies** | AuthModule, UsersModule, WalletModule, PaymentsModule, PromotionsModule, BadgesModule, NotificationsModule, SupportModule, AdminModule, SearchModule, SeoModule, PwaModule |

---

### 8. ArticlesModule

**Tier:** 3

| Attribute | Value |
|---|---|
| **Responsibilities** | Article indexing, metadata extraction, language detection, category suggestion, URL deduplication |
| **Owned Entities** | Article |
| **Public Interfaces** | `ArticleService` (index, update, softDelete, batchIndex), `ArticleQueryService` (findByBlog, findById, findByUrl, listByLanguage, listByCategory) |
| **Events Published** | `ArticleIndexed`, `ArticleUpdated`, `ArticleDeleted`, `ArticlesBatchIndexed` |
| **Events Consumed** | `BlogDeleted` (soft-delete all blog articles), `FeedFetchSucceeded` (process new articles) |
| **Dependencies** | BlogsModule (blog lookup), CategoriesModule (category assignment), ConfigModule, SystemModule |
| **Forbidden Dependencies** | AuthModule, UsersModule, RssModule, WalletModule, PaymentsModule, PromotionsModule, BadgesModule, NotificationsModule, SupportModule, AdminModule, SearchModule, SeoModule, PwaModule |

---

### 9. SearchModule

**Tier:** 4

| Attribute | Value |
|---|---|
| **Responsibilities** | Full-text search across articles and blogs, multilingual search, filtering, ranking, promotion boost |
| **Owned Entities** | (none — query-only module, reads from Articles + Blogs via repository interfaces) |
| **Public Interfaces** | `SearchService` (search articles, search blogs, autocomplete, global search), `SearchQueryBuilder` (construct filtered queries) |
| **Events Published** | (none) |
| **Events Consumed** | `ArticleIndexed` (refresh search index), `ArticleDeleted` (remove from index), `PromotionCampaignActivated` (boost ranking) |
| **Dependencies** | ArticlesModule (read-only via ArticleQueryService), BlogsModule (read-only via BlogQueryService), CategoriesModule, ConfigModule, SystemModule |
| **Forbidden Dependencies** | AuthModule, UsersModule, RssModule, WalletModule, PaymentsModule, PromotionsModule (events only), BadgesModule, NotificationsModule, SupportModule, AdminModule, SeoModule, PwaModule |

---

### 10. WalletModule

**Tier:** 3

| Attribute | Value |
|---|---|
| **Responsibilities** | Credit balance management, transaction ledger, holds, concurrent deduction safety |
| **Owned Entities** | Wallet, WalletTransaction |
| **Public Interfaces** | `WalletService` (getBalance, credit, debit, hold, releaseHold, refund, getTransactionHistory), `WalletQueryService` (balance, transactions, statements) |
| **Events Published** | `WalletCredited`, `WalletDebited`, `WalletFrozen`, `WalletUnfrozen`, `InsufficientFunds` |
| **Events Consumed** | `UserRegistered` (create wallet), `PaymentCompleted` (credit wallet), `CampaignPaymentRequired` (debit wallet for promotion) |
| **Dependencies** | UsersModule (user lookup), PaymentsModule (reference payment orders), ConfigModule, SystemModule |
| **Forbidden Dependencies** | AuthModule, BlogsModule, RssModule, ArticlesModule, PromotionsModule (events only), BadgesModule, NotificationsModule (events only), SupportModule, AdminModule, SearchModule, SeoModule, PwaModule |

---

### 11. PaymentsModule

**Tier:** 4

| Attribute | Value |
|---|---|
| **Responsibilities** | Stripe integration, checkout sessions, webhook handling, payment reconciliation |
| **Owned Entities** | PaymentOrder |
| **Public Interfaces** | `PaymentService` (createCheckoutSession, verifyWebhook, processRefund, getPaymentHistory), `StripeWebhookService` (handle events) |
| **Events Published** | `PaymentInitiated`, `PaymentCompleted`, `PaymentFailed`, `PaymentRefunded` |
| **Events Consumed** | `PromotionPurchaseRequested` (create payment for promotion) |
| **Dependencies** | WalletModule (credit on completion), UsersModule (user lookup), ConfigModule (Stripe keys), SystemModule |
| **Forbidden Dependencies** | AuthModule, BlogsModule, RssModule, ArticlesModule, PromotionsModule (events only), BadgesModule, NotificationsModule (events only), SupportModule, AdminModule, SearchModule, SeoModule, PwaModule |

---

### 12. PromotionsModule

**Tier:** 4

| Attribute | Value |
|---|---|
| **Responsibilities** | Campaign management, scheduling, pricing, promotion boost activation |
| **Owned Entities** | PromotionPricing, PromotionCampaign |
| **Public Interfaces** | `PromotionService` (createCampaign, activate, cancel, getActiveCampaigns), `PromotionPricingService` (list pricing tiers), `PromotionQueryService` (find active promotions for blog, by date range) |
| **Events Published** | `PromotionCampaignCreated`, `PromotionCampaignActivated`, `PromotionCampaignCompleted`, `PromotionCampaignCancelled`, `PromotionPaymentRequired` |
| **Events Consumed** | `PaymentCompleted` (activate campaign after payment), `BlogDeleted` (cancel active campaigns) |
| **Dependencies** | BlogsModule (blog lookup), WalletModule (debit cost), ConfigModule, SystemModule |
| **Forbidden Dependencies** | AuthModule, UsersModule, RssModule, ArticlesModule, PaymentsModule (events only), BadgesModule, NotificationsModule (events only), SupportModule, AdminModule, SearchModule, SeoModule, PwaModule |

---

### 13. BadgesModule

**Tier:** 3

| Attribute | Value |
|---|---|
| **Responsibilities** | Badge definition management, SVG badge generation, condition-based assignment, revocation |
| **Owned Entities** | BadgeDefinition, BadgeAssignment |
| **Public Interfaces** | `BadgeService` (assign, revoke, checkAndAutoAssign, getBlogBadges), `BadgeDefinitionService` (list, create, update definitions), `BadgeRenderService` (generate SVG) |
| **Events Published** | `BadgeAssigned`, `BadgeRevoked` |
| **Events Consumed** | `BlogVerified` (auto-assign verified badge), `PromotionCampaignActivated` (auto-assign promoter badge), `BlogCreated` (assign early adopter badge if applicable) |
| **Dependencies** | BlogsModule (blog lookup), ConfigModule, SystemModule |
| **Forbidden Dependencies** | AuthModule, UsersModule, RssModule, ArticlesModule, WalletModule, PaymentsModule, PromotionsModule (events only), NotificationsModule (events only), SupportModule, AdminModule, SearchModule, SeoModule, PwaModule |

---

### 14. NotificationsModule

**Tier:** 4

| Attribute | Value |
|---|---|
| **Responsibilities** | In-app notification inbox, email delivery, notification templates, delivery tracking |
| **Owned Entities** | Notification, NotificationDelivery |
| **Public Interfaces** | `NotificationService` (send, markRead, markAllRead, getUserNotifications, getUnreadCount), `NotificationDeliveryService` (queue, deliver, retry failed) |
| **Events Published** | (none — notifications are the terminal consumer) |
| **Events Consumed** | `UserRegistered`, `BlogVerified`, `BadgeAssigned`, `PaymentCompleted`, `WalletCredited`, `WalletDebited`, `PromotionCampaignActivated`, `PromotionCampaignCompleted`, `SupportTicketReply` |
| **Dependencies** | UsersModule (user lookup), ConfigModule, SystemModule |
| **Forbidden Dependencies** | AuthModule, BlogsModule, RssModule, ArticlesModule, WalletModule, PaymentsModule, PromotionsModule, BadgesModule, SupportModule (events only), AdminModule, SearchModule, SeoModule, PwaModule |

---

### 15. SupportModule

**Tier:** 4

| Attribute | Value |
|---|---|
| **Responsibilities** | Support ticket creation, triage, status management, admin assignment |
| **Owned Entities** | SupportTicket |
| **Public Interfaces** | `SupportService` (createTicket, updateStatus, assignToAdmin, getUserTickets, getTicketById) |
| **Events Published** | `SupportTicketOpened`, `SupportTicketUpdated`, `SupportTicketResolved`, `SupportTicketClosed` |
| **Events Consumed** | (none) |
| **Dependencies** | UsersModule (user + admin lookup), ConfigModule, SystemModule |
| **Forbidden Dependencies** | AuthModule, BlogsModule, RssModule, ArticlesModule, WalletModule, PaymentsModule, PromotionsModule, BadgesModule, NotificationsModule, AdminModule, SearchModule, SeoModule, PwaModule |

---

### 16. AdminModule

**Tier:** 5

| Attribute | Value |
|---|---|
| **Responsibilities** | Admin panel API surface, user management, blog moderation, system config, analytics queries |
| **Owned Entities** | (none — operates on all modules' entities via their public interfaces) |
| **Public Interfaces** | `AdminUserService` (list, suspend, delete), `AdminBlogService` (list, verify, suspend), `AdminAnalyticsService` (platform stats), `AdminSystemService` (feature flags, config, maintenance mode) |
| **Events Published** | `AdminActionPerformed` |
| **Events Consumed** | (none — admin initiates actions) |
| **Dependencies** | All modules (UsersModule, BlogsModule, ArticlesModule, WalletModule, PaymentsModule, PromotionsModule, BadgesModule, NotificationsModule, SupportModule, SystemModule, ConfigModule, CategoriesModule) |
| **Forbidden Dependencies** | **May not be imported by any other module.** (One-way dependency: Admin → all). |

---

### 17. SeoModule

**Tier:** 4

| Attribute | Value |
|---|---|
| **Responsibilities** | Dynamic XML sitemap generation, hreflang annotations, robots.txt, structured data |
| **Owned Entities** | (none — generates data on-the-fly) |
| **Public Interfaces** | `SitemapService` (generate sitemap per language/category), `SeoTagService` (generate meta tags for articles/blogs) |
| **Events Published** | (none) |
| **Events Consumed** | `ArticleIndexed`, `ArticleDeleted`, `BlogCreated`, `BlogDeleted` (invalidate sitemap cache) |
| **Dependencies** | ArticlesModule (read-only), BlogsModule (read-only), CategoriesModule (read-only), ConfigModule, SystemModule |
| **Forbidden Dependencies** | AuthModule, UsersModule, RssModule, WalletModule, PaymentsModule, PromotionsModule, BadgesModule, NotificationsModule, SupportModule, AdminModule, SearchModule, PwaModule |

---

### 18. PwaModule

**Tier:** 4

| Attribute | Value |
|---|---|
| **Responsibilities** | PWA manifest generation, service worker configuration hints |
| **Owned Entities** | (none) |
| **Public Interfaces** | `ManifestService` (generate manifest.json), `SwService` (provide SW configuration) |
| **Events Published** | (none) |
| **Events Consumed** | (none) |
| **Dependencies** | ConfigModule, SystemModule |
| **Forbidden Dependencies** | All business modules |

---

*End of Module Contracts.*

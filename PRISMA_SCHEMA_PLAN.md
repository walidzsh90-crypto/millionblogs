# MillionBlogs — Prisma Schema Plan

**Version:** 3.0  
**Target:** Prisma 5+ | PostgreSQL 15+

---

## 1. Generator & Datasource

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["clientExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgcrypto, uuid_ossp]
}
```

**Note:** `pgcrypto` and `uuid_ossp` are optional if using `gen_random_uuid()` (built into PostgreSQL 13+).

---

## 2. Enums

```prisma
// ─── Users & Auth ──────────────────────────────────────

enum UserRole {
  user
  admin
  superadmin
}

// ─── Blogs ─────────────────────────────────────────────

enum BlogStatus {
  active
  inactive
  suspended
}

enum VerificationMethod {
  dns_txt
  meta_tag
  file_upload
}

enum VerificationStatus {
  pending
  verified
  failed
}

// ─── RSS ───────────────────────────────────────────────

enum RssFeedStatus {
  active
  paused
  dead
  error
}

enum RssFeedLogStatus {
  success
  partial
  error
}

// ─── Wallet & Payments ─────────────────────────────────

enum WalletTransactionType {
  credit
  debit
  hold
  hold_release
  refund
  bonus
}

enum PaymentOrderType {
  wallet_topup
  promotion_purchase
  founder_plan
}

enum PaymentOrderStatus {
  pending
  processing
  completed
  failed
  refunded
}

// ─── Promotions ────────────────────────────────────────

enum CampaignStatus {
  pending_payment
  scheduled
  active
  completed
  cancelled
}

// ─── Founder Plans ─────────────────────────────────────

enum FounderPlanAssignmentStatus {
  active
  expired
  revoked
}

// ─── Badges ────────────────────────────────────────────

enum BadgeAssignmentSource {
  system
  admin
}

// ─── Notifications ─────────────────────────────────────

enum NotificationType {
  welcome
  blog_verified
  badge_awarded
  payment_received
  wallet_credited
  promotion_activated
  promotion_ended
  support_reply
}

enum NotificationChannel {
  in_app
  email
}

enum DeliveryStatus {
  pending
  delivered
  failed
  skipped
}

// ─── Support ───────────────────────────────────────────

enum SupportTicketStatus {
  open
  in_progress
  resolved
  closed
}

enum SupportTicketPriority {
  low
  normal
  high
  urgent
}
```

---

## 3. Models

### 3.1 User

```prisma
model User {
  id              String      @id @default(uuid()) @db.Uuid
  email           String      @unique @db.VarChar(255)
  passwordHash    String      @map("password_hash") @db.VarChar(255)
  displayName     String      @map("display_name") @db.VarChar(100)
  avatarUrl       String?     @map("avatar_url") @db.VarChar(2048)
  role            UserRole    @default(user)
  emailVerifiedAt DateTime?   @map("email_verified_at") @db.Timestamptz
  lastLoginAt     DateTime?   @map("last_login_at") @db.Timestamptz
  createdAt       DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime    @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt       DateTime?   @map("deleted_at") @db.Timestamptz

  // Relations
  preference          UserPreference?
  sessions            Session[]
  blogs               Blog[]
  wallet              Wallet?
  notifications       Notification[]
  supportTickets      SupportTicket[]
  auditLogs           AuditLog[]
  founderAssignments  FounderPlanAssignment[]
  paymentOrders       PaymentOrder[]

  @@index([role])
  @@index([deletedAt])
  @@map("users")
}
```

### 3.2 UserPreference

```prisma
model UserPreference {
  id                   String  @id @default(uuid()) @db.Uuid
  userId               String  @unique @map("user_id") @db.Uuid
  locale               String  @default("en") @db.VarChar(10)
  timezone             String  @default("UTC") @db.VarChar(50)
  emailNotifications   Boolean @default(true) @map("email_notifications")
  inAppNotifications   Boolean @default(true) @map("in_app_notifications")
  theme                String  @default("system") @db.VarChar(20)
  createdAt            DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt            DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt            DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}
```

### 3.3 Session

```prisma
model Session {
  id                String    @id @default(uuid()) @db.Uuid
  userId            String    @map("user_id") @db.Uuid
  refreshTokenHash  String    @unique @map("refresh_token_hash") @db.VarChar(255)
  deviceInfo        String?   @map("device_info") @db.Text
  ipAddress         String?   @map("ip_address") @db.VarChar(45)
  expiresAt         DateTime  @map("expires_at") @db.Timestamptz
  revokedAt         DateTime? @map("revoked_at") @db.Timestamptz
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt         DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([ipAddress])
  @@index([expiresAt])
  @@index([revokedAt])
  @@map("sessions")
}
```

### 3.4 Blog

```prisma
model Blog {
  id          String     @id @default(uuid()) @db.Uuid
  userId      String     @map("user_id") @db.Uuid
  name        String     @db.VarChar(255)
  slug        String     @unique @db.VarChar(255)
  description String?    @db.Text
  url         String     @unique @db.VarChar(2048)
  faviconUrl  String?    @map("favicon_url") @db.VarChar(2048)
  language    String     @db.VarChar(10)
  isVerified  Boolean    @default(false) @map("is_verified")
  verifiedAt  DateTime?  @map("verified_at") @db.Timestamptz
  status      BlogStatus @default(active)
  createdAt   DateTime   @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime   @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt   DateTime?  @map("deleted_at") @db.Timestamptz

  // Relations
  user                User                  @relation(fields: [userId], references: [id], onDelete: Restrict)
  rssFeed             RssFeed?
  verifications       BlogVerification[]
  articles            Article[]
  categories          BlogCategory[]
  promotionCampaigns  PromotionCampaign[]
  badgeAssignments    BadgeAssignment[]
  founderAssignments  FounderPlanAssignment[]

  @@index([userId])
  @@index([language])
  @@index([status])
  @@index([isVerified])
  @@index([deletedAt])
  @@map("blogs")
}
```

### 3.5 BlogVerification

```prisma
model BlogVerification {
  id              String              @id @default(uuid()) @db.Uuid
  blogId          String              @map("blog_id") @db.Uuid
  method          VerificationMethod
  token           String              @db.VarChar(255)
  status          VerificationStatus  @default(pending)
  verifiedAt      DateTime?           @map("verified_at") @db.Timestamptz
  expiresAt       DateTime            @map("expires_at") @db.Timestamptz
  attemptCount    Int                 @default(0) @map("attempt_count")
  lastCheckedAt   DateTime?           @map("last_checked_at") @db.Timestamptz
  errorMessage    String?             @map("error_message") @db.Text
  createdAt       DateTime            @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime            @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt       DateTime?           @map("deleted_at") @db.Timestamptz

  // Relations
  blog Blog @relation(fields: [blogId], references: [id], onDelete: Cascade)

  @@index([blogId])
  @@index([token])
  @@index([status])
  @@map("blog_verifications")
}
```

### 3.6 BlogCategory

```prisma
model BlogCategory {
  id         String   @id @default(uuid()) @db.Uuid
  blogId     String   @map("blog_id") @db.Uuid
  categoryId String   @map("category_id") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt  DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  blog     Blog     @relation(fields: [blogId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  @@unique([blogId, categoryId])
  @@index([blogId])
  @@index([categoryId])
  @@map("blog_categories")
}
```

### 3.7 RssFeed

```prisma
model RssFeed {
  id                     String       @id @default(uuid()) @db.Uuid
  blogId                 String       @unique @map("blog_id") @db.Uuid
  feedUrl                String       @map("feed_url") @db.VarChar(2048)
  status                 RssFeedStatus @default(active)
  pollingIntervalMinutes Int          @default(60) @map("polling_interval_minutes")
  lastFetchedAt          DateTime?    @map("last_fetched_at") @db.Timestamptz
  nextFetchAt            DateTime?    @map("next_fetch_at") @db.Timestamptz
  consecutiveErrors      Int          @default(0) @map("consecutive_errors")
  errorCount             Int          @default(0) @map("error_count")
  lastErrorMessage       String?      @map("last_error_message") @db.Text
  createdAt              DateTime     @default(now()) @map("created_at") @db.Timestamptz
  updatedAt              DateTime     @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt              DateTime?    @map("deleted_at") @db.Timestamptz

  // Relations
  blog        Blog          @relation(fields: [blogId], references: [id], onDelete: Cascade)
  fetchLogs   RssFeedLog[]

  @@index([status])
  @@index([nextFetchAt])
  @@map("rss_feeds")
}
```

### 3.8 RssFeedLog

```prisma
model RssFeedLog {
  id              String          @id @default(uuid()) @db.Uuid
  feedId          String          @map("feed_id") @db.Uuid
  status          RssFeedLogStatus
  articlesFound   Int             @default(0) @map("articles_found")
  articlesAdded   Int             @default(0) @map("articles_added")
  articlesDuplicate Int           @default(0) @map("articles_duplicate")
  errorMessage    String?         @map("error_message") @db.Text
  responseStatus  Int?            @map("response_status")
  responseTimeMs  Int?            @map("response_time_ms")
  createdAt       DateTime        @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  feed RssFeed @relation(fields: [feedId], references: [id], onDelete: Cascade)

  @@index([feedId])
  @@index([createdAt])
  @@map("rss_feed_logs")
}
```

**Immutability Note:** This model intentionally omits `updatedAt` and `deletedAt`. Rows are append-only. Enforce immutability at the application layer.

### 3.9 Article

```prisma
model Article {
  id                String    @id @default(uuid()) @db.Uuid
  blogId            String    @map("blog_id") @db.Uuid
  title             String    @db.VarChar(500)
  excerpt           String?   @db.Text
  url               String    @unique @db.VarChar(2048)
  urlHash           String    @unique @map("url_hash") @db.VarChar(64)
  language          String    @db.VarChar(10)
  author            String?   @db.VarChar(255)
  featuredImageUrl  String?   @map("featured_image_url") @db.VarChar(2048)
  publishedAt       DateTime  @map("published_at") @db.Timestamptz
  isIndexed         Boolean   @default(true) @map("is_indexed")
  metadata          Json?     @db.JsonB
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt         DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  blog       Blog              @relation(fields: [blogId], references: [id], onDelete: Restrict)
  categories ArticleCategory[]

  @@index([blogId])
  @@index([language])
  @@index([publishedAt])
  @@index([createdAt])
  @@index([isIndexed])
  @@index([deletedAt])
  @@map("articles")
}
```

**tsvector Note:** The `search_vector` column must be added via a raw SQL migration after Prisma generates the initial schema. Include a GIN index and a trigger to populate it from `title` and `excerpt`. This column cannot be defined in Prisma schema.

```sql
-- Raw SQL migration (run separately)
ALTER TABLE articles ADD COLUMN search_vector tsvector;
CREATE INDEX idx_articles_search_vector ON articles USING GIN (search_vector)
  WHERE deleted_at IS NULL AND is_indexed = TRUE;
```

### 3.10 ArticleCategory

```prisma
model ArticleCategory {
  id         String   @id @default(uuid()) @db.Uuid
  articleId  String   @map("article_id") @db.Uuid
  categoryId String   @map("category_id") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt  DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  article  Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  @@unique([articleId, categoryId])
  @@index([articleId])
  @@index([categoryId])
  @@map("article_categories")
}
```

### 3.11 Category

```prisma
model Category {
  id        String   @id @default(uuid()) @db.Uuid
  slug      String   @unique @db.VarChar(255)
  icon      String?  @db.VarChar(50)
  parentId  String?  @map("parent_id") @db.Uuid
  sortOrder Int      @default(0) @map("sort_order")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  parent         Category?            @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children       Category[]           @relation("CategoryHierarchy")
  translations   CategoryTranslation[]
  blogLinks      BlogCategory[]
  articleLinks   ArticleCategory[]

  @@index([parentId])
  @@index([isActive])
  @@index([deletedAt])
  @@map("categories")
}
```

### 3.12 CategoryTranslation

```prisma
model CategoryTranslation {
  id          String   @id @default(uuid()) @db.Uuid
  categoryId  String   @map("category_id") @db.Uuid
  language    String   @db.VarChar(10)
  name        String   @db.VarChar(255)
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([categoryId, language])
  @@index([categoryId])
  @@map("category_translations")
}
```

### 3.13 PromotionPricing

```prisma
model PromotionPricing {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @db.VarChar(100)
  priceCents  Int      @map("price_cents")
  minDays     Int      @map("min_days")
  maxDays     Int?     @map("max_days")
  benefits    Json     @db.JsonB
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  campaigns PromotionCampaign[]

  @@index([isActive])
  @@map("promotion_pricings")
}
```

### 3.14 PromotionCampaign

```prisma
model PromotionCampaign {
  id                String         @id @default(uuid()) @db.Uuid
  blogId            String         @map("blog_id") @db.Uuid
  pricingId         String         @map("pricing_id") @db.Uuid
  status            CampaignStatus @default(pending_payment)
  startDate         DateTime       @map("start_date") @db.Timestamptz
  endDate           DateTime       @map("end_date") @db.Timestamptz
  totalCostCents    Int            @map("total_cost_cents")
  dailyBudgetCents  Int?           @map("daily_budget_cents")
  isFeatured        Boolean        @default(false) @map("is_featured")
  paymentOrderId    String?        @unique @map("payment_order_id") @db.Uuid
  activatedAt       DateTime?      @map("activated_at") @db.Timestamptz
  completedAt       DateTime?      @map("completed_at") @db.Timestamptz
  cancelledAt       DateTime?      @map("cancelled_at") @db.Timestamptz
  cancellationReason String?       @map("cancellation_reason") @db.Text
  createdAt         DateTime       @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime       @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt         DateTime?      @map("deleted_at") @db.Timestamptz

  // Relations
  blog    Blog             @relation(fields: [blogId], references: [id], onDelete: Restrict)
  pricing PromotionPricing @relation(fields: [pricingId], references: [id])
  payment PaymentOrder?    @relation(fields: [paymentOrderId], references: [id])

  @@index([blogId])
  @@index([status, startDate, endDate])
  @@index([isFeatured])
  @@map("promotion_campaigns")
}
```

### 3.15 Wallet

```prisma
model Wallet {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @unique @map("user_id") @db.Uuid
  balanceCents Int     @default(0) @map("balance_cents")
  version     Int      @default(1)
  isFrozen    Boolean  @default(false) @map("is_frozen")
  frozenAt    DateTime? @map("frozen_at") @db.Timestamptz
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  user         User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions WalletTransaction[]
  paymentOrders PaymentOrder[]

  @@map("wallets")
}
```

### 3.16 WalletTransaction

```prisma
model WalletTransaction {
  id               String               @id @default(uuid()) @db.Uuid
  walletId         String               @map("wallet_id") @db.Uuid
  type             WalletTransactionType
  amountCents      Int                  @map("amount_cents")
  balanceAfterCents Int                 @map("balance_after_cents")
  referenceType    String?              @map("reference_type") @db.VarChar(30)
  referenceId      String?              @map("reference_id") @db.Uuid
  description      String?              @db.VarChar(500)
  metadata         Json?                @db.JsonB
  createdAt        DateTime             @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  wallet Wallet @relation(fields: [walletId], references: [id], onDelete: Restrict)

  @@index([walletId])
  @@index([createdAt])
  @@index([referenceType, referenceId])
  @@map("wallet_transactions")
}
```

**Immutability:** No `updatedAt` or `deletedAt`. Append-only. Enforce via database trigger:
```sql
CREATE OR REPLACE FUNCTION prevent_wallet_transaction_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'wallet_transactions is append-only: mutations are forbidden';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallet_transactions_immutable
  BEFORE UPDATE OR DELETE ON wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION prevent_wallet_transaction_mutation();
```

### 3.17 PaymentOrder

```prisma
model PaymentOrder {
  id                    String             @id @default(uuid()) @db.Uuid
  userId                String             @map("user_id") @db.Uuid
  walletId              String?            @map("wallet_id") @db.Uuid
  type                  PaymentOrderType
  status                PaymentOrderStatus @default(pending)
  amountCents           Int                @map("amount_cents")
  currency              String             @default("USD") @db.VarChar(3)
  stripeSessionId       String?            @unique @map("stripe_session_id") @db.VarChar(255)
  stripePaymentIntentId String?            @map("stripe_payment_intent_id") @db.VarChar(255)
  metadata              Json?              @db.JsonB
  paidAt                DateTime?          @map("paid_at") @db.Timestamptz
  refundedAt            DateTime?          @map("refunded_at") @db.Timestamptz
  refundAmountCents     Int?               @map("refund_amount_cents")
  errorMessage          String?            @map("error_message") @db.Text
  createdAt             DateTime           @default(now()) @map("created_at") @db.Timestamptz
  updatedAt             DateTime           @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt             DateTime?          @map("deleted_at") @db.Timestamptz

  // Relations
  user      User               @relation(fields: [userId], references: [id], onDelete: Restrict)
  wallet    Wallet?            @relation(fields: [walletId], references: [id], onDelete: SetNull)
  campaign  PromotionCampaign?

  @@index([userId])
  @@index([walletId])
  @@index([status])
  @@index([type])
  @@index([createdAt])
  @@map("payment_orders")
}
```

### 3.18 FounderPlan

```prisma
model FounderPlan {
  id            String    @id @default(uuid()) @db.Uuid
  name          String    @db.VarChar(100)
  description   String?   @db.Text
  priceCents    Int       @map("price_cents")
  benefits      Json      @db.JsonB
  maxSeats      Int?      @map("max_seats")
  seatsTaken    Int       @default(0) @map("seats_taken")
  signupEndDate DateTime? @map("signup_end_date") @db.Timestamptz
  isActive      Boolean   @default(true) @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt     DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  assignments FounderPlanAssignment[]

  @@index([isActive])
  @@map("founder_plans")
}
```

### 3.19 FounderPlanAssignment

```prisma
model FounderPlanAssignment {
  id              String                        @id @default(uuid()) @db.Uuid
  planId          String                        @map("plan_id") @db.Uuid
  userId          String                        @map("user_id") @db.Uuid
  blogId          String                        @map("blog_id") @db.Uuid
  paymentOrderId  String?                       @map("payment_order_id") @db.Uuid
  status          FounderPlanAssignmentStatus   @default(active)
  assignedAt      DateTime                      @default(now()) @map("assigned_at") @db.Timestamptz
  expiresAt       DateTime?                     @map("expires_at") @db.Timestamptz
  revokedAt       DateTime?                     @map("revoked_at") @db.Timestamptz
  revocationReason String?                      @map("revocation_reason") @db.Text
  createdAt       DateTime                      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime                      @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt       DateTime?                     @map("deleted_at") @db.Timestamptz

  // Relations
  plan  FounderPlan @relation(fields: [planId], references: [id])
  user  User        @relation(fields: [userId], references: [id])
  blog  Blog        @relation(fields: [blogId], references: [id])
  payment PaymentOrder? @relation(fields: [paymentOrderId], references: [id])

  @@index([planId])
  @@index([userId])
  @@index([blogId])
  @@index([status])
  @@map("founder_plan_assignments")
}
```

### 3.20 BadgeDefinition

```prisma
model BadgeDefinition {
  id              String   @id @default(uuid()) @db.Uuid
  name            String   @db.VarChar(100)
  slug            String   @unique @db.VarChar(100)
  description     String?  @db.Text
  svgTemplate     String   @map("svg_template") @db.Text
  criteria        Json     @db.JsonB
  isAutoAssignable Boolean @default(false) @map("is_auto_assignable")
  maxPerBlog      Int?     @map("max_per_blog")
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt       DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  assignments BadgeAssignment[]

  @@index([isActive])
  @@index([isAutoAssignable])
  @@map("badge_definitions")
}
```

### 3.21 BadgeAssignment

```prisma
model BadgeAssignment {
  id                String               @id @default(uuid()) @db.Uuid
  blogId            String               @map("blog_id") @db.Uuid
  badgeDefinitionId String               @map("badge_definition_id") @db.Uuid
  svgUrl            String               @map("svg_url") @db.VarChar(2048)
  assignedBy        BadgeAssignmentSource
  assignedAt        DateTime             @default(now()) @map("assigned_at") @db.Timestamptz
  revokedAt         DateTime?            @map("revoked_at") @db.Timestamptz
  createdAt         DateTime             @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime             @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt         DateTime?            @map("deleted_at") @db.Timestamptz

  // Relations
  blog          Blog            @relation(fields: [blogId], references: [id], onDelete: Cascade)
  badgeDefinition BadgeDefinition @relation(fields: [badgeDefinitionId], references: [id])

  @@unique([blogId, badgeDefinitionId])
  @@index([blogId])
  @@index([badgeDefinitionId])
  @@map("badge_assignments")
}
```

### 3.22 Notification

```prisma
model Notification {
  id        String           @id @default(uuid()) @db.Uuid
  userId    String           @map("user_id") @db.Uuid
  type      NotificationType
  title     String           @db.VarChar(255)
  body      String?          @db.Text
  metadata  Json?            @db.JsonB
  isRead    Boolean          @default(false) @map("is_read")
  readAt    DateTime?        @map("read_at") @db.Timestamptz
  createdAt DateTime         @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime         @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime?        @map("deleted_at") @db.Timestamptz

  // Relations
  user     User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  deliveries NotificationDelivery[]

  @@index([userId, isRead, createdAt])
  @@map("notifications")
}
```

### 3.23 NotificationDelivery

```prisma
model NotificationDelivery {
  id             String          @id @default(uuid()) @db.Uuid
  notificationId String          @map("notification_id") @db.Uuid
  channel        NotificationChannel
  status         DeliveryStatus  @default(pending)
  errorMessage   String?         @map("error_message") @db.Text
  queuedAt       DateTime?       @map("queued_at") @db.Timestamptz
  sentAt         DateTime?       @map("sent_at") @db.Timestamptz
  deliveredAt    DateTime?       @map("delivered_at") @db.Timestamptz
  createdAt      DateTime        @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime        @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt      DateTime?       @map("deleted_at") @db.Timestamptz

  // Relations
  notification Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)

  @@index([notificationId])
  @@index([status])
  @@map("notification_deliveries")
}
```

### 3.24 SupportTicket

```prisma
model SupportTicket {
  id            String               @id @default(uuid()) @db.Uuid
  userId        String               @map("user_id") @db.Uuid
  subject       String               @db.VarChar(255)
  message       String               @db.Text
  status        SupportTicketStatus   @default(open)
  priority      SupportTicketPriority @default(normal)
  assignedTo    String?              @map("assigned_to") @db.Uuid
  resolvedAt    DateTime?            @map("resolved_at") @db.Timestamptz
  closedAt      DateTime?            @map("closed_at") @db.Timestamptz
  createdAt     DateTime             @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime             @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt     DateTime?            @map("deleted_at") @db.Timestamptz

  // Relations
  user      User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  assignedAdmin User? @relation("TicketAssignment", fields: [assignedTo], references: [id])

  @@index([userId])
  @@index([status])
  @@index([priority])
  @@index([assignedTo])
  @@index([createdAt])
  @@map("support_tickets")
}
```

### 3.25 AuditLog

```prisma
model AuditLog {
  id           String   @id @default(uuid()) @db.Uuid
  actorId      String?  @map("actor_id") @db.Uuid
  action       String   @db.VarChar(50)
  resourceType String   @map("resource_type") @db.VarChar(50)
  resourceId   String   @map("resource_id") @db.Uuid
  changeset    Json?    @db.JsonB
  ipAddress    String?  @map("ip_address") @db.VarChar(45)
  userAgent    String?  @map("user_agent") @db.Text
  metadata     Json?    @db.JsonB
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  actor User? @relation(fields: [actorId], references: [id], onDelete: SetNull)

  @@index([actorId])
  @@index([action])
  @@index([resourceType, resourceId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

**Immutability:** No `updatedAt` or `deletedAt`. Append-only. Enforce via database trigger (same pattern as WalletTransaction).

### 3.26 FeatureFlag

```prisma
model FeatureFlag {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique @db.VarChar(100)
  description String?  @db.Text
  isEnabled   Boolean  @default(false) @map("is_enabled")
  rules       Json?    @db.JsonB
  owner       String?  @db.VarChar(100)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz

  @@index([isEnabled])
  @@map("feature_flags")
}
```

### 3.27 SystemConfiguration

```prisma
model SystemConfiguration {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique @db.VarChar(100)
  value       Json     @db.JsonB
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz

  @@map("system_configurations")
}
```

---

## 4. Prisma Middleware Requirements

### 4.1 Soft Delete Filtering

All models with `deletedAt` must be filtered automatically. Use Prisma Client Extensions:

- Create a middleware/extension that prepends `WHERE deleted_at IS NULL` to all `findMany`, `findFirst`, `findUnique` queries.
- Provide `includeDeleted: true` option to bypass the filter for admin queries.
- Block hard `DELETE` on soft-delete models (enforce `update({ deletedAt: new Date() })` instead).

### 4.2 Optimistic Concurrency for Wallet

The `Wallet.version` field enables optimistic locking:

```typescript
// Pattern for wallet balance updates:
const wallet = await prisma.wallet.findUnique({ where: { userId } });
const result = await prisma.wallet.updateMany({
  where: { id: wallet.id, version: wallet.version },
  data: {
    balanceCents: wallet.balanceCents + delta,
    version: { increment: 1 },
  },
});
if (result.count === 0) {
  // Retry: fetch updated wallet and reattempt
}
```

### 4.3 Immutability Enforcement

At the application level, register Prisma middleware that:
- Throws on `update` / `delete` operations targeting `WalletTransaction`, `AuditLog`, or `RssFeedLog`.
- Complements the database-level triggers (defense in depth).

---

## 5. Raw SQL Migrations Required

These cannot be expressed in Prisma schema and must be added as separate migration files:

1. **tsvector column + GIN index on `articles`** — with trigger to auto-populate from `title` and `excerpt`.
2. **Immutability triggers on `wallet_transactions` and `audit_logs`** — reject UPDATE/DELETE.
3. **`pg_trgm` extension** (optional, for trigram-based fuzzy search if needed).

---

*End of Prisma Schema Plan. Ready for `prisma migrate dev` after initial project setup.*

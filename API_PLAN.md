# MillionBlogs — API Planning Document

**Version:** 3.0  
**Pattern:** REST | Versioned (`/api/v1/...`) | JSON responses

---

## API Design Rules

1. **Base path**: `/api/v1`
2. **Auth header**: `Authorization: Bearer <access_token>`
3. **Pagination**: Query params `?page=1&pageSize=20`, response includes `{ items, total, page, pageSize }`
4. **Standard responses**:
   - Success: `200` / `201` with JSON body
   - Validation error: `422 { statusCode, message, errors: [] }`
   - Auth error: `401 { statusCode, message }`
   - Forbidden: `403 { statusCode, message }`
   - Not found: `404 { statusCode, message }`
   - Conflict: `409 { statusCode, message }`
5. **Soft-delete endpoints**: `DELETE` marks as deleted; `GET` excludes by default. Add `?includeDeleted=true` for admin.
6. **Rate limiting**: Auth endpoints: 5/min. Write endpoints: 30/min. Read endpoints: 100/min.

---

## Endpoint Inventory

### 1. Auth Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | visitor | Register new user | `AuthTokensDto` |
| `POST` | `/api/v1/auth/login` | visitor | Authenticate user | `AuthTokensDto` |
| `POST` | `/api/v1/auth/refresh` | visitor | Refresh access token | `AuthTokensDto` |
| `POST` | `/api/v1/auth/logout` | blogger | Revoke refresh token | `204 No Content` |
| `POST` | `/api/v1/auth/verify-email` | visitor | Verify email with token | `200 { message }` |
| `POST` | `/api/v1/auth/forgot-password` | visitor | Request password reset | `200 { message }` |
| `POST` | `/api/v1/auth/reset-password` | visitor | Reset password with token | `200 { message }` |
| `GET` | `/api/v1/auth/me` | blogger | Get current user profile | `UserProfileDto` |

### 2. User Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/users/:id` | blogger (self) / admin | Get user profile | `UserProfileDto` |
| `PATCH` | `/api/v1/users/:id` | blogger (owner) | Update profile | `UserProfileDto` |
| `DELETE` | `/api/v1/users/:id` | blogger (owner) / admin | Soft-delete account | `204 No Content` |
| `GET` | `/api/v1/users/:id/preferences` | blogger (owner) | Get preferences | `UserPreferenceDto` |
| `PATCH` | `/api/v1/users/:id/preferences` | blogger (owner) | Update preferences | `UserPreferenceDto` |

### 3. Blog Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/blogs` | visitor | List blogs (paginated, filterable) | `PaginatedResult<BlogDto>` |
| `GET` | `/api/v1/blogs/:slug` | visitor | Get blog by slug | `BlogDto` |
| `POST` | `/api/v1/blogs` | blogger | Register new blog | `BlogDto` |
| `PATCH` | `/api/v1/blogs/:id` | blogger (owner) | Update blog | `BlogDto` |
| `DELETE` | `/api/v1/blogs/:id` | blogger (owner) / admin | Soft-delete blog | `204 No Content` |
| `GET` | `/api/v1/users/:id/blogs` | visitor | List blogs by user | `BlogDto[]` |

#### 3.1 Verification Sub-Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/blogs/:id/verification` | blogger (owner) | Initiate verification | `VerificationDto` |
| `GET` | `/api/v1/blogs/:id/verification/:verificationId` | blogger (owner) / admin | Check verification status | `VerificationDto` |
| `POST` | `/api/v1/blogs/:id/verification/:verificationId/retry` | blogger (owner) | Retry verification | `VerificationDto` |
| `POST` | `/api/v1/admin/blogs/:id/verify` | admin | Admin override verification | `BlogDto` |

### 4. RSS Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/blogs/:id/feed` | blogger (owner) | Connect RSS feed | `RssFeedDto` |
| `GET` | `/api/v1/blogs/:id/feed` | visitor | Get feed status | `RssFeedDto` |
| `PATCH` | `/api/v1/blogs/:id/feed` | blogger (owner) | Update feed config | `RssFeedDto` |
| `DELETE` | `/api/v1/blogs/:id/feed` | blogger (owner) | Disconnect feed | `204 No Content` |
| `POST` | `/api/v1/blogs/:id/feed/fetch` | blogger (owner) / admin | Force manual fetch | `RssFeedLogDto` |
| `GET` | `/api/v1/blogs/:id/feed/logs` | blogger (owner) / admin | Get fetch history | `RssFeedLogDto[]` |

### 5. Article Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/articles` | visitor | List articles (filtered, paginated) | `PaginatedResult<ArticleDto>` |
| `GET` | `/api/v1/articles/:id` | visitor | Get article by ID | `ArticleDto` |
| `GET` | `/api/v1/blogs/:id/articles` | visitor | List blog articles | `PaginatedResult<ArticleDto>` |
| `DELETE` | `/api/v1/articles/:id` | blogger (blog owner) / admin | Soft-delete article | `204 No Content` |

### 6. Category Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/categories` | visitor | List all active categories | `CategoryDto[]` |
| `GET` | `/api/v1/categories/:slug` | visitor | Get category by slug | `CategoryDto` |
| `GET` | `/api/v1/categories/:slug/articles` | visitor | Articles in category | `PaginatedResult<ArticleDto>` |

#### 6.1 Admin Category Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/admin/categories` | admin | Create category | `CategoryDto` |
| `PATCH` | `/api/v1/admin/categories/:id` | admin | Update category | `CategoryDto` |
| `DELETE` | `/api/v1/admin/categories/:id` | admin | Soft-delete category | `204 No Content` |
| `POST` | `/api/v1/admin/categories/:id/translations` | admin | Add/update translation | `CategoryTranslationDto` |

### 7. Search Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/search/articles` | visitor | Full-text article search | `PaginatedResult<ArticleSearchHitDto>` |
| `GET` | `/api/v1/search/blogs` | visitor | Blog search | `PaginatedResult<BlogSearchHitDto>` |
| `GET` | `/api/v1/search/autocomplete` | visitor | Search autocomplete | `string[]` |

### 8. Promotion Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/promotions/pricing` | visitor | List pricing tiers | `PricingDto[]` |
| `POST` | `/api/v1/promotions/campaigns` | blogger (blog owner) | Create campaign | `CampaignDto` |
| `GET` | `/api/v1/promotions/campaigns/:id` | blogger (owner) / admin | Get campaign | `CampaignDto` |
| `GET` | `/api/v1/blogs/:id/promotions` | visitor | List blog's campaigns | `CampaignDto[]` |
| `POST` | `/api/v1/promotions/campaigns/:id/cancel` | blogger (owner) / admin | Cancel campaign | `CampaignDto` |

### 9. Wallet Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/wallet` | blogger (owner) | Get wallet balance | `WalletDto` |
| `GET` | `/api/v1/wallet/transactions` | blogger (owner) | Get transaction history | `PaginatedResult<TransactionDto>` |
| `GET` | `/api/v1/wallet/statement` | blogger (owner) | Download statement | `TransactionDto[]` |

### 10. Payment Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/payments/checkout` | blogger | Create Stripe checkout session | `CheckoutSessionDto` |
| `GET` | `/api/v1/payments/history` | blogger (owner) | Get payment history | `PaginatedResult<PaymentOrderDto>` |
| `POST` | `/api/v1/webhooks/stripe` | public (signed) | Stripe webhook receiver | `200 OK` |

### 11. Badge Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/badges/definitions` | visitor | List badge types | `BadgeDefinitionDto[]` |
| `GET` | `/api/v1/blogs/:id/badges` | visitor | Get blog's badges | `BadgeAssignmentDto[]` |

#### 11.1 Admin Badge Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/admin/badges/assign` | admin | Assign badge to blog | `BadgeAssignmentDto` |
| `POST` | `/api/v1/admin/badges/revoke/:assignmentId` | admin | Revoke badge | `204 No Content` |
| `POST` | `/api/v1/admin/badges/definitions` | admin | Create badge definition | `BadgeDefinitionDto` |
| `PATCH` | `/api/v1/admin/badges/definitions/:id` | admin | Update definition | `BadgeDefinitionDto` |

### 12. Notification Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/notifications` | blogger (owner) | List user notifications | `PaginatedResult<NotificationDto>` |
| `GET` | `/api/v1/notifications/unread-count` | blogger (owner) | Get unread count | `{ count: number }` |
| `PATCH` | `/api/v1/notifications/:id/read` | blogger (owner) | Mark as read | `204 No Content` |
| `PATCH` | `/api/v1/notifications/read-all` | blogger (owner) | Mark all as read | `{ count: number }` |

### 13. Support Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/support/tickets` | blogger | Create support ticket | `TicketDto` |
| `GET` | `/api/v1/support/tickets` | blogger (owner) | List user's tickets | `TicketDto[]` |
| `GET` | `/api/v1/support/tickets/:id` | blogger (owner) / admin | Get ticket details | `TicketDto` |

### 14. Admin Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/admin/dashboard/stats` | admin | Platform statistics | `PlatformStatsDto` |
| `GET` | `/api/v1/admin/users` | admin | List all users | `PaginatedResult<UserProfileDto>` |
| `POST` | `/api/v1/admin/users/:id/suspend` | admin | Suspend user | `204 No Content` |
| `POST` | `/api/v1/admin/users/:id/restore` | admin | Restore user | `204 No Content` |
| `DELETE` | `/api/v1/admin/users/:id` | super_admin | Force delete user | `204 No Content` |
| `GET` | `/api/v1/admin/blogs` | admin | List all blogs | `PaginatedResult<BlogDto>` |
| `POST` | `/api/v1/admin/blogs/:id/suspend` | admin | Suspend blog | `204 No Content` |
| `POST` | `/api/v1/admin/blogs/:id/restore` | admin | Restore blog | `204 No Content` |
| `GET` | `/api/v1/admin/audit-logs` | admin | Query audit logs | `PaginatedResult<AuditLogDto>` |
| `GET` | `/api/v1/admin/feature-flags` | admin | List all feature flags | `FeatureFlagDto[]` |
| `PATCH` | `/api/v1/admin/feature-flags/:key` | super_admin | Toggle feature flag | `FeatureFlagDto` |
| `GET` | `/api/v1/admin/config` | super_admin | List system config | `SystemConfigDto[]` |
| `PUT` | `/api/v1/admin/config/:key` | super_admin | Set config value | `SystemConfigDto` |

### 15. SEO Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `GET` | `/sitemap.xml` | visitor | Main sitemap index | XML |
| `GET` | `/sitemaps/:language/articles.xml` | visitor | Articles sitemap | XML |
| `GET` | `/sitemaps/:language/categories/:slug.xml` | visitor | Category sitemap | XML |
| `GET` | `/robots.txt` | visitor | Robots exclusion file | Text |

### 16. PWA Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `GET` | `/manifest.json` | visitor | PWA manifest | JSON |
| `GET` | `/sw.js` | visitor | Service worker | JS |

### 17. System Endpoints

| Method | Route | Permission | Purpose | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/health` | visitor | Health check | `{ status, uptime, db, redis }` |
| `GET` | `/api/v1/health/ready` | visitor | Readiness probe | `200 OK` |
| `GET` | `/api/v1/health/live` | visitor | Liveness probe | `200 OK` |

---

## Endpoint Summary

| Module | Public | Authenticated | Admin | Total |
|---|---|---|---|---|
| Auth | 5 | 2 | — | 7 |
| Users | — | 5 | — | 5 |
| Blogs | 4 | 4 | 1 | 9 |
| RSS | — | 5 | 1 | 6 |
| Articles | 3 | 1 | — | 4 |
| Categories | 3 | — | 4 | 7 |
| Search | 3 | — | — | 3 |
| Promotions | 1 | 3 | — | 4 |
| Wallet | — | 3 | — | 3 |
| Payments | — | 2 | — | 3 (incl. webhook) |
| Badges | 2 | — | 4 | 6 |
| Notifications | — | 4 | — | 4 |
| Support | — | 3 | — | 3 |
| Admin | — | — | 14 | 14 |
| SEO | 4 | — | — | 4 |
| PWA | 2 | — | — | 2 |
| System | 3 | — | — | 3 |
| **Total** | **30** | **32** | **24** | **86** |

---

*End of API Plan.*

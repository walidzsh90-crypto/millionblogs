# MillionBlogs — Authorization Matrix

**Version:** 3.0  
**Pattern:** RBAC (Role-Based Access Control)

---

## 1. Role Hierarchy

```
super_admin  →  admin  →  blogger  →  visitor
```

Each role inherits all permissions of roles below it.

---

## 2. Role Definitions

| Role | Description | Default |
|---|---|---|
| `visitor` | Unauthenticated user | Auto-assigned on first visit |
| `blogger` | Registered user with verified email | Assigned on registration |
| `admin` | Platform staff with moderation privileges | Assigned by super_admin |
| `super_admin` | Full system access | Seeded manually (first user) |

---

## 3. Operation Permissions

### 3.1 Auth Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| Register | ✓ | — | — | — | Becomes blogger on success |
| Login | ✓ | — | — | — | — |
| Logout | — | ✓ | ✓ | ✓ | — |
| Refresh token | ✓ | ✓ | ✓ | ✓ | — |
| Verify email | ✓ | — | — | — | — |
| Request password reset | ✓ | — | — | — | — |
| Reset password | ✓ | — | — | — | — |

### 3.2 User Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| Get own profile | — | ✓ | ✓ | ✓ | Ownership check |
| Update own profile | — | ✓ | ✓ | ✓ | Ownership check |
| Update own preferences | — | ✓ | ✓ | ✓ | Ownership check |
| Delete own account | — | ✓ | ✓ | ✓ | Ownership check + restrictions |
| View any user profile | — | — | ✓ | ✓ | Admin only |
| List users (admin) | — | — | ✓ | ✓ | — |

### 3.3 Blog Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| List blogs | ✓ | ✓ | ✓ | ✓ | Public |
| View blog details | ✓ | ✓ | ✓ | ✓ | Public |
| Create blog | — | ✓ | ✓ | ✓ | Blogger+ |
| Update own blog | — | ✓ | ✓ | ✓ | Ownership check |
| Delete own blog | — | ✓ | ✓ | ✓ | Ownership check |
| Initiate verification | — | ✓ | ✓ | ✓ | Ownership check |
| Check verification status | — | ✓ | ✓ | ✓ | Ownership check; admin sees all |
| Override verification (admin) | — | — | ✓ | ✓ | — |
| Suspend blog | — | — | ✓ | ✓ | — |
| Restore blog | — | — | ✓ | ✓ | — |

### 3.4 RSS Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| Connect feed | — | ✓ | ✓ | ✓ | Ownership check on blog |
| Disconnect feed | — | ✓ | ✓ | ✓ | Ownership check on blog |
| Force fetch | — | ✓ | ✓ | ✓ | Ownership check; admin can force any |
| View feed status | — | ✓ | ✓ | ✓ | Ownership check |
| View feed logs | — | ✓ | ✓ | ✓ | Ownership check |
| View any feed (admin) | — | — | ✓ | ✓ | — |
| Reset dead feed | — | — | ✓ | ✓ | — |

### 3.5 Article Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| List articles | ✓ | ✓ | ✓ | ✓ | Public, filtered |
| View article | ✓ | ✓ | ✓ | ✓ | Public |
| Delete own article | — | ✓ | ✓ | ✓ | Ownership check on blog |
| Batch delete articles | — | ✓ | ✓ | ✓ | Ownership check on blog |
| View any article (admin) | — | — | ✓ | ✓ | Including soft-deleted |

### 3.6 Category Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| List categories | ✓ | ✓ | ✓ | ✓ | Public |
| View category | ✓ | ✓ | ✓ | ✓ | Public |
| Create category | — | — | ✓ | ✓ | — |
| Update category | — | — | ✓ | ✓ | — |
| Delete category | — | — | ✓ | ✓ | — |

### 3.7 Search Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| Search articles | ✓ | ✓ | ✓ | ✓ | Public; rate-limited |
| Search blogs | ✓ | ✓ | ✓ | ✓ | Public |
| Autocomplete | ✓ | ✓ | ✓ | ✓ | Public; rate-limited |

### 3.8 Wallet Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| Get own balance | — | ✓ | ✓ | ✓ | Ownership check |
| Get own transactions | — | ✓ | ✓ | ✓ | Ownership check |
| View any wallet (admin) | — | — | ✓ | ✓ | Read-only |
| Freeze/unfreeze wallet | — | — | ✓ | ✓ | — |
| Adjust balance (admin) | — | — | — | ✓ | Super admin only |

### 3.9 Payment Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| Create checkout session | — | ✓ | ✓ | ✓ | Blogger+ |
| View own payment history | — | ✓ | ✓ | ✓ | Ownership check |
| View all payments (admin) | — | — | ✓ | ✓ | — |
| Process refund | — | — | ✓ | ✓ | — |
| Stripe webhook | ✓ | ✓ | ✓ | ✓ | Signed payload, no auth |

### 3.10 Promotion Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| List pricing tiers | ✓ | ✓ | ✓ | ✓ | Public |
| Create campaign | — | ✓ | ✓ | ✓ | Ownership check on blog |
| View own campaigns | — | ✓ | ✓ | ✓ | Ownership check |
| Cancel own campaign | — | ✓ | ✓ | ✓ | Ownership check |
| View all campaigns (admin) | — | — | ✓ | ✓ | — |
| Create/edit pricing | — | — | ✓ | ✓ | — |
| Activate/manually complete | — | — | ✓ | ✓ | — |

### 3.11 Badge Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| View blog badges | ✓ | ✓ | ✓ | ✓ | Public |
| Assign badge (admin) | — | — | ✓ | ✓ | — |
| Revoke badge | — | — | ✓ | ✓ | — |
| Create/edit badge definitions | — | — | ✓ | ✓ | — |

### 3.12 Notification Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| Get own notifications | — | ✓ | ✓ | ✓ | Ownership check |
| Mark own notification read | — | ✓ | ✓ | ✓ | Ownership check |
| Mark all own read | — | ✓ | ✓ | ✓ | Ownership check |
| Get unread count | — | ✓ | ✓ | ✓ | Ownership check |

### 3.13 Support Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| Create ticket | — | ✓ | ✓ | ✓ | Blogger+ |
| View own tickets | — | ✓ | ✓ | ✓ | Ownership check |
| View all tickets (admin) | — | — | ✓ | ✓ | — |
| Update ticket status | — | — | ✓ | ✓ | — |
| Assign ticket | — | — | ✓ | ✓ | — |

### 3.14 SEO Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| View sitemap | ✓ | ✓ | ✓ | ✓ | Public |
| View robots.txt | ✓ | ✓ | ✓ | ✓ | Public |

### 3.15 PWA Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| Get manifest.json | ✓ | ✓ | ✓ | ✓ | Public |
| Get service worker | ✓ | ✓ | ✓ | ✓ | Public |

### 3.16 Admin Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| View admin dashboard | — | — | ✓ | ✓ | — |
| View platform stats | — | — | ✓ | ✓ | — |
| Manage feature flags | — | — | — | ✓ | Super admin only |
| Manage system config | — | — | — | ✓ | Super admin only |
| Manage other admins | — | — | — | ✓ | Super admin only |
| View audit logs | — | — | ✓ | ✓ | — |
| Export platform data | — | — | ✓ | ✓ | — |
| Put system in maintenance | — | — | — | ✓ | Super admin only |

### 3.17 System Operations

| Operation | visitor | blogger | admin | super_admin | Notes |
|---|---|---|---|---|---|
| Health check | ✓ | ✓ | ✓ | ✓ | Public |
| Read feature flags | ✓ | ✓ | ✓ | ✓ | Public (enabled flags only) |

---

## 4. Ownership Rules

| Resource | Owner | Check Logic |
|---|---|---|
| Blog | Creator (User) | `Blog.userId === authenticatedUserId` |
| Article | Blog owner | `Article.blog.userId === authenticatedUserId` |
| RssFeed | Blog owner | `RssFeed.blog.userId === authenticatedUserId` |
| Wallet | User | `Wallet.userId === authenticatedUserId` |
| PaymentOrder | Purchaser | `PaymentOrder.userId === authenticatedUserId` |
| Notification | Recipient | `Notification.userId === authenticatedUserId` |
| SupportTicket | Creator | `SupportTicket.userId === authenticatedUserId` |
| Session | Owner | `Session.userId === authenticatedUserId` |
| Campaign | Blog owner | `PromotionCampaign.blog.userId === authenticatedUserId` |

## 5. Escalation Rules

| Situation | Rule |
|---|---|
| Admin needs to impersonate a user action | Must log audit trail entry. Use `AdminActionPerformed` event. |
| Super admin can bypass feature flags | Feature flag check is skipped for `super_admin` role. |
| Delete protection | Users with active promotion campaigns cannot delete their account. Soft-delete only. |
| Suspension override | Only `super_admin` can unsuspend an admin's account. |
| Financial override | Only `super_admin` can manually adjust wallet balances. Every adjustment is audited. |

---

*End of Authorization Matrix.*

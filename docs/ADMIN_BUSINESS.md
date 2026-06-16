# Admin Business Management

## Overview

Aggregated admin controllers for business operations across all platform features.

## Management Categories

### Promotion Package Management
- `GET /admin/promotions/packages` — List packages
- `POST /admin/promotions/packages` — Create package
- `PUT /admin/promotions/packages/:id` — Update package
- `DELETE /admin/promotions/packages/:id` — Soft delete
- `POST /admin/promotions/expire` — Expire overdue campaigns

### Campaign Management
- `GET /admin/promotions/campaigns` — List campaigns with filters
- `POST /admin/promotions/campaigns/:id/activate` — Force activate
- `POST /admin/promotions/campaigns/:id/pause` — Force pause
- `POST /admin/promotions/campaigns/:id/complete` — Mark complete
- `POST /admin/promotions/campaigns/:id/cancel` — Cancel
- `GET /admin/promotions/stats` — Aggregate stats

### Founder Management
- `GET /admin/founder/programs` — List programs
- `GET /admin/founder/programs/:slug` — Get program details
- `POST /admin/founder/programs/seed` — Seed defaults
- `POST /admin/founder/programs/:id/close` — Close program
- `GET /admin/founder/seats` — List claimed seats

### Badge Management
- `POST /admin/badges` — Create badge (SVG)
- `PUT /admin/badges/:id` — Update badge
- `POST /admin/badges/:id/archive` — Archive badge
- `POST /admin/badges/assign` — Assign badge to user
- `POST /admin/badges/:badgeId/revoke/:userId` — Revoke badge
- `GET /admin/badges/stats` — Stats by type

### Wallet Adjustments
- `POST /admin/wallet/adjust` — Manual wallet adjustment
- `GET /admin/wallet/:userId` — View wallet balance

### Plan Management
- `GET /admin/plans` — List plans
- `POST /admin/plans` — Create plan
- `PUT /admin/plans/:id` — Update plan
- `POST /admin/plans/seed` — Seed defaults
- `DELETE /admin/plans/:id` — Soft delete

### Subscription Management
- `GET /admin/subscriptions` — List subscriptions
- `GET /admin/subscriptions/stats` — Stats
- `POST /admin/subscriptions/:id/activate` — Activate
- `POST /admin/subscriptions/:id/renew` — Renew
- `POST /admin/subscriptions/:id/cancel` — Cancel
- `POST /admin/subscriptions/:id/extend` — Extend by days
- `POST /admin/subscriptions/:id/suspend` — Suspend
- `POST /admin/subscriptions/process-renewals` — Batch renewals

### Payment Management
- `GET /admin/payments` — List payments
- `GET /admin/payments/stats` — Revenue stats

### Support Management
- `GET /admin/support/tickets` — List tickets
- `GET /admin/support/tickets/:id` — View with replies
- `POST /admin/support/tickets/:id/reply` — Reply
- `POST /admin/support/tickets/:id/status` — Change status
- `POST /admin/support/tickets/:id/assign` — Assign to admin
- `GET /admin/support/stats` — Ticket stats

### System Settings
- Feature flags via `FeatureFlagModule`
- System configuration via `SystemConfiguration` model

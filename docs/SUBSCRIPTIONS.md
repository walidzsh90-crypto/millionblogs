# Subscription Management

## Overview

Subscriptions are recurring memberships tied to Plan definitions. Four subscription plans exist: Pro Monthly, Pro Yearly, Master Monthly, Master Yearly.

## States

```
Pending → Active → Grace Period → Expired
                → Cancelled
Active → Suspended
Suspended → Active (unsuspend)
Grace Period → Active (renewal) | Expired
```

| State | Description |
|-------|-------------|
| Pending | Created, waiting for activation |
| Active | Current and paid |
| Grace Period | Past due, within grace window |
| Expired | Past grace period |
| Cancelled | Explicitly cancelled (manually by user or admin) |
| Suspended | Temporarily disabled (admin action) |

## Lifecycle

1. **Purchase**: User selects a plan → subscription created in `pending` status
2. **Activation**: Admin (or auto on payment) activates → status becomes `active`
3. **Renewal**: When `currentPeriodEnd` passes → enters grace period (7 days default)
4. **Grace Period**: Configurable window after expiration
5. **Cancellation**: User or admin can cancel → status becomes `cancelled`
6. **Expiration**: After grace period expires → status becomes `expired`
7. **Extension**: Admin can manually extend any subscription by N days

## Renewal Processing

Call `POST /admin/subscriptions/process-renewals` to:
- Move expired active subscriptions to grace period
- Move grace-period-expired subscriptions to expired

This should be scheduled via a cron job.

## APIs

### User
- `POST /subscriptions` — Create a subscription (body: `{ planId }`)
- `GET /subscriptions` — List user's subscriptions
- `GET /subscriptions/active` — Get current active subscription
- `GET /subscriptions/:id` — Get subscription details
- `POST /subscriptions/:id/cancel` — Cancel subscription

### Admin
- `GET /admin/subscriptions` — List all subscriptions with filters
- `GET /admin/subscriptions/stats` — Aggregate subscription stats
- `GET /admin/subscriptions/:id` — Get subscription details
- `POST /admin/subscriptions/:id/activate` — Activate a subscription
- `POST /admin/subscriptions/:id/renew` — Renew a subscription
- `POST /admin/subscriptions/:id/cancel` — Cancel a subscription
- `POST /admin/subscriptions/:id/extend` — Extend by N days
- `POST /admin/subscriptions/:id/suspend` — Suspend
- `POST /admin/subscriptions/process-renewals` — Process batch renewals

## Grace Period

Default: 7 days (configurable in `SubscriptionsService.gracePeriodDays`)

When a subscription enters the grace period:
- `status` changes to `grace_period`
- `gracePeriodEnd` is set to `now + 7 days`
- During grace period, the subscription may still be renewed
- After grace period expires, status changes to `expired`

## Invoice Tracking

Each renewal creates a `SubscriptionInvoice` record with the plan price for auditability.

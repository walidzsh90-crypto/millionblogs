# Promotion Engine

## Overview

The Promotion Engine allows users to promote their articles and showcases using credits. It is the primary revenue engine of the platform.

## Promotion Types

| Type | Description |
|------|-------------|
| Article Promotion | Promotes a specific article to get more visibility |
| Showcase Promotion | Promotes a showcase/portfolio item |

## Packages

Admin-configurable promotion packages:

| Field | Type | Description |
|-------|------|-------------|
| name | string | Display name |
| slug | string | Unique identifier |
| description | string | Optional description |
| creditCost | int | Credits required for purchase |
| duration | int | Campaign duration in seconds |
| priority | int | Priority ranking (higher = more visibility) |
| status | 'active' \| 'inactive' | Whether package is available |
| visibility | 'public' \| 'hidden' | Whether users can see it |
| sortOrder | int | Display order |

## Campaign Lifecycle

```
Draft → Scheduled → Active → Paused → Active
                    Active → Completed
                    Active → Expired (auto)
Any state → Cancelled
```

## Credit Consumption

- Credits are debited atomically from the wallet at campaign creation
- Idempotency keys prevent double charging
- Full audit trail via WalletTransaction records
- Insufficient credits → `BadRequestException`

## Rotation Engine

See [ROTATION_ENGINE.md](ROTATION_ENGINE.md) for details.

## APIs

### Public
- `GET /promotions/packages` — List active promotion packages
- `GET /promotions/rotation/:type` — Get rotation order (article/showcase)
- `POST /promotions/impression` — Record an impression `{ campaignId }`
- `POST /promotions/click` — Record a click `{ campaignId }`

### User (account scoped)
- `POST /account/promotions/campaigns` — Create campaign `{ packageId, type, creditsBudget? }`
- `GET /account/promotions/campaigns` — List user's campaigns
- `GET /account/promotions/campaigns/:id` — Get campaign details
- `POST /account/promotions/campaigns/:id/activate` — Activate
- `POST /account/promotions/campaigns/:id/pause` — Pause
- `POST /account/promotions/campaigns/:id/cancel` — Cancel

### Admin
- `GET /admin/promotions/packages` — List all packages
- `POST /admin/promotions/packages` — Create package
- `PUT /admin/promotions/packages/:id` — Update package
- `DELETE /admin/promotions/packages/:id` — Soft delete package
- `GET /admin/promotions/campaigns` — List all campaigns with filters
- `POST /admin/promotions/campaigns/:id/activate` — Admin activate
- `POST /admin/promotions/campaigns/:id/pause` — Admin pause
- `POST /admin/promotions/campaigns/:id/complete` — Mark complete
- `POST /admin/promotions/campaigns/:id/cancel` — Cancel
- `GET /admin/promotions/stats` — Aggregate stats
- `POST /admin/promotions/expire` — Expire overdue campaigns

## Analytics

Each campaign tracks:
- **Impressions**: Number of times shown
- **Clicks**: Number of times clicked
- **CTR**: Click-through rate (clicks / impressions)
- **Credits Spent**: Total credits consumed
- **Remaining Credits**: Budget - spent

## Events

- `CAMPAIGN_CREATED`, `CAMPAIGN_ACTIVATED`, `CAMPAIGN_PAUSED`
- `CAMPAIGN_COMPLETED`, `CAMPAIGN_EXPIRED`
- `CREDITS_CONSUMED`, `PROMOTION_CLICKED`, `PROMOTION_VIEWED`

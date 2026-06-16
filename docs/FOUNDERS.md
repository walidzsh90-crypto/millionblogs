# Founder Programs

## Overview

Founder Programs are lifetime access memberships sold at a fixed price with a limited number of seats. Two tiers exist: Founder Pro and Founder Master.

## Programs

| Feature | Founder Pro | Founder Master |
|---------|------------|----------------|
| Price | $15.95 USD lifetime | $50 USD lifetime |
| Total Seats | 5,000 | 1,000 |
| Badge | "Founder Pro" | "Founder Master" |
| Billing | None (one-time) | None (one-time) |
| Upgrade Path | → Founder Master | N/A (top tier) |

## Seat Allocation

- Atomic allocation via `$transaction` to prevent overselling
- Optimistic concurrency control with `version` column on FounderSeat
- Program auto-closes when `usedSeats >= totalSeats`
- One seat per user (enforced by unique constraint on `userId`)
- Remaining seats computed as `totalSeats - usedSeats`

## APIs

### Public
- `GET /founder/programs` — List open programs
- `GET /founder/programs/:slug` — Get program details
- `POST /founder/claim` — Claim a founder seat (auth required)
- `POST /founder/upgrade` — Upgrade founder tier (auth required)
- `GET /founder/my-seat` — Get current user's founder seat (auth required)

### Admin
- `GET /admin/founder/programs` — List all programs with optional status filter
- `GET /admin/founder/programs/:slug` — Get program details
- `POST /admin/founder/programs/seed` — Seed default programs
- `POST /admin/founder/programs/:id/close` — Close a program manually
- `GET /admin/founder/seats` — List all claimed seats with user info

## Upgrade Rules

1. Only allowed if the target program has available seats
2. User must already hold a lower-tier founder seat
3. Price difference must be paid by user (no automated billing yet)
4. Old seat is released, new seat is created (atomic)
5. Founder badge is updated on the User record
6. Events emitted for audit trail

## Seat Model

```
FounderProgram {
  slug: string (unique)
  totalSeats: int
  usedSeats: int
  status: 'open' | 'closed'
  badgeLabel: string
}

FounderSeat {
  userId: string (unique)
  programId: string (FK)
  version: int (optimistic locking)
}
```

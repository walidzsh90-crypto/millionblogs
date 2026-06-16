# Purchase Flow — Credit Purchase Implementation

## Overview

The purchase flow allows authenticated bloggers to buy credits via Stripe Checkout. Credits are added to their wallet immediately after successful payment confirmation via Stripe webhooks.

---

## Purchase Journey

```
Wallet Page                    Purchase Page                   Stripe Checkout
   │                                │                               │
   │  [Buy Credits]                 │                               │
   ├──────────────────────────────► │                               │
   │                                │  Select credit pack           │
   │                                │  [Continue to Payment]        │
   │                                │                               │
   │                                │  POST /payments/checkout      │
   │                                │  ──────────────────────────►  │
   │                                │  ◄── { sessionUrl } ────────  │
   │                                │                               │
   │                                │  Redirect to Stripe           │
   │                                ├─────────────────────────────► │
   │                                │                               │  User pays
   │                                │                               │  on Stripe
   │                                │                               │
   │                                │  Webhook: checkout.session.completed
   │                                │  ◄─────── (async) ────────────┤
   │                                │                               │
   │            success ──── Stripe redirects to ──── cancel        │
   │               │                          │                     │
   │               ▼                          ▼                     │
   │     /purchase/success           /purchase/cancel               │
   │     "Credits added!"            "No charges made"              │
   │           │                          │                         │
   │           │                          │                         │
   │           ▼                          │                         │
   │     [View My Wallet] ◄───────────────┘                         │
   │           │                                                    │
   │           ▼                                                    │
   │     Wallet page auto-refreshes                                 │
   │     (balance fetched on mount)                                 │
```

---

## Pages

### 1. Credit Purchase Page (`/dashboard/purchase`)

- **Route:** `app/[locale]/(dashboard)/dashboard/purchase/page.tsx`
- **Type:** Client component (`"use client"`)
- **Auth:** Protected by middleware (`mb_auth` cookie check)
- **Sections:**
  - **Credit pack grid** — 3 pack options in a responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
  - **Selected pack indicator** — highlighted card with "Selected" label
  - **Continue button** — disabled until a pack is selected
  - **Purchase history** — past payments listed below the form

### 2. Purchase Success Page (`/dashboard/purchase/success`)

- **Route:** `app/[locale]/(dashboard)/dashboard/purchase/success/page.tsx`
- **Type:** Client component
- **What it shows:**
  - Green checkmark icon
  - "Payment successful" heading
  - Credits added and amount paid
  - "View my wallet" button — links to `/dashboard/wallet`
  - "Buy more credits" button — links back to `/dashboard/purchase`

### 3. Purchase Cancel Page (`/dashboard/purchase/cancel`)

- **Route:** `app/[locale]/(dashboard)/dashboard/purchase/cancel/page.tsx`
- **Type:** Client component
- **What it shows:**
  - Warning icon
  - "Payment cancelled" heading
  - "No charges were made" message
  - "Try again" button — links to `/dashboard/purchase`
  - "Back to wallet" button — links to `/dashboard/wallet`

### 4. Wallet Page Update

- **Route:** `app/[locale]/(dashboard)/dashboard/wallet/page.tsx`
- **Change:** Added "Buy Credits" link next to the balance card section
- Wallet balance auto-refreshes on page load via existing `useEffect` → `walletApi.getBalance()`

---

## Credit Packs

Defined in `features/purchase/data/purchase-config.ts`:

| Pack | Credits | Price | Price/Credit | Plan ID (configurable) |
|---|---|---|---|---|
| Starter Pack | 100 | $10.00 | $0.10 | `PLAN_ID_STARTER` |
| Growth Pack | 500 | $45.00 | $0.09 | `PLAN_ID_GROWTH` |
| Pro Pack | 2,000 | $160.00 | $0.08 | `PLAN_ID_PRO` |

**Configuration:** The `planId` field in each pack must match the UUID of a corresponding plan in the `plans` database table. Update `CREDIT_PACKS` array in `purchase-config.ts` with the actual plan UUIDs from the backend.

Each pack displays:
- Name and credit amount
- Price formatted via `Intl.NumberFormat`
- Description with per-credit savings info
- "Best value" badge on the Growth Pack

---

## Stripe Integration Points

### 1. Checkout Session Creation

**Endpoint:** `POST /payments/checkout`
**Auth:** JWT Bearer token (sent via `apiClient`)

Request body:
```json
{
  "planId": "uuid-of-selected-pack",
  "successUrl": "https://millionblogs.com/en/dashboard/purchase/success",
  "cancelUrl": "https://millionblogs.com/en/dashboard/purchase/cancel"
}
```

Response:
```json
{
  "sessionId": "cs_test_xxx",
  "sessionUrl": "https://checkout.stripe.com/c/pay/cs_test_xxx",
  "paymentId": "uuid-of-payment-record"
}
```

### 2. Stripe Checkout Redirect

After receiving `sessionUrl`, the frontend performs:
```javascript
window.location.href = result.sessionUrl;
```

The user completes payment on Stripe's hosted checkout page.

### 3. Stripe Webhooks (Backend)

Handled asynchronously by `POST /stripe/webhook`:

| Event | Action |
|---|---|
| `checkout.session.completed` | Marks payment completed, credits wallet with `amount / STRIPE_PRICE_PER_CREDIT` credits, activates subscription if plan is a subscription |
| `payment_intent.succeeded` | Marks payment completed, credits wallet |
| `payment_intent.payment_failed` | Marks payment failed |
| `charge.refunded` | Marks payment refunded |

### 4. Post-Redirect Flow

After Stripe redirects to the success/cancel URL:
- **Success page:** Shows confirmation. User navigates to wallet to see updated balance.
- **Cancel page:** Shows cancellation message. User can try again.
- **Wallet refresh:** Automatic on wallet page mount (existing `useEffect`).

**Note:** The success page does not poll for payment status. The Stripe webhook processes the payment asynchronously and credits the wallet. If the user arrives at the success page before the webhook has fired, the wallet may not reflect the new credits yet. The user can refresh the wallet page to see the updated balance.

---

## API Layer

### `features/purchase/api/purchase-api.ts`

| Method | Endpoint | Description |
|---|---|---|
| `createCheckout(planId, successUrl?, cancelUrl?)` | `POST /payments/checkout` | Creates a Stripe Checkout Session |
| `listPayments({ status?, page?, pageSize? })` | `GET /payments` | Lists authenticated user's payments |
| `getPayment(id)` | `GET /payments/:id` | Gets a single payment by ID |

### Wallet Refresh

The wallet balance is refreshed on the wallet page via:
```typescript
walletApi.getBalance()  // GET /wallet/balance
```

The wallet page calls this on mount via `useEffect`. After a purchase, navigating to the wallet page triggers a fresh balance fetch.

---

## Error Handling

### API Errors

| Error Type | User-Facing Message | Handling |
|---|---|---|
| Network failure | "Network error. Please check your connection and try again." | Caught in `PurchaseForm.handleSubmit()`, displayed in alert box |
| 401 Unauthorized | Redirected to login | Handled by `apiClient.onUnauthorized` |
| 400 Bad Request | Backend error message | Displayed as-is (e.g., "Plan not found") |
| 500 Server Error | "An unexpected error occurred" | Caught generically |

### UI Error States

- **Purchase form:** Error message displayed below pack cards in a red alert box
- **Purchase history:** Error message with "Retry" button
- **Stripe checkout failure:** If `sessionUrl` is null, shown as error in the form
- **Pack selection:** "Continue to payment" button disabled until a pack is selected

### Edge Cases

| Scenario | Behavior |
|---|---|
| User refreshes success page | Page re-renders; shows success message again |
| User navigates directly to success page without a purchase | Shows success message without credit details |
| Webhook delayed | Wallet balance may not update immediately; user can refresh wallet page |
| Browser blocks Stripe redirect | Error is thrown and displayed in the form |
| Duplicate checkout creation | Backend handles idempotency via `idempotencyKey` |
| Invalid planId | Backend returns 400; error message displayed in form |

---

## Files Created

| File | Purpose |
|---|---|
| `features/purchase/api/purchase-api.ts` | API layer for checkout and payments |
| `features/purchase/data/purchase-config.ts` | Credit pack definitions, formatting utilities |
| `features/purchase/components/credit-pack-card.tsx` | Individual pack selection card |
| `features/purchase/components/purchase-form.tsx` | Main purchase form with pack selection and checkout trigger |
| `features/purchase/components/purchase-history.tsx` | Purchase history list with pagination |
| `features/purchase/components/payment-status-card.tsx` | Shared success/cancel status display |
| `app/[locale]/(dashboard)/dashboard/purchase/page.tsx` | Purchase page |
| `app/[locale]/(dashboard)/dashboard/purchase/success/page.tsx` | Purchase success confirmation |
| `app/[locale]/(dashboard)/dashboard/purchase/cancel/page.tsx` | Purchase cancel confirmation |

## Files Modified

| File | Change |
|---|---|
| `shared/api/client.ts` | Wired `tokenStore.getAccessToken()` and `onUnauthorized` handler into default `apiClient` singleton |
| `app/[locale]/(dashboard)/dashboard/wallet/page.tsx` | Added "Buy Credits" CTA button linking to `/dashboard/purchase` |
| `features/dashboard/components/dashboard-sidebar.tsx` | Added "Buy Credits" sidebar link after "Wallet" |

---

## Configuration Required

### 1. Plan IDs

Update `features/purchase/data/purchase-config.ts` with actual plan UUIDs:
```typescript
export const CREDIT_PACKS: CreditPackConfig[] = [
  {
    planId: "actual-uuid-from-database",  // ← Replace with real plan ID
    name: "Starter Pack",
    // ...
  },
  // ...
];
```

### 2. Stripe Configuration (Backend)

Ensure these environment variables are set:
```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PER_CREDIT=100    # 100 cents = $1.00 per credit
STRIPE_SUCCESS_URL=https://millionblogs.com/en/dashboard/purchase/success
STRIPE_CANCEL_URL=https://millionblogs.com/en/dashboard/purchase/cancel
```

### 3. Credit Pack Plans in Database

Each credit pack must have a corresponding `Plan` record in the database with:
- A Stripe price ID linked to the actual Stripe product/price
- Slug matching the pack slug (e.g., `credits-100`, `credits-500`, `credits-2000`)
- Price matching the pack price in cents
- Interval set appropriately (one-time purchase)

The `POST /payments/checkout` endpoint uses the `planId` to look up the plan and create a Stripe Checkout Session with the correct line item.

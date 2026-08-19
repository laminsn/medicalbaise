# Seeker subscriptions (medical, isolated)

Source-only checks. Do not migrate, SHIP, or deploy from this note.

## Locked slugs

| slug | display | price | entitlement |
| --- | --- | --- | --- |
| `flex` | Flex | R$0 + 5% (R$27 min) | default, not a Stripe subscription |
| `lifestyle` | Lifestyle | R$99/mo | 8 completed paid services, 0% fee |
| `project` | Project | R$499/mo | unlimited, 0% fee |

Do not use `payg`, `free`, `pro`, `elite`, or `baise+` as a seeker slug.

## Table

`public.seeker_subscriptions` columns: `id`, `user_id`, `app_key`, `plan`, `status`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `transactions_used`, `created_at`, `updated_at`.

This tree: `app_key = 'medical'` only. `plan` enum is `flex | lifestyle | project`. Default plan is `flex`.

## RLS

- Authenticated SELECT uses a column grant that omits `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`.
- GRANT SELECT lists `transactions_used` (not `transaction_count`, not `transactions_used_this_period`). `transactions_limit` is not granted.
- Own-row SELECT policy: `auth.uid() = user_id`.
- No authenticated INSERT/UPDATE/DELETE. Clients cannot write `plan`, `status`, Stripe ids, or `transactions_used`.
- `anon` has no SELECT (or any other privilege).
- `service_role` writes the row.

## `try_consume_seeker_transaction(app_key, user_id)`

- Fail-closed unless `app_key = 'medical'`.
- Missing user returns false.
- Inactive rows consume as `flex`.
- `lifestyle` returns false at 8 and does not increment.
- `project` and `flex` increment and return true.
- EXECUTE granted to `service_role` only. Not a browser RPC.

## Transaction definition

A transaction is consult paid / invoice paid / completed paid service.

Not a transaction: wallet top-up, bid, chat, invite, unpaid calendar confirm (`AppointmentCalendar` chat message).

Lifestyle 8-cap is not done in UI alone. The existing paid-complete path must call `try_consume_seeker_transaction` **server-side**. Not a browser RPC. `EXECUTE` stays `service_role` only. Fail-closed `app_key=medical` (hardcoded in the helper). Skip if no seeker `user_id` can be resolved. Do not invent one.

Call sites:

1. `create-pos-checkout` internal_balance, after `provider_invoices.payment_status=paid`.
2. `stripe-webhook` `markProviderPosPaid`, after invoice paid.
3. `stripe-webhook` `markProviderPaymentPlanItemPaid`, when the plan is complete (invoice paid, or no-invoice fallback).

Seeker `user_id` resolution, same as payment plans: existing `customer_id`, else `profiles.email` from invoice/plan `client_email` or Stripe session email. Missing match → skip.

Leave `create-wallet-checkout` cents allowlist `[2500…50000]` and its fail-closed medical `app_key` alone. Do not add wallet consume.

## Checkout

`create-seeker-checkout`:

- `mode=subscription`, `role=seeker`.
- Fail-closed unless `BAISE_APP_KEY=medical`.
- Allowlist only `STRIPE_PRICE_SEEKER_LIFESTYLE` and `STRIPE_PRICE_SEEKER_PROJECT`.
- Unset or invalid placeholder → checkout fail-closed.
- Amount is not client-trusted. Client may send `plan` only (`lifestyle` or `project`).
- Metadata: `role=seeker`, `plan`, `app_key=medical`, `user_id`.

Do not reuse MD provider `prod_TwYB…` / `price_1Syf5…` or Casa `prod_TwTA…`.

## Webhook

Pattern lives in the existing `supabase/functions/stripe-webhook/index.ts`. Do not copy a snapshot webhook file.

`event.id` persist: insert into `stripe_webhook_events.id` after signature verify, before handlers. Duplicate `23505` → `{ received: true }` and skip. Handler throw deletes the row so Stripe can retry.

Detect seeker **first**, then `break`. Never fall through to `providers.subscription_tier`. Signals: `role=seeker`, `type=seeker`, plan `flex|lifestyle|project`, matching `STRIPE_PRICE_SEEKER_*` when the id is `price_*`, or an existing `seeker_subscriptions` row for that Stripe subscription. Missing plan or unresolved user → log and `break`. Not return-true-only.

Seeker writes **only** `seeker_subscriptions`. Hardcoded `app_key=medical`. Slugs `flex|lifestyle|project`. Non-medical metadata `app_key` → log and `break`. Deleted seeker rows go to `flex` / `canceled`.

Provider writes are map-only `TIER_BY_PRODUCT_ID`. Skip when `productId` is missing or not in the map. Never `|| "pro"`. Casa IDs stay as-is (`prod_TwTARyUfpaG4ct` pro, `prod_TwTBPPowJkNd38` elite, `prod_TwTBPPFYSvdcUa` enterprise) — do not remap. `customer.subscription.deleted` → `free` only for a mapped provider product.

No `DO_NOT_DEPLOY`. No `|| casa`.

## UI

- Visual source of truth: https://baiseapps.vercel.app/pricing seeker `plan-card` chrome. Avis owns tokens. Do not invent a new catalog.
- Locked trio, BRL never USD×5.05: Flex `R$0` accent `--casa #1dbf73` Default pill fee-callout `5%` / `R$27 min`; Lifestyle `R$99` accent `--influencer #f3ff3b` Featured, `{used} / 8` **only** in the existing fee-callout (no tick bar); Project `R$499` accent `--legal #7c3aed` fee-callout Unlimited.
- Live type/spacing: Plus Jakarta, radius 22px, padding 30px, price `clamp(52px,6vw,78px)`, fee-callout 31px / 78px / radius 13px, grid gap 14px, three-up.
- Pay as you go / Baise+ names are replaced by Flex / Lifestyle / Project. Slugs remain `flex|lifestyle|project`.
- `/seeker-pricing` + `seekerPricing.*` in `en` / `es` / `pt`.
- MD `/pricing` stays provider-only for the Free/Pro/Elite/Enterprise USD ladder. A sibling seeker **block** (not a restyle of the provider cards) renders the marketing `.plan-card` Flex/Lifestyle/Project BRL trio. Do not convert provider USD ($0/$29/$59/$109) with USD×5.05. Provider-role checkout stays on the provider ladder.
- Seeker cards: uppercase plan eyebrow only (FLEX / LIFESTYLE / PROJECT). No second audience eyebrow on the cards. Flex Default pill optional. Lifestyle uses BEST FOR REPEAT BOOKINGS and `{used} / 8` in the fee chip. Project uses `#7c3aed` Pro-family chrome — never `.enterprise`, `--tech`, `From R$`, or red/yellow dual glow.
- Lifestyle `{used} / 8` is `transactions_used` from the server SELECT list, rendered in `.fee-callout` only (no tick bar, no shadcn Progress). Never `transaction_count` or `transactions_used_this_period`.
- `/pricing` provider cards stay the existing shadcn ladder. Checkout does not change `user_type` or provider tier.

## Out of scope

No merge. No deploy. No `.env*` reads. No Batches 1–8, invite PR #11, Batch 6 checkout residuals, or provider plan edits.

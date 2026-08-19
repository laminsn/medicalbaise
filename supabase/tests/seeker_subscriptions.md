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

`public.seeker_subscriptions` columns: `id`, `user_id`, `app_key`, `plan`, `status`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `transaction_count`, `created_at`, `updated_at`.

This tree: `app_key = 'medical'` only. `plan` enum is `flex | lifestyle | project`. Default plan is `flex`.

## RLS

- Authenticated SELECT uses a column grant that omits `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`.
- Own-row SELECT policy: `auth.uid() = user_id`.
- No authenticated INSERT/UPDATE/DELETE. Clients cannot write `plan`, `status`, Stripe ids, or `transaction_count`.
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

Seeker branch writes **only** `seeker_subscriptions`.

Fail-closed `app_key` from metadata (`medical` required).

Do not write `providers.subscription_tier`.

Do not rewrite provider `TIER_BY_PRODUCT_ID`. Inherited Casa `prod_TwTA…` mapping stays as-is (elite/enterprise persist as pro via existing fallback).

## UI

- Visual source of truth: https://baiseapps.vercel.app/pricing seeker `plan-card` chrome. Avis owns tokens. Do not invent a new catalog.
- Locked trio, BRL never USD×5.05: Flex `R$0` accent `--casa #1dbf73` Default pill fee-callout `5%` / `R$27 min`; Lifestyle `R$99` accent `--influencer #f3ff3b` Featured, `{used} / 8` **only** in the existing fee-callout (no tick bar); Project `R$499` accent `--legal #7c3aed` fee-callout Unlimited.
- Live type/spacing: Plus Jakarta, radius 22px, padding 30px, price `clamp(52px,6vw,78px)`, fee-callout 31px / 78px / radius 13px, grid gap 14px, three-up.
- Pay as you go / Baise+ names are replaced by Flex / Lifestyle / Project. Slugs remain `flex|lifestyle|project`.
- `/seeker-pricing` + `seekerPricing.*` in `en` / `es` / `pt`.
- MD `/pricing` stays provider-only for the Free/Pro/Elite/Enterprise USD ladder. A sibling **For patients** tab renders the marketing `.plan-card` Flex/Lifestyle/Project BRL trio. Do not convert provider USD ($0/$29/$59/$109) with USD×5.05. Provider-role checkout stays on the provider tab.
- Lifestyle `{used} / 8` is `transaction_count` from the server SELECT list, rendered in `.fee-callout` only (no tick bar, no shadcn Progress).
- `/pricing` provider cards stay the existing shadcn ladder. Checkout does not change `user_type` or provider tier.

## Out of scope

No merge. No deploy. No `.env*` reads. No Batches 1–8, invite PR #11, Batch 6 checkout residuals, or provider plan edits.

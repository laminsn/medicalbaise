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

Not a transaction: wallet top-up, bid, chat, invite.

Call site: Stripe webhook paid-complete paths (`markProviderPosPaid` when `provider_invoices.customer_id` is present; payment-plan completion when `provider_payment_plans.customer_id` is present).

Leave `create-wallet-checkout` cents allowlist `[2500…50000]` and its fail-closed medical `app_key` alone.

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

- `/seeker-pricing` + `seekerPricing.*` in `en` / `es` / `pt`.
- Lifestyle `used/8` is `transaction_count` from the server SELECT list.
- `/pricing` and other provider pages stay provider-only.
- Checkout does not change `user_type` or provider tier.

## Out of scope

No merge. No deploy. No `.env*` reads. No Batches 1–8, invite PR #11, Batch 6 checkout residuals, or provider plan edits.

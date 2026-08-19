# Shared-safe SQL (Casa apply-once)

**DO NOT MERGE. DO NOT APPLY SQL. DO NOT SHIP.** Isolated source only. Wait for Shannon/Sentry review.

Casa, medicalbaise, and legal-baise share one live Supabase project. Isolated seeker PRs that `CREATE` `seeker_subscriptions` with `app_key = 'medical'` (or `'legal'`) CHECK, or that `CREATE` `stripe_webhook_events`, must not be applied.

## Persist table

MD `stripe-webhook` inserts into `public.stripe_events` (`event_id` PK), same as Casa/Legal. Duplicate Postgres `23505` returns `{ received: true }` (HTTP 200) and skips handlers. Handler throw deletes that `event_id` so Stripe can retry.

Casa drafts the apply-once `CREATE` (service_role-only RLS). This tree does not `CREATE stripe_webhook_events`.

## Seeker subscriptions

Casa drafts the apply-once `seeker_subscriptions` file:

- `app_key IN ('casa', 'medical', 'legal')`
- `transactions_used`
- plan slugs `flex | lifestyle | project`

MD runtime (webhook, consume RPC args, client SELECT) stays fail-closed `app_key = 'medical'`. Do not coerce to `casa`. Isolated from `providers.subscription_tier`.

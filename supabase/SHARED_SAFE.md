# Shared-safe SQL (Casa apply-once)

**DO NOT MERGE. DO NOT APPLY SQL. DO NOT SHIP.**

Casa owns the one apply-once CREATE for the shared project. This tree does not CREATE `seeker_subscriptions` or `stripe_events`. No medical-only CHECK. No second or third copy of that SQL.

## Persist insert (this tree)

After `constructEvent`, MD writes Casa’s shape:

```ts
stripe_events.insert({ event_id: event.id })
```

- Do not insert `id` (Legal’s shape).
- Do not write `stripe_webhook_events`.
- Duplicate `23505` → `{ received: true }` HTTP 200.

## Runtime (MD only)

Fail-closed `app_key = medical`. Slugs `flex | lifestyle | project`. Column `transactions_used`. Isolated from `providers.subscription_tier`.

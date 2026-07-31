# supabase/migrations — read this before adding or "fixing" anything

## The live database is the source of truth, not this directory.

Casa Baise, Medical Baise and Legal Baise all share ONE Supabase project:
`xpcoaedbfmtyzvkwhaav`. App separation is the `providers.platform` column
(`baise_platform`: `casa_baise | medical_baise | legal_baise`), **not** `app_key`.

### Files dated before `20260730` are HISTORICAL and were never applied.

Verified 2026-07-30 against the live database: `supabase_migrations.schema_migrations`
contained 31 rows, **none** of whose versions match any filename in this directory
(the live lineage runs `20260411234752_core_schema_types_functions_tables` …
`20260719190721_onboarding_progress`). The three repos hold 85 / 83 / 54 files
respectively; none of them applied.

Do **not** try to reconcile the pre-`20260730` files with the live schema, and do
not "repair" them so the folders agree. They are kept only as history. Reading them
as a description of production will mislead you — several reference columns and
functions that do not exist.

### From `20260730` onward

- One migration is authored once and copied **byte-identically** into all three repos.
- It is applied **once** (from any repo); it is immediately live for all three apps.
- `scripts/check-schema-parity.sh` enforces that every file dated >= `20260730`,
  and `src/integrations/supabase/types.ts`, are identical across the three checkouts.

### Known live-schema facts worth not rediscovering

- `pgcrypto` is installed in schema `extensions`, not `public`. Functions using
  `digest()` / `gen_random_bytes()` need `SET search_path = public, extensions`.
- `providers_public` is a **SECURITY DEFINER** view (`reloptions IS NULL`) and all
  13 discovery call sites read it. Never add `WITH (security_invoker=true)` — it
  breaks the anonymous public directory, because `providers` RLS is `TO authenticated`.
- An RLS policy on `profiles` must not contain a subquery against `profiles`
  (42P17 infinite recursion). Route self-lookups through a `SECURITY DEFINER` helper.
- `provider_payment_transactions.payment_method` has no `'simulated'` value — use
  `'manual'`. `provider_ledger_entries.entry_type` has no `'payment'` — use
  `'payment_available'`.
- There is no `pg_cron` on this project.

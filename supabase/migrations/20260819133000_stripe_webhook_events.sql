-- DO NOT APPLY from this medicalbaise tree.
-- Isolated `stripe_webhook_events` (id PK) was never applied. Do not CREATE it.
--
-- Shared-safe CREATE lives on Casa and is apply-once against the one live
-- Supabase project. Persist table is public.stripe_events (event_id PK),
-- service_role-only. MD webhook insert is already unified to that table.
--
-- Shannon/Sentry review required before any SQL apply. Do not SHIP.

SELECT 1;

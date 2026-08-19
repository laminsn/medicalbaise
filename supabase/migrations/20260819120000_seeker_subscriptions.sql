-- DO NOT APPLY from this medicalbaise tree.
-- Isolated `CREATE TABLE seeker_subscriptions` with CHECK (app_key = 'medical')
-- was never applied. Do not CREATE it here — that is the three-app collision.
--
-- Shared-safe CREATE lives on Casa and is apply-once:
--   app_key IN ('casa', 'medical', 'legal')
--   stripe_events(event_id) for webhook persist
--   transactions_used (not transaction_count)
--   plan slugs flex | lifestyle | project
--
-- This app still fail-closes to app_key = 'medical' at runtime only.
-- SQL-level CHECK on the shared table allows casa|medical|legal.
-- Shannon/Sentry review required before any SQL apply. Do not SHIP.

SELECT 1;

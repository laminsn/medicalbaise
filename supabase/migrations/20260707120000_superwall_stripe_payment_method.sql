-- Add Superwall-powered Stripe checkout as a first-class provider payment route.
-- Superwall presents the in-app paywall/entitlement flow; Stripe remains the processor of record.

ALTER TABLE public.provider_payment_transactions
  DROP CONSTRAINT IF EXISTS provider_payment_transactions_payment_method_check;

ALTER TABLE public.provider_payment_transactions
  ADD CONSTRAINT provider_payment_transactions_payment_method_check
  CHECK (
    payment_method IN (
      'hosted_checkout',
      'card',
      'wallet',
      'pix',
      'internal_balance',
      'service_credit',
      'manual',
      'superwall_stripe'
    )
  );

ALTER TABLE public.provider_payment_plans
  DROP CONSTRAINT IF EXISTS provider_payment_plans_payment_method_check;

ALTER TABLE public.provider_payment_plans
  ADD CONSTRAINT provider_payment_plans_payment_method_check
  CHECK (
    payment_method IN (
      'hosted_checkout',
      'card',
      'wallet',
      'pix',
      'internal_balance',
      'service_credit',
      'manual',
      'superwall_stripe'
    )
  );


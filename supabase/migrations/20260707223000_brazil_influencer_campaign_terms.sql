-- Brazil influencer campaign terms for Baise creator partners.
-- Keeps partner-facing economics simple: approved posts, viral benchmark,
-- retained conversions, and a clear audience incentive.

UPDATE public.partner_campaigns
SET
  name = CASE
    WHEN app_key = 'medical' THEN 'Medical Baise Brazil Influencer Campaign'
    WHEN app_key = 'legal' THEN 'Legal Baise Brazil Influencer Campaign'
    ELSE 'Baise Brazil Influencer Campaign'
  END,
  description = 'For Brazil-based creators with at least 5,000 followers who create original social content, help audiences find trusted providers, and earn through approved posts, viral view milestones, and retained tracked conversions.',
  commission_type = 'hybrid',
  commission_value = 150,
  currency = 'BRL',
  rules = '[
    "Applicants must apply and be approved before posting for paid campaign credit.",
    "Minimum 5,000 followers across active social platforms.",
    "Approved creators post at least two times and no more than four times per month.",
    "Campaign participation is month-to-month.",
    "Original creator content is required for every paid post.",
    "Every campaign call to action must use the assigned link, QR code, or coupon code.",
    "New users who register through the creator tracking method receive a free month on the first paid tier or no Baise service fee on the first eligible customer transaction.",
    "Viral bonus eligibility starts after 10,000 verified views on an approved post.",
    "Retained conversion commissions require three consecutive paid months or qualifying paid service activity tracked through Baise."
  ]'::jsonb,
  payout_rules = '{
    "currency":"BRL",
    "paid_per_post":true,
    "post_payment_amount":150,
    "monthly_posts_min":2,
    "monthly_posts_max":4,
    "viral_threshold_views":10000,
    "viral_bonus_amount":150,
    "retained_conversion_months":3,
    "premium_conversion_commission_amount":150,
    "service_seeker_commission_amount":150,
    "tracking_methods":["link","qr_code","coupon_code"],
    "agreement_term":"month_to_month",
    "payout_frequency":"monthly",
    "review_sla_hours":48
  }'::jsonb,
  content_guidelines = '[
    "Explain the value simply: Baise helps people find trusted service providers, legal support, and medical support without guessing where to look.",
    "Speak in your own voice and create original content for your audience.",
    "Creators from many lanes are welcome, including UGC, home, food, fitness, lifestyle, business, family, local Brazil, and expat content.",
    "Make the audience offer clear: free first month on the first paid tier or no service fee on the first eligible customer transaction.",
    "Disclose the partner relationship when required by platform rules or law.",
    "Do not promise provider availability, outcomes, legal advice, medical advice, or specific pricing outside the platform."
  ]'::jsonb,
  metadata = metadata || jsonb_build_object(
    'market', 'brazil',
    'minimum_followers', 5000,
    'monthly_posts_min', 2,
    'monthly_posts_max', 4,
    'post_payment_brl', 150,
    'viral_threshold_views', 10000,
    'viral_bonus_brl', 150,
    'retained_conversion_months', 3,
    'premium_conversion_commission_brl', 150,
    'service_seeker_commission_brl', 150,
    'audience_offer', 'free_first_month_or_no_first_transaction_service_fee',
    'creator_lanes', ARRAY['ugc', 'homemaker', 'chef', 'fitness', 'lifestyle', 'business', 'local_brazil', 'expat'],
    'tracking_methods', ARRAY['link', 'qr_code', 'coupon_code']
  ),
  updated_at = now()
WHERE campaign_type = 'influencer';

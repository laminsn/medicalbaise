-- Shared Baise taxonomy additions. This migration is intentionally identical
-- across Casa, Medical, and Legal because the apps share one Supabase project.
WITH provider_categories (name_en, name_pt, icon, color, order_index) AS (
  VALUES
    (
      'Medical Testimony & Expert Witness',
      'Perícia Médica e Testemunho Especializado',
      'FileHeart',
      '#0F766E',
      900
    ),
    (
      'Legal Testimony & Expert Opinion',
      'Testemunho Jurídico e Parecer Especializado',
      'Gavel',
      '#4F46E5',
      910
    )
)
INSERT INTO public.service_categories (name_en, name_pt, icon, color, order_index)
SELECT name_en, name_pt, icon, color, order_index
FROM provider_categories proposed
WHERE NOT EXISTS (
  SELECT 1
  FROM public.service_categories existing
  WHERE lower(existing.name_en) = lower(proposed.name_en)
     OR lower(existing.name_pt) = lower(proposed.name_pt)
);

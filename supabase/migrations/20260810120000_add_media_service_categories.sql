-- Shared Baise taxonomy additions. This migration is intentionally identical
-- across Casa, Medical, and Legal because the apps share one Supabase project.
--
-- Media professions requested for Casa Baise. Only Casa lists these in its
-- app catalog (src/lib/constants.ts), so only Casa surfaces them -- provider
-- onboarding filters the shared table against each app's own catalog.
--
-- name_en / name_pt MUST match constants.ts verbatim. filterProviderServiceCategories
-- matches DB rows to the app catalog by NORMALIZED NAME, not by id, so a
-- mismatch here makes the category silently unselectable at signup while still
-- rendering in Browse.
WITH media_categories (name_en, name_pt, icon, color, order_index) AS (
  VALUES
    ('Videographer', 'Videomaker',        'Video',        '#7C3AED', 920),
    ('Photographer', 'Fotógrafo',         'Camera',       '#0EA5E9', 930),
    ('Video Editor', 'Editor de Vídeo',   'Clapperboard', '#E11D74', 940)
)
INSERT INTO public.service_categories (name_en, name_pt, icon, color, order_index)
SELECT proposed.name_en, proposed.name_pt, proposed.icon, proposed.color, proposed.order_index
FROM media_categories AS proposed
WHERE NOT EXISTS (
  SELECT 1 FROM public.service_categories existing
  WHERE lower(existing.name_en) = lower(proposed.name_en)
     OR lower(existing.name_pt) = lower(proposed.name_pt)
);

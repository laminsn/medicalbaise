-- Shared Baise taxonomy addition. This migration is intentionally identical
-- across Casa, Medical, and Legal because the three apps share one Supabase
-- project, so it must run exactly once regardless of which repo applies it.
--
-- Translator is surfaced by Casa and Legal only. Medical does not list it in
-- its own catalog (src/lib/constants.ts), so the row simply goes unused there.
--
-- Speech Therapist was deliberately NOT added. Medical already carries this
-- profession as 'speech-pathology' / 'Speech & Language Pathology' /
-- 'Fonoaudiologia'. A second row named 'Fonoaudiólogo' would be the same
-- Brazilian profession under its practitioner noun rather than its field noun,
-- and the NOT EXISTS guard below matches on exact name, so it would NOT have
-- caught the collision. Two rows means providers split across them and search
-- fragments for both.
--
-- name_en / name_pt MUST match constants.ts verbatim. filterProviderServiceCategories
-- matches DB rows to the app catalog by NORMALIZED NAME, not by id, so a
-- mismatch here makes the category silently unselectable at signup while still
-- rendering in Browse.
WITH translator_category (name_en, name_pt, icon, color, order_index) AS (
  VALUES
    ('Translator', 'Tradutor', 'Languages', '#0891B2', 950)
)
INSERT INTO public.service_categories (name_en, name_pt, icon, color, order_index)
SELECT proposed.name_en, proposed.name_pt, proposed.icon, proposed.color, proposed.order_index
FROM translator_category AS proposed
WHERE NOT EXISTS (
  SELECT 1 FROM public.service_categories existing
  WHERE lower(existing.name_en) = lower(proposed.name_en)
     OR lower(existing.name_pt) = lower(proposed.name_pt)
);

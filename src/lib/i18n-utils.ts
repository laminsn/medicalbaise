import type { i18n as I18nInstance, TFunction } from 'i18next';
import { enUS, es as esLocale, ptBR } from 'date-fns/locale';

type BilingualEntity = {
  id?: string | null;
  name_en?: string | null;
  name_pt?: string | null;
  description_en?: string | null;
  description_pt?: string | null;
};

export const getResolvedLanguage = (i18n: I18nInstance) =>
  (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();

export const isPortuguese = (i18n: I18nInstance) =>
  getResolvedLanguage(i18n).startsWith('pt');

export const isSpanish = (i18n: I18nInstance) =>
  getResolvedLanguage(i18n).startsWith('es');

export const getDateFnsLocale = (i18n: I18nInstance) => {
  if (isPortuguese(i18n)) return ptBR;
  if (isSpanish(i18n)) return esLocale;
  return enUS;
};

export function getLocalizedCategoryName(
  category: BilingualEntity | null | undefined,
  i18n: I18nInstance,
  t: TFunction,
) {
  if (!category) return '';

  if (isPortuguese(i18n)) {
    return category.name_pt || category.name_en || '';
  }

  if (isSpanish(i18n) && category.id) {
    const localized = t(`medicalCategories.${category.id}.name`, '');
    if (localized) return localized;
  }

  return category.name_en || category.name_pt || '';
}

export function getLocalizedCategoryDescription(
  category: BilingualEntity | null | undefined,
  i18n: I18nInstance,
  t: TFunction,
) {
  if (!category) return '';

  if (isPortuguese(i18n)) {
    return category.description_pt || category.description_en || '';
  }

  if (isSpanish(i18n) && category.id) {
    const localized = t(`medicalCategories.${category.id}.description`, '');
    if (localized) return localized;
  }

  return category.description_en || category.description_pt || '';
}

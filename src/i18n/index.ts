import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import pt from './locales/pt.json';
import es from './locales/es.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      pt: { translation: pt },
      es: { translation: es },
    },
    supportedLngs: ['en', 'es', 'pt'],
    load: 'languageOnly',
    fallbackLng: 'pt',
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lng',
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
    },
  });

const HTML_LANG: Record<string, string> = { en: 'en', pt: 'pt-BR', es: 'es' };

function applyHtmlLang(lng?: string) {
  if (typeof document === 'undefined') return;
  const code = (lng || i18n.resolvedLanguage || i18n.language || 'pt').split('-')[0];
  document.documentElement.lang = HTML_LANG[code] || code;
}

applyHtmlLang();
i18n.on('languageChanged', applyHtmlLang);

export default i18n;

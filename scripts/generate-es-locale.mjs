import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LOCALES_DIR = path.join(ROOT, 'src', 'i18n', 'locales');
const EN_PATH = path.join(LOCALES_DIR, 'en.json');
const ES_PATH = path.join(LOCALES_DIR, 'es.json');

const CONCURRENCY = 8;
const MAX_RETRIES = 4;
const RETRY_BASE_MS = 300;

const BRAND_TERMS = [
  'MDBaise',
  'Brasil Base',
  'MedicalBaise',
  'MD Baise',
  'WhatsApp',
  'PayPal',
  'Stripe',
  'Google',
  'PIX',
  'CRM',
  'HIPAA',
  'LGPD',
  'SAMU',
  'Elite',
  'Enterprise',
  'Pro',
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function shouldTranslate(value) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!/[A-Za-z]/.test(trimmed)) return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  return true;
}

function protectSegments(text) {
  let protectedText = text;
  const placeholders = [];
  let index = 0;

  const registerPattern = (regex) => {
    protectedText = protectedText.replace(regex, (match) => {
      const token = `___PLACEHOLDER_${index}___`;
      placeholders.push({ token, value: match });
      index += 1;
      return token;
    });
  };

  registerPattern(/\{\{[^}]+\}\}/g);
  registerPattern(/<[^>]+>/g);
  registerPattern(/https?:\/\/[^\s)]+/g);
  registerPattern(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g);

  for (const term of BRAND_TERMS) {
    const termRegex = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'g');
    registerPattern(termRegex);
  }

  return { protectedText, placeholders };
}

function restoreSegments(text, placeholders) {
  let restored = text;
  for (const { token, value } of placeholders) {
    restored = restored.replaceAll(token, value);
  }
  return restored;
}

async function translateWithGoogle(text) {
  const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Translate request failed: ${response.status}`);
  }
  const data = await response.json();
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error('Unexpected translate payload');
  }
  return data[0].map((part) => part?.[0] ?? '').join('');
}

async function translateText(value) {
  if (!shouldTranslate(value)) {
    return value;
  }

  const { protectedText, placeholders } = protectSegments(value);

  let attempt = 0;
  for (;;) {
    try {
      const translated = await translateWithGoogle(protectedText);
      return restoreSegments(translated, placeholders);
    } catch (error) {
      attempt += 1;
      if (attempt > MAX_RETRIES) {
        throw error;
      }
      await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
    }
  }
}

function walkStrings(value, visitor, currentPath = []) {
  if (typeof value === 'string') {
    return visitor(value, currentPath);
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      walkStrings(item, visitor, [...currentPath, String(index)]),
    );
  }

  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = walkStrings(nested, visitor, [...currentPath, key]);
    }
    return out;
  }

  return value;
}

async function translateLocaleObject(enLocale) {
  const valuesToTranslate = new Set();
  walkStrings(enLocale, (value) => {
    if (shouldTranslate(value)) valuesToTranslate.add(value);
    return value;
  });

  const uniqueStrings = [...valuesToTranslate];
  const translations = new Map();
  let completed = 0;
  let cursor = 0;

  const workers = Array.from({ length: Math.min(CONCURRENCY, uniqueStrings.length) }, async () => {
    for (;;) {
      const idx = cursor;
      cursor += 1;
      if (idx >= uniqueStrings.length) break;
      const source = uniqueStrings[idx];
      const translated = await translateText(source);
      translations.set(source, translated);
      completed += 1;
      if (completed % 100 === 0 || completed === uniqueStrings.length) {
        console.log(`Translated ${completed}/${uniqueStrings.length}`);
      }
    }
  });

  await Promise.all(workers);

  return walkStrings(enLocale, (value) => {
    if (!shouldTranslate(value)) return value;
    return translations.get(value) ?? value;
  });
}

async function main() {
  const enRaw = fs.readFileSync(EN_PATH, 'utf8');
  const enLocale = JSON.parse(enRaw);

  console.log('Generating Spanish locale from en.json...');
  const esLocale = await translateLocaleObject(enLocale);

  fs.writeFileSync(ES_PATH, `${JSON.stringify(esLocale, null, 2)}\n`, 'utf8');
  console.log(`Spanish locale written to ${ES_PATH}`);
}

main().catch((error) => {
  console.error('Failed to generate es locale:', error);
  process.exitCode = 1;
});

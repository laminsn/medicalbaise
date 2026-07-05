import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LOCALES_DIR = path.join(ROOT, 'src', 'i18n', 'locales');
const SOURCE_DIR = path.join(ROOT, 'src');

const LOCALE_LABELS = {
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese',
};

const ALLOWED_IDENTICAL_VALUES = new Set([
  'Baise',
  'Casa Baise',
  'Medical Baise',
  'Legal Baise',
  'Baise Group',
  'Google',
  'Google Pay',
  'Apple Pay',
  'WhatsApp',
  'Pix',
  'PIX',
  'Stripe',
  'PayPal',
  'Pro',
  'Elite',
  'Enterprise',
  'Email',
  'CPF',
  'CNPJ',
  'LGPD',
  'HIPAA',
]);

const SUSPICIOUS_TRANSLATIONS = [
  {
    locale: 'es',
    value: 'Firma',
    hint: 'Use "Suscripción" for subscription, not "Firma".',
  },
  {
    locale: 'es',
    value: 'Apelante',
    hint: 'Use "Recurrente" for recurring, not "Apelante".',
  },
  {
    locale: 'es',
    value: 'ApelanteDesc',
    hint: 'Recurring descriptions should use "recurrente/programado".',
  },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listLocaleCodes() {
  const locales = fs
    .readdirSync(LOCALES_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.basename(file, '.json'))
    .sort();

  for (const required of ['en', 'es', 'pt']) {
    if (!locales.includes(required)) {
      throw new Error(`Missing required locale file: ${required}.json`);
    }
  }

  return ['en', ...locales.filter((locale) => locale !== 'en')];
}

function flattenLeafValues(value, prefix = '', out = new Map()) {
  if (typeof value === 'string') {
    out.set(prefix, value);
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenLeafValues(item, `${prefix}.${index}`, out);
    });
    return out;
  }

  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      const next = prefix ? `${prefix}.${key}` : key;
      flattenLeafValues(nested, next, out);
    }
  }

  return out;
}

function getTopLevelDuplicateKeys(rawJson) {
  const counts = new Map();
  let depth = 0;

  for (let i = 0; i < rawJson.length; i += 1) {
    const ch = rawJson[i];

    if (ch === '"') {
      let j = i + 1;
      let escaped = false;
      let text = '';

      for (; j < rawJson.length; j += 1) {
        const curr = rawJson[j];
        if (escaped) {
          text += curr;
          escaped = false;
          continue;
        }
        if (curr === '\\') {
          escaped = true;
          continue;
        }
        if (curr === '"') break;
        text += curr;
      }

      if (depth === 1) {
        let k = j + 1;
        while (k < rawJson.length && /\s/.test(rawJson[k])) k += 1;
        if (rawJson[k] === ':') counts.set(text, (counts.get(text) ?? 0) + 1);
      }

      i = j;
      continue;
    }

    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
  }

  return [...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key);
}

function listFilesRecursive(dir, extensions, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFilesRecursive(entryPath, extensions, out);
    } else if (extensions.has(path.extname(entry.name))) {
      out.push(entryPath);
    }
  }
  return out;
}

function extractUsedTranslationKeys() {
  const files = listFilesRecursive(SOURCE_DIR, new Set(['.ts', '.tsx']));
  const required = new Set();
  const optional = new Map();
  const tFunctionRegex =
    /\b(?:i18n\.)?t\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*(['"`])((?:\\.|(?!\2).)*)\2)?/g;
  const transComponentRegex = /<Trans[^>]*\bi18nKey\s*=\s*["']([^"']+)["']/g;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');

    tFunctionRegex.lastIndex = 0;
    let match = tFunctionRegex.exec(content);
    while (match) {
      const key = match[1]?.trim();
      const fallback = match[3]?.replace(/\\'/g, "'").replace(/\\"/g, '"');
      if (key && !key.includes('${')) {
        if (fallback) optional.set(key, fallback);
        else required.add(key);
      }
      match = tFunctionRegex.exec(content);
    }

    transComponentRegex.lastIndex = 0;
    let transMatch = transComponentRegex.exec(content);
    while (transMatch) {
      const key = transMatch[1]?.trim();
      if (key && !key.includes('${')) required.add(key);
      transMatch = transComponentRegex.exec(content);
    }
  }

  return { required, optional };
}

function diffMissing(keys, targetKeys) {
  return [...keys].filter((key) => !targetKeys.has(key)).sort();
}

function collectIdenticalTranslations(baseValues, localeValues, locale) {
  if (locale === 'en') return [];

  const findings = [];
  for (const [key, baseValue] of baseValues.entries()) {
    const value = localeValues.get(key);
    if (!value || value !== baseValue) continue;
    if (ALLOWED_IDENTICAL_VALUES.has(value)) continue;
    if (!/[A-Za-z]/.test(value)) continue;
    if (value.length < 4) continue;
    findings.push(`${key}: "${value}"`);
  }
  return findings.sort();
}

function collectSuspicious(locale, values) {
  const findings = [];
  for (const [key, value] of values.entries()) {
    for (const rule of SUSPICIOUS_TRANSLATIONS) {
      if (rule.locale !== locale) continue;
      if (value === rule.value || value.includes(rule.value)) {
        findings.push(`${key}: "${value}" (${rule.hint})`);
      }
    }
  }
  return findings.sort();
}

function collectPlaceholders(value) {
  const matches = value.matchAll(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g);
  return new Set([...matches].map((match) => match[1]));
}

function collectPlaceholderMismatches(baseValues, localeValues, locale) {
  if (locale === 'en') return [];

  const findings = [];
  for (const [key, baseValue] of baseValues.entries()) {
    const value = localeValues.get(key);
    if (!value) continue;

    const basePlaceholders = collectPlaceholders(baseValue);
    const localePlaceholders = collectPlaceholders(value);
    const missing = [...basePlaceholders].filter((placeholder) => !localePlaceholders.has(placeholder));
    const extra = [...localePlaceholders].filter((placeholder) => !basePlaceholders.has(placeholder));

    if (missing.length > 0 || extra.length > 0) {
      findings.push(
        `${key}: missing [${missing.join(', ') || 'none'}], extra [${extra.join(', ') || 'none'}]`
      );
    }
  }
  return findings.sort();
}

function printSection(title, values, max = 35) {
  if (values.length === 0) {
    console.log(`- ${title}: none`);
    return;
  }
  console.log(`- ${title}: ${values.length}`);
  values.slice(0, max).forEach((value) => console.log(`  • ${value}`));
  if (values.length > max) console.log(`  ...and ${values.length - max} more`);
}

function main() {
  const full = process.argv.includes('--full');
  const failOnIdentical = process.argv.includes('--fail-on-identical');
  const max = full ? Number.MAX_SAFE_INTEGER : 35;
  const locales = listLocaleCodes();
  const localeData = locales.map((locale) => {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`);
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      locale,
      filePath,
      raw,
      values: flattenLeafValues(parsed),
      duplicateTopLevelKeys: getTopLevelDuplicateKeys(raw),
    };
  });

  const base = localeData.find((item) => item.locale === 'en');
  const { required, optional } = extractUsedTranslationKeys();
  const allUsed = new Set([...required, ...optional.keys()]);

  console.log('i18n QA report');
  console.log('==============');
  for (const item of localeData) {
    console.log(`- ${LOCALE_LABELS[item.locale] ?? item.locale} leaf keys: ${item.values.size}`);
  }
  console.log(`- Used translation keys in src: ${allUsed.size}`);
  console.log(`  • required: ${required.size}`);
  console.log(`  • with default fallback: ${optional.size}`);

  let hasFailures = false;

  for (const item of localeData) {
    const duplicates = item.duplicateTopLevelKeys;
    if (duplicates.length > 0) hasFailures = true;
    printSection(`Top-level duplicate keys in ${item.locale}.json`, duplicates, max);
  }

  for (const item of localeData) {
    const missingRequired = diffMissing(required, item.values);
    const missingOptional = diffMissing(optional.keys(), item.values);
    if (missingRequired.length > 0 || missingOptional.length > 0) hasFailures = true;
    printSection(`Required used keys missing in ${item.locale}`, missingRequired, max);
    printSection(`Fallback/default keys missing in ${item.locale}`, missingOptional, max);
  }

  for (const item of localeData) {
    if (item.locale === 'en') continue;
    const missingFromLocale = diffMissing(base.values.keys(), item.values);
    const extraInLocale = diffMissing(item.values.keys(), base.values);
    if (missingFromLocale.length > 0 || extraInLocale.length > 0) hasFailures = true;
    printSection(`Keys present in en but missing in ${item.locale}`, missingFromLocale, max);
    printSection(`Keys present in ${item.locale} but missing in en`, extraInLocale, max);

    const suspicious = collectSuspicious(item.locale, item.values);
    if (suspicious.length > 0) hasFailures = true;
    printSection(`Suspicious ${item.locale} translations`, suspicious, max);

    const placeholderMismatches = collectPlaceholderMismatches(base.values, item.values, item.locale);
    if (placeholderMismatches.length > 0) hasFailures = true;
    printSection(`Placeholder mismatches in ${item.locale}`, placeholderMismatches, max);

    const identical = collectIdenticalTranslations(base.values, item.values, item.locale);
    if (failOnIdentical && identical.length > 0) hasFailures = true;
    printSection(`Identical en/${item.locale} values to review`, identical, max);
  }

  if (hasFailures) process.exitCode = 1;
}

main();

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LOCALES_DIR = path.join(ROOT, 'src', 'i18n', 'locales');
const SOURCE_DIR = path.join(ROOT, 'src');
const LOCALES = ['en', 'pt'];

function flattenKeys(value, prefix = '', out = new Set()) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, nested] of Object.entries(value)) {
      const next = prefix ? `${prefix}.${key}` : key;
      out.add(next);
      flattenKeys(nested, next, out);
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
        if (curr === '"') {
          break;
        }
        text += curr;
      }

      if (depth === 1) {
        let k = j + 1;
        while (k < rawJson.length && /\s/.test(rawJson[k])) {
          k += 1;
        }
        if (rawJson[k] === ':') {
          counts.set(text, (counts.get(text) ?? 0) + 1);
        }
      }

      i = j;
      continue;
    }

    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
  }

  return [...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key);
}

function readLocale(locale) {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  return {
    locale,
    filePath,
    raw,
    parsed,
    duplicateTopLevelKeys: getTopLevelDuplicateKeys(raw),
    flattenedKeys: flattenKeys(parsed),
  };
}

function listFilesRecursive(dir, extensions, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFilesRecursive(entryPath, extensions, out);
      continue;
    }
    if (extensions.has(path.extname(entry.name))) {
      out.push(entryPath);
    }
  }
  return out;
}

function extractUsedTranslationKeys() {
  const files = listFilesRecursive(SOURCE_DIR, new Set(['.ts', '.tsx']));
  const requiredKeys = new Set();
  const optionalKeys = new Set();
  const tFunctionRegex = /\b(?:i18n\.)?t\(\s*['"`]([^'"`]+)['"`]\s*(,|\))/g;
  const transComponentRegex = /<Trans[^>]*\bi18nKey\s*=\s*["']([^"']+)["']/g;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');

    tFunctionRegex.lastIndex = 0;
    let tMatch = tFunctionRegex.exec(content);
    while (tMatch) {
      const key = tMatch[1]?.trim();
      const separator = tMatch[2];
      if (key && !key.includes('${')) {
        if (separator === ',') {
          optionalKeys.add(key);
        } else {
          requiredKeys.add(key);
        }
      }
      tMatch = tFunctionRegex.exec(content);
    }

    transComponentRegex.lastIndex = 0;
    let transMatch = transComponentRegex.exec(content);
    while (transMatch) {
      const key = transMatch[1]?.trim();
      if (key && !key.includes('${')) {
        requiredKeys.add(key);
      }
      transMatch = transComponentRegex.exec(content);
    }
  }

  return { requiredKeys, optionalKeys };
}

function diffMissing(sourceKeys, targetKeys) {
  const missing = [];
  for (const key of sourceKeys) {
    if (!targetKeys.has(key)) {
      missing.push(key);
    }
  }
  return missing.sort();
}

function printSection(title, values, max = 30) {
  if (values.length === 0) {
    console.log(`- ${title}: none`);
    return;
  }

  console.log(`- ${title}: ${values.length}`);
  values.slice(0, max).forEach((value) => {
    console.log(`  • ${value}`);
  });
  if (values.length > max) {
    console.log(`  ...and ${values.length - max} more`);
  }
}

function main() {
  const localeData = LOCALES.map(readLocale);
  const [en, pt] = localeData;
  const { requiredKeys, optionalKeys } = extractUsedTranslationKeys();
  const allUsedKeysCount = new Set([...requiredKeys, ...optionalKeys]).size;

  const missingInPt = diffMissing(en.flattenedKeys, pt.flattenedKeys);
  const missingInEn = diffMissing(pt.flattenedKeys, en.flattenedKeys);
  const requiredMissingInEn = diffMissing(requiredKeys, en.flattenedKeys);
  const requiredMissingInPt = diffMissing(requiredKeys, pt.flattenedKeys);
  const optionalMissingInEn = diffMissing(optionalKeys, en.flattenedKeys);
  const optionalMissingInPt = diffMissing(optionalKeys, pt.flattenedKeys);

  console.log('i18n validation report');
  console.log('======================');
  console.log(`- Locale keys (en): ${en.flattenedKeys.size}`);
  console.log(`- Locale keys (pt): ${pt.flattenedKeys.size}`);
  console.log(`- Used translation keys in src: ${allUsedKeysCount}`);
  console.log(`  • required: ${requiredKeys.size}`);
  console.log(`  • optional (fallback/default provided): ${optionalKeys.size}`);

  printSection('Top-level duplicate keys in en.json', en.duplicateTopLevelKeys);
  printSection('Top-level duplicate keys in pt.json', pt.duplicateTopLevelKeys);
  printSection('Keys present in en but missing in pt', missingInPt);
  printSection('Keys present in pt but missing in en', missingInEn);
  printSection('Required used keys missing in en', requiredMissingInEn);
  printSection('Required used keys missing in pt', requiredMissingInPt);
  printSection('Optional used keys missing in en', optionalMissingInEn);
  printSection('Optional used keys missing in pt', optionalMissingInPt);

  const hasFailures =
    missingInPt.length > 0 ||
    missingInEn.length > 0 ||
    requiredMissingInEn.length > 0 ||
    requiredMissingInPt.length > 0;

  if (hasFailures) {
    process.exitCode = 1;
  }
}

main();

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CONSTANTS_PATHS = [
  path.join(ROOT, 'src', 'lib', 'constants.ts'),
  path.join(ROOT, 'src', 'lib', 'constants', 'medical.ts'),
];
const EN_PATH = path.join(ROOT, 'src', 'i18n', 'locales', 'en.json');
const PT_PATH = path.join(ROOT, 'src', 'i18n', 'locales', 'pt.json');
const ES_PATH = path.join(ROOT, 'src', 'i18n', 'locales', 'es.json');

const MAX_RETRIES = 4;
const RETRY_BASE_MS = 300;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function unescapeTsString(value) {
  return value.replace(/\\'/g, "'");
}

function parseMedicalCategories(source) {
  const regex =
    /id:\s*'([^']+)'[\s\S]*?name_en:\s*'((?:\\'|[^'])*)'[\s\S]*?name_pt:\s*'((?:\\'|[^'])*)'[\s\S]*?description_en:\s*'((?:\\'|[^'])*)'[\s\S]*?description_pt:\s*'((?:\\'|[^'])*)'/g;

  const results = [];
  const seen = new Set();

  let match = regex.exec(source);
  while (match) {
    const [, id, nameEnRaw, namePtRaw, descEnRaw, descPtRaw] = match;
    if (!seen.has(id)) {
      seen.add(id);
      results.push({
        id,
        nameEn: unescapeTsString(nameEnRaw),
        namePt: unescapeTsString(namePtRaw),
        descriptionEn: unescapeTsString(descEnRaw),
        descriptionPt: unescapeTsString(descPtRaw),
      });
    }
    match = regex.exec(source);
  }

  return results;
}

async function translateToSpanish(text) {
  const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(
    text,
  )}`;

  let attempt = 0;
  for (;;) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Translate request failed: ${response.status}`);
      }
      const payload = await response.json();
      return payload[0].map((part) => part?.[0] ?? '').join('');
    } catch (error) {
      attempt += 1;
      if (attempt > MAX_RETRIES) throw error;
      await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
    }
  }
}

function ensureObjectPath(root, key) {
  if (!root[key] || typeof root[key] !== 'object' || Array.isArray(root[key])) {
    root[key] = {};
  }
  return root[key];
}

async function main() {
  const mergedById = new Map();
  for (const filePath of CONSTANTS_PATHS) {
    const constantsSource = fs.readFileSync(filePath, 'utf8');
    const categories = parseMedicalCategories(constantsSource);
    for (const category of categories) {
      if (!mergedById.has(category.id)) {
        mergedById.set(category.id, category);
      }
    }
  }
  const categories = [...mergedById.values()];
  if (categories.length === 0) {
    throw new Error('No medical categories found in constants files');
  }

  const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
  const pt = JSON.parse(fs.readFileSync(PT_PATH, 'utf8'));
  const es = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));

  const enNamespace = ensureObjectPath(en, 'medicalCategories');
  const ptNamespace = ensureObjectPath(pt, 'medicalCategories');
  const esNamespace = ensureObjectPath(es, 'medicalCategories');

  for (const category of categories) {
    enNamespace[category.id] = {
      name: category.nameEn,
      description: category.descriptionEn,
    };

    ptNamespace[category.id] = {
      name: category.namePt,
      description: category.descriptionPt,
    };

    const existing = esNamespace[category.id];
    if (existing?.name && existing?.description) {
      continue;
    }

    const [nameEs, descriptionEs] = await Promise.all([
      translateToSpanish(category.nameEn),
      translateToSpanish(category.descriptionEn),
    ]);

    esNamespace[category.id] = {
      name: nameEs,
      description: descriptionEs,
    };
  }

  fs.writeFileSync(EN_PATH, `${JSON.stringify(en, null, 2)}\n`, 'utf8');
  fs.writeFileSync(PT_PATH, `${JSON.stringify(pt, null, 2)}\n`, 'utf8');
  fs.writeFileSync(ES_PATH, `${JSON.stringify(es, null, 2)}\n`, 'utf8');

  console.log(`Synced medical category locales for ${categories.length} categories.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import fs from 'node:fs';
import path from 'node:path';

const ROOTS = [path.join(process.cwd(), 'src'), path.join(process.cwd(), 'api')];
const FORBIDDEN = [
  { pattern: /5\.05\b/, hint: 'baked USD/BRL 5.05' },
  { pattern: /5\.2043\b/, hint: 'baked USD/BRL 5.2043' },
  { pattern: /convertFromUSD/, hint: 'legacy USD conversion helper' },
  { pattern: /navigator\.language\s*\|\|[\s\S]{0,80}currency|LOCALE_CURRENCY_MAP/, hint: 'navigator.language → currency' },
];

const SRC_AMOUNT_FORBIDDEN = [
  { pattern: /R\$20\b/, hint: 'literal R$20' },
  { pattern: /R\$50\b/, hint: 'literal R$50' },
  { pattern: /R\$100\b/, hint: 'literal R$100' },
  { pattern: /R\$150\b/, hint: 'literal R$150' },
  { pattern: /R\$5k/, hint: 'literal R$5k' },
  { pattern: /R\$15k/, hint: 'literal R$15k' },
  { pattern: /R\$40k/, hint: 'literal R$40k' },
  { pattern: /R\$5,000/, hint: 'literal R$5,000' },
  { pattern: /R\$5\.000/, hint: 'literal R$5.000' },
];

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(entryPath, out);
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(entryPath);
  }
  return out;
}

const files = ROOTS.flatMap((root) => (fs.existsSync(root) ? walk(root) : []));
const failures = [];

for (const filePath of files) {
  if (filePath.endsWith('.test.ts')) continue;
  const source = fs.readFileSync(filePath, 'utf8');
  for (const rule of FORBIDDEN) {
    if (rule.pattern.test(source)) {
      failures.push(`${path.relative(process.cwd(), filePath)}: ${rule.hint}`);
    }
  }
  const relative = path.relative(process.cwd(), filePath);
  for (const rule of SRC_AMOUNT_FORBIDDEN) {
    if (rule.pattern.test(source)) {
      failures.push(`${relative}: ${rule.hint}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Baked FX leftovers:');
  failures.forEach((line) => console.error(`  • ${line}`));
  process.exit(1);
}

const I18N_DIR = path.join(process.cwd(), 'src', 'i18n', 'locales');
const I18N_FORBIDDEN = [
  { pattern: /R\$0\b/, hint: 'literal R$0' },
  { pattern: /R\$10\b/, hint: 'literal R$10' },
  { pattern: /R\$20\b/, hint: 'literal R$20' },
  { pattern: /R\$27\b/, hint: 'literal R$27' },
  { pattern: /R\$50\b/, hint: 'literal R$50' },
  { pattern: /R\$99\b/, hint: 'literal R$99' },
  { pattern: /R\$100\b/, hint: 'literal R$100' },
  { pattern: /R\$150\b/, hint: 'literal R$150' },
  { pattern: /R\$499\b/, hint: 'literal R$499' },
  { pattern: /R\$5k/, hint: 'literal R$5k' },
  { pattern: /R\$15k/, hint: 'literal R$15k' },
  { pattern: /R\$40k/, hint: 'literal R$40k' },
  { pattern: /R\$5,000/, hint: 'literal R$5,000' },
  { pattern: /R\$5\.000/, hint: 'literal R$5.000' },
  { pattern: /\(R\$\)/, hint: 'hardcoded (R$) label' },
];

for (const fileName of ['en.json', 'es.json', 'pt.json']) {
  const filePath = path.join(I18N_DIR, fileName);
  const source = fs.readFileSync(filePath, 'utf8');
  for (const rule of I18N_FORBIDDEN) {
    if (rule.pattern.test(source)) {
      failures.push(`${path.relative(process.cwd(), filePath)}: ${rule.hint}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Baked FX leftovers:');
  failures.forEach((line) => console.error(`  • ${line}`));
  process.exit(1);
}

console.log('No baked 5.05 / 5.2043 / convertFromUSD / navigator currency map in src or api.');
console.log('No leftover R$0/R$10/R$20/R$27/R$50/R$99/R$100/R$150/R$499/R$5k/R$15k/R$40k/R$5,000/R$5.000/(R$) in src/i18n.');
console.log('No leftover R$20/R$50/R$100/R$150/R$5k/R$15k/R$40k/R$5,000/R$5.000 display literals in src.');

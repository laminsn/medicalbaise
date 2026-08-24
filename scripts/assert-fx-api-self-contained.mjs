import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const apiPath = path.join(root, 'api', 'fx.ts');
const source = fs.readFileSync(apiPath, 'utf8');

const forbidden = [
  { pattern: /from\s+['"][^'"]*src\//, hint: 'src/ path import' },
  { pattern: /from\s+['"]@\//, hint: '@/ path-alias import' },
  { pattern: /require\(\s*['"][^'"]*src\//, hint: 'src/ require' },
  { pattern: /import\(\s*['"][^'"]*src\//, hint: 'src/ dynamic import' },
  { pattern: /import\(\s*['"]@\//, hint: '@/ dynamic import' },
  { pattern: /5\.05\b/, hint: 'baked USD/BRL rate' },
  { pattern: /5\.2043\b/, hint: 'baked USD/BRL rate' },
];

const failures = [];
for (const rule of forbidden) {
  if (rule.pattern.test(source)) {
    failures.push(rule.hint);
  }
}

if (failures.length > 0) {
  console.error('api/fx.ts is not self-contained:');
  failures.forEach((line) => console.error(`  • ${line}`));
  process.exit(1);
}

const staticImports = [...source.matchAll(/^\s*import\s/gm)];
if (staticImports.length > 0) {
  console.error('api/fx.ts must have zero static imports so Vercel cannot fail at load time.');
  process.exit(1);
}

let loaded;
try {
  loaded = await import(pathToFileURL(apiPath).href);
} catch (error) {
  console.error('api/fx.ts threw at import time:');
  console.error(error);
  process.exit(1);
}

if (typeof loaded.default !== 'function') {
  console.error('api/fx.ts must export a default handler function.');
  process.exit(1);
}

if (typeof loaded.getFxResponse !== 'function') {
  console.error('api/fx.ts must export getFxResponse.');
  process.exit(1);
}

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = body ?? '';
    },
  };
}

const usRes = mockRes();
await loaded.default({ method: 'GET', headers: { 'x-vercel-ip-country': 'US' } }, usRes);
if (usRes.statusCode === 500) {
  console.error(`GET /api/fx must not 500 after load. Got ${usRes.statusCode}: ${usRes.body}`);
  process.exit(1);
}
if (usRes.statusCode !== 200 && usRes.statusCode !== 503) {
  console.error(`GET /api/fx expected 200 or handler 503, got ${usRes.statusCode}: ${usRes.body}`);
  process.exit(1);
}

if (usRes.statusCode === 200) {
  const payload = JSON.parse(usRes.body);
  if (payload.base !== 'BRL') {
    console.error('FX payload base must be BRL');
    process.exit(1);
  }
  if (!(payload.rates?.USD > 0) || !(payload.rates?.NGN > 0)) {
    console.error('FX payload must include live USD and NGN rates from BRL');
    process.exit(1);
  }
  if (payload.suggestedCurrency !== 'USD' || payload.country !== 'US') {
    console.error('US IP must suggest USD and keep default BRL as a suggestion only');
    process.exit(1);
  }
  if (payload.timezone !== 'America/Sao_Paulo' || typeof payload.fetchedAt !== 'string') {
    console.error('FX payload must include America/Sao_Paulo fetchedAt');
    process.exit(1);
  }
  if (typeof payload.delayed !== 'boolean') {
    console.error('FX payload must include delayed');
    process.exit(1);
  }
  if (!payload.checks || typeof payload.checks !== 'object') {
    console.error('FX payload must include checks object');
    process.exit(1);
  }
  const ptaxUsdBrl = payload.checks.ptaxUsdBrl;
  if (ptaxUsdBrl != null && !(ptaxUsdBrl > 0)) {
    console.error('checks.ptaxUsdBrl must be a live positive PTAX USD/BRL or null');
    process.exit(1);
  }

  const ngPayload = await loaded.getFxResponse({ 'x-vercel-ip-country': 'NG' });
  if (ngPayload.suggestedCurrency !== 'NGN') {
    console.error('NG IP must suggest NGN');
    process.exit(1);
  }

  const defaultPayload = await loaded.getFxResponse({});
  if (defaultPayload.suggestedCurrency !== 'BRL') {
    console.error('Missing country must default suggested currency to BRL');
    process.exit(1);
  }

  console.log(`Live FX ${payload.source}: USD=${payload.rates.USD} NGN=${payload.rates.NGN} delayed=${payload.delayed}`);
} else {
  const payload = JSON.parse(usRes.body || '{}');
  if (payload.error !== 'fx_unavailable') {
    console.error('503 body must be the handler fx_unavailable payload, not a load crash');
    process.exit(1);
  }
  console.log('Handler returned 503 fx_unavailable (feeds down). Import-time path still survived.');
}

const postRes = mockRes();
await loaded.default({ method: 'POST', headers: {} }, postRes);
if (postRes.statusCode !== 405) {
  console.error(`POST /api/fx expected 405, got ${postRes.statusCode}`);
  process.exit(1);
}

console.log('api/fx.ts is self-contained and loads without throwing.');

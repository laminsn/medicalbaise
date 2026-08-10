#!/usr/bin/env node
/**
 * The app ships two Content-Security-Policy declarations: a <meta> tag in
 * index.html and an HTTP header in vercel.json. Browsers enforce BOTH, so the
 * effective policy is their intersection -- any source one allows and the other
 * omits is silently blocked, with no build error and no server-side signal.
 *
 * On 2026-08-09 that gap was responsible for three live defects at once: the
 * brand webfont never loaded, every blob: video preview was blocked, and the
 * CEP address lookup failed silently in production while working in dev.
 *
 * This fails the build when the two disagree. frame-ancestors is exempt --
 * browsers ignore it in <meta>, so it belongs to the header alone.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const HEADER_ONLY = new Set(['frame-ancestors']);

const parse = (csp) =>
  Object.fromEntries(
    csp
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const [name, ...sources] = p.split(/\s+/);
        return [name, new Set(sources)];
      })
  );

const fail = (msg) => {
  console.error(`\n  CSP parity check FAILED\n\n${msg}\n`);
  process.exit(1);
};

const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
const headerValue = vercel.headers
  ?.flatMap((h) => h.headers ?? [])
  .find((h) => h.key.toLowerCase() === 'content-security-policy')?.value;
if (!headerValue) fail('  No Content-Security-Policy header found in vercel.json.');

const html = readFileSync(join(root, 'index.html'), 'utf8');
const metaTag = html.match(/<meta http-equiv="Content-Security-Policy"[^>]*>/i)?.[0];
if (!metaTag) fail('  No Content-Security-Policy <meta> found in index.html.');
const metaValue = metaTag.match(/content="([^"]*)"/i)?.[1];
if (!metaValue) fail('  The CSP <meta> tag has no content attribute.');

const header = parse(headerValue);
const meta = parse(metaValue);

const problems = [];
for (const name of new Set([...Object.keys(header), ...Object.keys(meta)])) {
  if (HEADER_ONLY.has(name)) {
    if (name in meta) problems.push(`  ${name}: present in <meta>, where browsers ignore it. Header only.`);
    continue;
  }
  const h = header[name] ?? new Set();
  const m = meta[name] ?? new Set();
  const onlyHeader = [...h].filter((s) => !m.has(s));
  const onlyMeta = [...m].filter((s) => !h.has(s));
  if (!(name in header)) problems.push(`  ${name}: in <meta> but missing from the header -> falls back to default-src, so it is blocked.`);
  else if (!(name in meta)) problems.push(`  ${name}: in the header but missing from <meta> -> blocked by the intersection.`);
  else if (onlyHeader.length || onlyMeta.length) {
    problems.push(
      `  ${name}:\n` +
        (onlyHeader.length ? `      header only: ${onlyHeader.join(' ')}\n` : '') +
        (onlyMeta.length ? `      <meta> only: ${onlyMeta.join(' ')}` : '')
    );
  }
}

if (problems.length) {
  fail(
    problems.join('\n') +
      '\n\n  Every source above is permitted by one policy and refused by the other,\n' +
      '  so the browser blocks it. Make the two agree in vercel.json and index.html.'
  );
}

console.log('  CSP parity: header and <meta> agree on all directives.');

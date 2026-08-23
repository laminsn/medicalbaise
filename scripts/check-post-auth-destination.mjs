/**
 * Contract checks for last-prompt post-login routing.
 * Run: node --experimental-strip-types scripts/check-post-auth-destination.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const store = new Map();
const sessionStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => { store.set(String(key), String(value)); },
  removeItem: (key) => { store.delete(key); },
};

globalThis.window = { sessionStorage, location: { origin: 'https://www.mdbaise.com' } };

const src = readFileSync(join(root, 'src/lib/postAuthDestination.ts'), 'utf8')
  .replace("import { sanitizeRedirectUrl } from '@/lib/security';", "import { sanitizeRedirectUrl } from './security.ts';");
const tmp = join(root, '.tmp-post-auth-check');
mkdirSync(tmp, { recursive: true });
writeFileSync(join(tmp, 'security.ts'), `
export function sanitizeRedirectUrl(url) {
  if (!url) return '/';
  const raw = String(url);
  if (raw.startsWith('/') && !raw.startsWith('//') && !raw.includes('\\\\')) return raw;
  return '/';
}
`);
writeFileSync(join(tmp, 'postAuthDestination.ts'), src);

const dest = await import(join(tmp, 'postAuthDestination.ts'));

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

store.clear();
assertEqual(dest.resolvePostAuthPath(''), '/feed', 'default missing prompt');
assertEqual(dest.resolvePostAuthPath('?lng=pt'), '/feed?lng=pt', 'default keeps locale');

dest.persistLastPrompt('Get Money');
assertEqual(store.get('baise_last_prompt'), 'get-money', 'stores Get Money canonically');
assertEqual(dest.resolvePostAuthPath(''), '/payouts', 'stored Get Money → /payouts');
dest.clearPersistedLastPrompt();

dest.persistLastPrompt('Get Things Done');
assertEqual(dest.resolvePostAuthPath('?lng=es'), '/post-job?lng=es', 'stored Get Things Done → /post-job');
dest.clearPersistedLastPrompt();

dest.persistLastPrompt('Share');
assertEqual(dest.resolvePostAuthPath(''), '/feed', 'stored Share → /feed');
dest.clearPersistedLastPrompt();

assertEqual(dest.resolvePostAuthPath('?prompt=get-money'), '/payouts', 'query Get Money');
assertEqual(dest.persistLastPromptFromPath('/post-job'), 'get-things-done', 'path post-job');
assertEqual(dest.persistLastPromptFromPath('/payouts'), 'get-money', 'path payouts');
assertEqual(dest.persistLastPromptFromPath('/feed'), 'share', 'path feed');

store.clear();
dest.persistLastPrompt('get-money');
dest.persistSignupRole('provider');
const callback = dest.buildAuthCallbackUrl('https://www.mdbaise.com', '?role=provider&lng=pt');
assertEqual(
  callback,
  'https://www.mdbaise.com/auth/callback?role=provider&prompt=get-money&lng=pt',
  'Google redirect keeps prompt, role, locale',
);

store.clear();
assertEqual(dest.resolvePostAuthPath('?redirect=/doctor/abc'), '/doctor/abc', 'explicit redirect still wins');
assertEqual(dest.resolvePostAuthPath('?redirect=//evil.example'), '/feed', 'protocol-relative rejected');

rmSync(tmp, { recursive: true, force: true });
console.log('postAuthDestination last-prompt checks passed');

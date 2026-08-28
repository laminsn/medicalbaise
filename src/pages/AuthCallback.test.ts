import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'AuthCallback.tsx'),
  'utf8',
);

describe('AuthCallback first-frame markup', () => {
  it('includes the existing /favicon.svg logo, lime spinner, forced dark, and exact English fallback', () => {
    assert.match(source, /src=["']\/favicon\.svg["']/);
    assert.match(source, /w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg/);
    assert.match(source, /Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary"/);
    assert.match(source, /className="dark min-h-screen flex items-center justify-center bg-background"/);
    assert.match(source, /t\(['"]auth\.completingSignIn['"], ['"]Completing sign in\.\.\.['"]\)/);
    assert.equal(source.includes('Completing sign-in'), false);
  });
});

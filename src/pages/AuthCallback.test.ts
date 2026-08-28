import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'AuthCallback.tsx'),
  'utf8',
);

const firstFrame = source.slice(source.lastIndexOf('return ('));

describe('AuthCallback first-frame markup', () => {
  it('includes logo, lime LoaderCircle, forced dark, and locked English copy', () => {
    assert.match(firstFrame, /src=["']\/favicon\.svg["']/);
    assert.match(firstFrame, /w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg/);
    assert.match(firstFrame, /LoaderCircle className="w-12 h-12 animate-spin mx-auto mb-4 text-\[#F5FF3D\]"/);
    assert.match(firstFrame, /className="dark min-h-screen flex items-center justify-center bg-background"/);
    assert.match(firstFrame, />Completing sign in\.\.\.</);
    assert.equal(firstFrame.includes('text-primary'), false);
    assert.equal(firstFrame.includes('Completing sign-in'), false);
    assert.equal(firstFrame.includes('auth.completingSignIn'), false);
    assert.equal(firstFrame.includes('Concluindo login'), false);
    assert.equal(firstFrame.includes('Completando inicio'), false);
  });
});

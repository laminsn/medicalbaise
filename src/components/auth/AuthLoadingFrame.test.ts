import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

function readSource(relativePath: string) {
  return readFileSync(join(here, relativePath), 'utf8');
}

const frame = readSource('AuthLoadingFrame.tsx');

describe('AuthLoadingFrame locked mark', () => {
  it('is dark + /favicon.svg + lime LoaderCircle + exact English copy', () => {
    assert.match(frame, /src=["']\/favicon\.svg["']/);
    assert.match(frame, /w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg/);
    assert.match(frame, /LoaderCircle className="w-12 h-12 animate-spin mx-auto mb-4 text-\[#F5FF3D\]"/);
    assert.match(frame, /className="dark min-h-screen flex items-center justify-center bg-background"/);
    assert.match(frame, /Completing sign in\.\.\./);
    assert.equal(frame.includes('text-primary'), false);
    assert.equal(frame.includes('Completing sign-in'), false);
    assert.equal(frame.includes('baise-logo.svg'), false);
  });
});

describe('loading gates reuse AuthLoadingFrame', () => {
  it('AuthCallback, PageLoader, ProtectedRoute, and /auth session gate use the shared frame', () => {
    const authCallback = readSource('../../pages/AuthCallback.tsx');
    const app = readSource('../../App.tsx');
    const protectedRoute = readSource('ProtectedRoute.tsx');
    const auth = readSource('../../pages/Auth.tsx');

    assert.match(authCallback, /<AuthLoadingFrame\s*\/>/);
    assert.equal(authCallback.includes('LoaderCircle'), false);
    assert.equal(authCallback.includes('Loader2'), false);

    assert.match(app, /<AuthLoadingFrame\s*\/>/);
    assert.equal(app.includes('Loading...'), false);

    assert.match(protectedRoute, /<AuthLoadingFrame\s*\/>/);
    assert.equal(protectedRoute.includes('Loader2'), false);

    assert.match(auth, /<AuthLoadingFrame\s*\/>/);
  });
});

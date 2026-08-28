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
  it('reuses AuthLoadingFrame instead of a spinner-only return', () => {
    assert.match(source, /<AuthLoadingFrame\s*\/>/);
    assert.equal(source.includes('LoaderCircle'), false);
    assert.equal(source.includes('Loader2'), false);
    assert.equal(source.includes('text-primary'), false);
    assert.equal(source.includes('baise-logo.svg'), false);
  });
});

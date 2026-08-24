import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatDisplayPriceFromBrl, numberLocaleFromLanguage } from './currencyFormat.ts';
import { suggestCurrencyForCountry } from './fx/types.ts';

describe('BRL-default display FX', () => {
  it('defaults to BRL and does not convert', () => {
    const formatted = formatDisplayPriceFromBrl(99, { language: 'en' });
    assert.match(formatted, /99/);
    assert.equal(formatted.includes('·'), false);
    assert.match(formatted, /R\$/);
    assert.equal(formatted.includes('≈'), false);
  });

  it('keeps the same BRL amount when only language changes', () => {
    const rates = { USD: 0.2, NGN: 300 };
    const en = formatDisplayPriceFromBrl(99, { currency: 'BRL', language: 'en', rates });
    const pt = formatDisplayPriceFromBrl(99, { currency: 'BRL', language: 'pt', rates });
    const es = formatDisplayPriceFromBrl(99, { currency: 'BRL', language: 'es', rates });

    assert.match(en, /99/);
    assert.match(pt, /99/);
    assert.match(es, /99/);
    assert.equal(en.includes('· ≈'), false);
    assert.equal(pt.includes('· ≈'), false);
    assert.equal(es.includes('· ≈'), false);
  });

  it('shows the BRL original when display currency is USD', () => {
    const formatted = formatDisplayPriceFromBrl(99, {
      currency: 'USD',
      language: 'en',
      rates: { USD: 0.2, NGN: 300 },
    });
    assert.match(formatted, /R\$/);
    assert.match(formatted, /99/);
    assert.match(formatted, /· ≈/);
    assert.match(formatted, /\$19\.80|US\$19\.80/);
  });

  it('uses language for number format, not the selected currency', () => {
    assert.equal(numberLocaleFromLanguage('en'), 'en-US');
    assert.equal(numberLocaleFromLanguage('pt'), 'pt-BR');
    assert.equal(numberLocaleFromLanguage('es'), 'es');

    const usdPt = formatDisplayPriceFromBrl(99, {
      currency: 'USD',
      language: 'pt',
      rates: { USD: 0.2, NGN: 300 },
    });
    assert.match(usdPt, /R\$/);
    assert.match(usdPt, /· ≈/);
  });

  it('suggests USD/NGN from IP country but never forces a default away from BRL', () => {
    assert.equal(suggestCurrencyForCountry('US'), 'USD');
    assert.equal(suggestCurrencyForCountry('NG'), 'NGN');
    assert.equal(suggestCurrencyForCountry('BR'), 'BRL');
    assert.equal(suggestCurrencyForCountry(null), 'BRL');
  });
});

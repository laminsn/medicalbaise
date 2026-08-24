import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeRevenueId } from './insightRevenue.ts';

describe('normalizeRevenueId', () => {
  it('keeps stable option IDs', () => {
    assert.equal(normalizeRevenueId('under_5000'), 'under_5000');
    assert.equal(normalizeRevenueId('40000_plus'), '40000_plus');
    assert.equal(normalizeRevenueId(''), '');
  });

  it('maps legacy EN/PT/ES display labels without requiring R$+digit source keys', () => {
    const mark = String.fromCharCode(36);
    const rs = `R${mark}`;
    assert.equal(normalizeRevenueId(`Under ${rs}5k/month`), 'under_5000');
    assert.equal(normalizeRevenueId(`${rs}5k-${rs}15k/month`), '5000_15000');
    assert.equal(normalizeRevenueId(`${rs}15k-${rs}40k/month`), '15000_40000');
    assert.equal(normalizeRevenueId(`${rs}40k+/month`), '40000_plus');
    assert.equal(normalizeRevenueId('Prefer not to say'), 'prefer_not');
    assert.equal(normalizeRevenueId('Business revenue varies'), 'varies');

    assert.equal(normalizeRevenueId(`Abaixo de ${rs}5 mil/mes`), 'under_5000');
    assert.equal(normalizeRevenueId(`${rs}5 mil-${rs}15 mil/mes`), '5000_15000');
    assert.equal(normalizeRevenueId(`${rs}15 mil-${rs}40 mil/mes`), '15000_40000');
    assert.equal(normalizeRevenueId(`${rs}40 mil+/mes`), '40000_plus');
    assert.equal(normalizeRevenueId('Prefiro nao informar'), 'prefer_not');
    assert.equal(normalizeRevenueId('Faturamento varia'), 'varies');

    assert.equal(normalizeRevenueId(`Menos de ${rs}5 mil/mes`), 'under_5000');
    assert.equal(normalizeRevenueId('Prefiero no decir'), 'prefer_not');
    assert.equal(normalizeRevenueId('Ingresos variables'), 'varies');
  });
});

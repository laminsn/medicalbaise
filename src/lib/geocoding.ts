/**
 * Geocoding utilities — Brazilian CEP lookup + address → lat/lng.
 *
 * Two free public APIs are used:
 *   - ViaCEP        (https://viacep.com.br)  — CEP → {street, neighborhood, city, state}
 *   - Nominatim     (https://nominatim.openstreetmap.org) — address text → lat/lng
 *
 * Both are best-effort: failures return null and never throw to the caller.
 * Nominatim usage policy requires a real User-Agent and asks callers to keep
 * traffic modest (≤1 req/sec). For high-volume production, swap Nominatim for
 * a paid provider (Mapbox, Google Geocoding, OpenCage).
 */

const VIACEP_BASE = 'https://viacep.com.br/ws';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const APP_USER_AGENT = 'BaiseGroup/1.0 (https://casabaise.com)';

export interface CepLookupResult {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
}

export interface AddressInput {
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
  country?: string;
}

const CEP_DIGIT_RE = /^\d{8}$/;

/** Strip non-digits and validate as 8-digit Brazilian CEP. */
function normalizeCep(cep: string): string | null {
  const digits = cep.replace(/\D/g, '');
  return CEP_DIGIT_RE.test(digits) ? digits : null;
}

/**
 * Look up a Brazilian CEP via ViaCEP.
 * Returns null on invalid input, network failure, or CEP-not-found.
 * Never throws.
 */
export async function lookupCep(rawCep: string): Promise<CepLookupResult | null> {
  const cep = normalizeCep(rawCep);
  if (!cep) return null;
  try {
    const res = await fetch(`${VIACEP_BASE}/${cep}/json/`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      cep?: string;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
      erro?: boolean;
    };
    if (data?.erro) return null;
    return {
      cep: data.cep || cep,
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    };
  } catch {
    return null;
  }
}

/**
 * Geocode a structured Brazilian address to lat/lng via Nominatim.
 * Returns null on insufficient input, network failure, or no result.
 * Never throws.
 */
export async function geocodeAddress(input: AddressInput): Promise<GeocodeResult | null> {
  const parts = [
    [input.street, input.number].filter(Boolean).join(', '),
    input.neighborhood,
    input.city,
    input.state,
    input.cep,
    input.country || 'Brasil',
  ]
    .map((p) => (p ?? '').toString().trim())
    .filter(Boolean);

  if (parts.length < 2) return null;
  const query = parts.join(', ');

  try {
    const url = new URL(`${NOMINATIM_BASE}/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'br');
    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': APP_USER_AGENT,
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const first = data?.[0];
    if (!first?.lat || !first?.lon) return null;
    const lat = Number.parseFloat(first.lat);
    const lng = Number.parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

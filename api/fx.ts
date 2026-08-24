/**
 * Self-contained Vercel serverless handler for GET /api/fx.
 *
 * Do not import from src/ or @/ — Vercel compiles this file in isolation, and
 * those path-alias imports crash the function at load time (FUNCTION_INVOCATION_FAILED
 * instead of the handler's 503). Casa www works because its api/fx.ts is self-contained.
 *
 * Contract: BRL mid-market USD+NGN, 15–60m cache, BCB PTAX check, >1.5% last-good + delayed.
 * Suggest USD/NGN from x-vercel-ip-country; default stays BRL. No baked fallback rates.
 */

type NodeRes = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
};

type NodeReq = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type DisplayCurrency = 'BRL' | 'USD' | 'NGN';

type FxRates = {
  USD: number;
  NGN: number;
};

type FxPayload = {
  base: 'BRL';
  rates: FxRates;
  fetchedAt: string;
  timezone: 'America/Sao_Paulo';
  source: string;
  delayed: boolean;
  suggestedCurrency: DisplayCurrency;
  country: string | null;
};

type LastGood = {
  rates: FxRates;
  fetchedAt: string;
  source: string;
};

type Cached = {
  expiresAt: number;
  payload: Omit<FxPayload, 'suggestedCurrency' | 'country'>;
};

const FX_DRIFT_THRESHOLD = 0.015;
const FX_CACHE_TTL_MS = 30 * 60 * 1000;
const SAO_PAULO_TZ = 'America/Sao_Paulo' as const;
const LAST_GOOD_PATH = '/tmp/baise-fx-last-good.json';
const FETCH_TIMEOUT_MS = 8000;
const CACHE_CONTROL = 'public, s-maxage=1800, stale-while-revalidate=3600';

let memoryCache: Cached | null = null;
let lastGood: LastGood | null = null;
let lastGoodHydrated = false;

function suggestCurrencyForCountry(country: string | null | undefined): DisplayCurrency {
  const code = (country || '').trim().toUpperCase();
  if (code === 'US') return 'USD';
  if (code === 'NG') return 'NGN';
  return 'BRL';
}

function readCountryFromHeaders(headers: Record<string, string | string[] | undefined>): string | null {
  const read = (name: string) => {
    const value = headers[name] ?? headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
  };
  const country = read('x-vercel-ip-country') || read('cf-ipcountry') || read('x-country');
  return country ? country.toUpperCase() : null;
}

function saoPauloOffset(date: Date): string {
  const utc = date.toLocaleString('en-US', { timeZone: 'UTC' });
  const local = date.toLocaleString('en-US', { timeZone: SAO_PAULO_TZ });
  const diffHours = Math.round((new Date(local).getTime() - new Date(utc).getTime()) / 3_600_000);
  const sign = diffHours >= 0 ? '+' : '-';
  const abs = Math.abs(diffHours).toString().padStart(2, '0');
  return `${sign}${abs}:00`;
}

function formatSaoPauloTimestamp(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SAO_PAULO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const read = (type: string) => parts.find((part) => part.type === type)?.value || '00';
  return `${read('year')}-${read('month')}-${read('day')}T${read('hour')}:${read('minute')}:${read('second')}${saoPauloOffset(date)}`;
}

async function loadLastGood(): Promise<LastGood | null> {
  if (lastGoodHydrated) return lastGood;
  lastGoodHydrated = true;
  try {
    const fs = await import('node:fs');
    const raw = fs.readFileSync(LAST_GOOD_PATH, 'utf8');
    const parsed = JSON.parse(raw) as LastGood;
    if (
      parsed &&
      typeof parsed.rates?.USD === 'number' &&
      typeof parsed.rates?.NGN === 'number' &&
      parsed.rates.USD > 0 &&
      parsed.rates.NGN > 0
    ) {
      lastGood = parsed;
    }
  } catch {
    // No last-good yet, or fs unavailable — never invent a baked fallback rate.
  }
  return lastGood;
}

async function persistLastGood(value: LastGood) {
  lastGood = value;
  lastGoodHydrated = true;
  try {
    const fs = await import('node:fs');
    const path = await import('node:path');
    fs.mkdirSync(path.dirname(LAST_GOOD_PATH), { recursive: true });
    fs.writeFileSync(LAST_GOOD_PATH, JSON.stringify(value));
  } catch {
    // /tmp may be unavailable; in-memory last-good still applies.
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function asPositiveRate(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

async function fetchOpenErApiBrl(): Promise<{ rates: FxRates; source: string } | null> {
  try {
    const json = (await fetchJson('https://open.er-api.com/v6/latest/BRL')) as {
      result?: string;
      rates?: Record<string, number>;
    };
    if (json?.result !== 'success' || !json.rates) return null;
    const USD = asPositiveRate(json.rates.USD);
    const NGN = asPositiveRate(json.rates.NGN);
    if (!USD || !NGN) return null;
    return { rates: { USD, NGN }, source: 'open.er-api.com' };
  } catch {
    return null;
  }
}

async function fetchFawazBrl(): Promise<{ rates: FxRates; source: string } | null> {
  try {
    const json = (await fetchJson(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/brl.min.json',
    )) as { brl?: Record<string, number> };
    const USD = asPositiveRate(json?.brl?.usd);
    const NGN = asPositiveRate(json?.brl?.ngn);
    if (!USD || !NGN) return null;
    return { rates: { USD, NGN }, source: 'fawazahmed0' };
  } catch {
    return null;
  }
}

async function fetchBcbPtaxUsdPerBrl(): Promise<number | null> {
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (date: Date) => {
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const yyyy = date.getUTCFullYear();
    return `${mm}-${dd}-${yyyy}`;
  };

  const url =
    'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/' +
    `CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)` +
    `?@dataInicial='${fmt(start)}'&@dataFinalCotacao='${fmt(end)}'` +
    '&$top=1&$orderby=dataHoraCotacao%20desc&$format=json';

  try {
    const json = (await fetchJson(url)) as {
      value?: Array<{ cotacaoCompra?: number; cotacaoVenda?: number }>;
    };
    const row = json.value?.[0];
    const compra = asPositiveRate(row?.cotacaoCompra);
    const venda = asPositiveRate(row?.cotacaoVenda);
    if (!compra && !venda) return null;
    const usdBrl = compra && venda ? (compra + venda) / 2 : ((compra || venda) as number);
    return 1 / usdBrl;
  } catch {
    return null;
  }
}

function drifted(a: number, b: number): boolean {
  if (!(a > 0) || !(b > 0)) return true;
  return Math.abs(a - b) / b > FX_DRIFT_THRESHOLD;
}

async function buildFxSnapshot(): Promise<Omit<FxPayload, 'suggestedCurrency' | 'country'>> {
  if (memoryCache && memoryCache.expiresAt > Date.now()) {
    return memoryCache.payload;
  }

  await loadLastGood();

  const primary = (await fetchOpenErApiBrl()) || (await fetchFawazBrl());
  if (!primary) {
    if (lastGood) {
      return {
        base: 'BRL',
        rates: lastGood.rates,
        fetchedAt: lastGood.fetchedAt,
        timezone: SAO_PAULO_TZ,
        source: lastGood.source,
        delayed: true,
      };
    }
    throw new Error('No live FX feed and no last-good rate');
  }

  const secondary =
    primary.source === 'open.er-api.com' ? await fetchFawazBrl() : await fetchOpenErApiBrl();
  const ptaxUsd = await fetchBcbPtaxUsdPerBrl();
  const ngnCheck = secondary?.rates.NGN || null;

  const usdDrift = ptaxUsd ? drifted(primary.rates.USD, ptaxUsd) : false;
  const ngnDrift = ngnCheck ? drifted(primary.rates.NGN, ngnCheck) : false;
  const delayed = usdDrift || ngnDrift;

  if (delayed && lastGood) {
    const payload: Omit<FxPayload, 'suggestedCurrency' | 'country'> = {
      base: 'BRL',
      rates: lastGood.rates,
      fetchedAt: lastGood.fetchedAt,
      timezone: SAO_PAULO_TZ,
      source: lastGood.source,
      delayed: true,
    };
    memoryCache = { expiresAt: Date.now() + FX_CACHE_TTL_MS, payload };
    return payload;
  }

  const fetchedAt = formatSaoPauloTimestamp();
  const payload: Omit<FxPayload, 'suggestedCurrency' | 'country'> = {
    base: 'BRL',
    rates: primary.rates,
    fetchedAt,
    timezone: SAO_PAULO_TZ,
    source: primary.source,
    delayed,
  };

  if (!delayed) {
    await persistLastGood({ rates: primary.rates, fetchedAt, source: primary.source });
  }

  memoryCache = { expiresAt: Date.now() + FX_CACHE_TTL_MS, payload };
  return payload;
}

export async function getFxResponse(
  headers: Record<string, string | string[] | undefined>,
): Promise<FxPayload> {
  const snapshot = await buildFxSnapshot();
  const country = readCountryFromHeaders(headers);
  return {
    ...snapshot,
    country,
    suggestedCurrency: suggestCurrencyForCountry(country),
  };
}

export default async function handler(req: NodeReq, res: NodeRes) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method Not Allowed');
    return;
  }

  try {
    const payload = await getFxResponse(req.headers || {});
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', CACHE_CONTROL);
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify(payload));
  } catch {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'fx_unavailable', delayed: true }));
  }
}

/**
 * MD Baise client invitation helpers.
 * This app mints app_key=medical only. Never coerce to casa.
 */

import { sanitizeRedirectUrl } from './security';

export const CLIENT_INVITE_APP_KEY = 'medical' as const;

export const CLIENT_INVITE_APP_ALLOWLIST = [
  'casa',
  'medical',
  'legal',
  'tech',
  'influencer',
] as const;

export type ClientInviteAppKey = (typeof CLIENT_INVITE_APP_ALLOWLIST)[number];
export type ClientInviteChannel = 'email' | 'whatsapp' | 'sms' | 'copy';

export const CLIENT_INVITE_WELCOME_COPY =
  'Invite clients to your services and the Baise app community.';

/** Path-scoped cookie so /auth/callback does not receive the raw token. */
export const CLIENT_INVITE_COOKIE = 'baise_invite';
/** Auth round-trip only. Not the 7-day invite expiry. */
export const CLIENT_INVITE_COOKIE_MAX_AGE_SEC = 15 * 60;

const TOKEN_RE = /^[A-Za-z0-9_-]{32,128}$/;
const INVITE_PATH_RE = /^\/invite\/([A-Za-z0-9_-]{32,128})\/?$/;

export function isAllowedClientInviteAppKey(value: unknown): value is ClientInviteAppKey {
  return typeof value === 'string' && (CLIENT_INVITE_APP_ALLOWLIST as readonly string[]).includes(value);
}

/** Fail-closed. Blank, null, or unknown keys are rejected. Never falls back to casa. */
export function medicalInviteAppKey(): typeof CLIENT_INVITE_APP_KEY {
  return CLIENT_INVITE_APP_KEY;
}

export function isWellFormedInviteToken(token: unknown): token is string {
  return typeof token === 'string' && TOKEN_RE.test(token);
}

/** Welcome URL is current-origin only. Token is the path — never a sequential id. */
export function buildClientInviteWelcomeUrl(rawToken: string, origin = window.location.origin): string {
  if (!isWellFormedInviteToken(rawToken)) {
    throw new Error('INVALID_TOKEN');
  }
  const parsed = new URL(origin);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('INVALID_ORIGIN');
  }
  return `${parsed.origin}/invite/${encodeURIComponent(rawToken)}`;
}

/**
 * Post-auth path for an invite. Rejects absolute URLs, protocol-relative
 * hosts, and any destination that is not /invite/:token on this origin.
 */
export function inviteResumePath(token: string): string {
  if (!isWellFormedInviteToken(token)) return '/customer-dashboard';
  return sanitizeInviteReturn(`/invite/${encodeURIComponent(token)}`);
}

/** Same-origin invite path only. sanitizeRedirectUrl still applies. */
export function sanitizeInviteReturn(raw: string | null | undefined): string {
  if (!raw) return '/customer-dashboard';
  const sanitized = sanitizeRedirectUrl(raw);
  const match = sanitized.match(INVITE_PATH_RE);
  return match ? `/invite/${match[1]}` : '/customer-dashboard';
}

export function persistInviteToken(token: string): void {
  if (typeof document === 'undefined' || !isWellFormedInviteToken(token)) return;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CLIENT_INVITE_COOKIE}=${encodeURIComponent(token)}; Path=/invite; Max-Age=${CLIENT_INVITE_COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

export function readInviteCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=');
    if (name !== CLIENT_INVITE_COOKIE) continue;
    const value = decodeURIComponent(rest.join('='));
    return isWellFormedInviteToken(value) ? value : null;
  }
  return null;
}

export function clearPersistedInviteToken(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${CLIENT_INVITE_COOKIE}=; Path=/invite; Max-Age=0; SameSite=Lax`;
}

/** Re-read :token, ?token=, then the Path=/invite cookie. Never localStorage. */
export function readInviteTokenFromLocation(input: {
  pathToken?: string | null;
  pathname?: string;
  search?: string;
}): string | null {
  const candidates = [input.pathToken, null, null] as Array<string | null>;
  if (input.pathToken) {
    try {
      candidates[0] = decodeURIComponent(input.pathToken);
    } catch {
      candidates[0] = input.pathToken;
    }
  }
  const pathname = input.pathname || '';
  const pathMatch = pathname.match(/^\/invite\/([^/?#]+)/);
  if (pathMatch) {
    try {
      candidates[1] = decodeURIComponent(pathMatch[1]);
    } catch {
      candidates[1] = pathMatch[1];
    }
  }
  const rawSearch = input.search || '';
  const params = new URLSearchParams(rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch);
  candidates[2] = params.get('token');

  for (const value of candidates) {
    if (isWellFormedInviteToken(value)) return value;
  }
  return readInviteCookie();
}

/** Google redirectTo carries a sanitized invite return so the hop is not storage-only. */
export function buildGoogleInviteRedirectTo(
  token: string | null | undefined,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
): string {
  const callback = `${origin}/auth/callback`;
  if (!isWellFormedInviteToken(token)) return callback;
  const resume = sanitizeInviteReturn(inviteResumePath(token));
  if (!INVITE_PATH_RE.test(resume)) return callback;
  const next = encodeURIComponent(resume);
  return `${callback}?next=${next}&token=${encodeURIComponent(token)}`;
}

export function resumePathAfterAuth(next: string | null | undefined, token: string | null | undefined): string {
  if (isWellFormedInviteToken(token)) return sanitizeInviteReturn(inviteResumePath(token));
  if (!next) return '/';
  const sanitized = sanitizeInviteReturn(next);
  return sanitized.startsWith('/invite/') ? sanitized : '/';
}

/** Share body is welcome copy + link only. No other clients' PII. */
export function buildClientInviteShareBody(welcomeUrl: string): string {
  return `${CLIENT_INVITE_WELCOME_COPY}\n${welcomeUrl}`;
}

export function buildClientInviteShareHref(channel: Exclude<ClientInviteChannel, 'copy'>, welcomeUrl: string): string {
  const body = buildClientInviteShareBody(welcomeUrl);
  if (channel === 'email') {
    return `mailto:?subject=${encodeURIComponent('Your MD Baise invitation')}&body=${encodeURIComponent(body)}`;
  }
  if (channel === 'whatsapp') {
    return `https://wa.me/?text=${encodeURIComponent(body)}`;
  }
  return `sms:?body=${encodeURIComponent(body)}`;
}

export type PreviewClientInvite = {
  ok: boolean;
  error?: string;
  provider_name?: string;
  expires_at?: string;
  services?: Array<{ title: string; amount: number | null; currency: string }>;
};

export type RedeemedInviteService = {
  id: string;
  title: string;
  amount: number | null;
  currency: string;
  approval_status: 'proposed' | 'approved' | 'declined';
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed';
};

export type RedeemClientInvite = {
  ok: boolean;
  error?: string;
  invite_id?: string;
  provider_id?: string;
  provider_name?: string;
  app_key?: string;
  status?: string;
  services?: RedeemedInviteService[];
};

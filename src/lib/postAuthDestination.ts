import { sanitizeRedirectUrl } from '@/lib/security';

/** First destination after login/signup for both seekers and providers. */
export const SOCIAL_FEED_PATH = '/feed';

export const SIGNUP_ROLE_STORAGE_KEY = 'baise_signup_role';

const LOCALE_QUERY_KEYS = ['lng', 'locale', 'lang'] as const;
const AUTH_PATH_PREFIXES = ['/auth', '/login', '/signin', '/sign-in', '/log-in', '/signup'];

export type SignupIntent = 'provider' | 'client';

function parseSearch(search = ''): URLSearchParams {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(raw);
}

function normalizeRole(value: string | null | undefined): SignupIntent | null {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'provider' || raw === 'service' || raw === 'pro') return 'provider';
  if (raw === 'client' || raw === 'customer' || raw === 'seeker') return 'client';
  return null;
}

export function readPersistedSignupRole(): SignupIntent | null {
  if (typeof window === 'undefined') return null;
  try {
    return normalizeRole(window.sessionStorage.getItem(SIGNUP_ROLE_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Persist provider intent across Google OAuth. Do not overwrite with client unless explicit. */
export function persistSignupRole(role: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  const normalized = normalizeRole(role);
  if (normalized !== 'provider') return;
  try {
    window.sessionStorage.setItem(SIGNUP_ROLE_STORAGE_KEY, 'provider');
  } catch {
    // sessionStorage may be unavailable (private mode)
  }
}

export function consumeSignupRoleFromSearch(search = ''): SignupIntent | null {
  const fromQuery = normalizeRole(parseSearch(search).get('role'));
  if (fromQuery === 'provider') persistSignupRole('provider');
  return fromQuery ?? readPersistedSignupRole();
}

/**
 * Provider CTA (`role=provider`) must not be forced to client.
 * Default seeker signup is client only when no provider intent is present.
 */
export function resolveSignupIntent(search = ''): SignupIntent {
  return consumeSignupRoleFromSearch(search) === 'provider' ? 'provider' : 'client';
}

export function localeQueryString(search = ''): string {
  const params = parseSearch(search);
  const next = new URLSearchParams();
  for (const key of LOCALE_QUERY_KEYS) {
    const value = params.get(key);
    if (value) next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `?${qs}` : '';
}

export function getDefaultPostAuthPath(search = ''): string {
  return `${SOCIAL_FEED_PATH}${localeQueryString(search)}`;
}

function isAuthOrHomePath(path: string): boolean {
  const pathname = path.split('?')[0].split('#')[0] || '/';
  if (pathname === '/' || pathname === '') return true;
  return AUTH_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isSafeInAppPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\');
}

function explicitRedirectFromSearch(search = ''): string | null {
  const params = parseSearch(search);
  const raw = params.get('redirect') || params.get('redirectTo') || params.get('next');
  if (!raw) return null;
  const safe = sanitizeRedirectUrl(raw);
  if (!isSafeInAppPath(safe) || isAuthOrHomePath(safe)) return null;
  return safe;
}

/** Default after email/Google/biometric login+signup: social feed, not home or a role dashboard. */
export function resolvePostAuthPath(search = ''): string {
  return explicitRedirectFromSearch(search) || getDefaultPostAuthPath(search);
}

/** Logged-in visit to /auth (including provider CTA query) goes to feed, never /. */
export function resolveAuthenticatedAuthVisitPath(search = ''): string {
  return resolvePostAuthPath(search);
}

/** OAuth / email-confirm return URL that keeps role=provider and locale. */
export function buildAuthCallbackUrl(origin: string, search = ''): string {
  const params = parseSearch(search);
  const out = new URLSearchParams();
  const role = consumeSignupRoleFromSearch(search);
  if (role === 'provider') out.set('role', 'provider');
  const safeRedirect = explicitRedirectFromSearch(search);
  if (safeRedirect) out.set('redirect', safeRedirect);
  for (const key of LOCALE_QUERY_KEYS) {
    const value = params.get(key);
    if (value) out.set(key, value);
  }
  const qs = out.toString();
  return `${origin}/auth/callback${qs ? `?${qs}` : ''}`;
}

export function clearPersistedSignupRole(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(SIGNUP_ROLE_STORAGE_KEY);
  } catch {
    // sessionStorage may be unavailable
  }
}

export function signupIntentFromMetadata(meta?: Record<string, unknown> | null): SignupIntent | null {
  if (!meta) return null;
  return normalizeRole(
    String(meta.signup_intent || meta.user_type || meta.account_type || meta.role || ''),
  );
}

export function isSignupMode(search = ''): boolean {
  const mode = (parseSearch(search).get('mode') || '').toLowerCase();
  return mode === 'signup' || mode === 'sign-up' || mode === 'register';
}

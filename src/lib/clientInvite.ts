/**
 * MD Baise client invitation helpers.
 * This app mints app_key=medical only. Never coerce to casa.
 */

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

export const CLIENT_INVITE_TOKEN_STORAGE_KEY = 'baise.client_invite.token';

const TOKEN_RE = /^[A-Za-z0-9_-]{32,128}$/;

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
  return `/invite/${encodeURIComponent(token)}`;
}

export function persistInviteToken(token: string): void {
  if (!isWellFormedInviteToken(token)) return;
  try {
    sessionStorage.setItem(CLIENT_INVITE_TOKEN_STORAGE_KEY, token);
  } catch {
    // private mode
  }
}

export function readPersistedInviteToken(): string | null {
  try {
    const value = sessionStorage.getItem(CLIENT_INVITE_TOKEN_STORAGE_KEY);
    return isWellFormedInviteToken(value) ? value : null;
  } catch {
    return null;
  }
}

export function clearPersistedInviteToken(): void {
  try {
    sessionStorage.removeItem(CLIENT_INVITE_TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
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

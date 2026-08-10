import { supabase } from '@/integrations/supabase/client';
import type { getBaiseAppKey } from '@/lib/providerCommunication';

export const EMAIL_PREFERENCE_CATEGORIES = [
  'promotions',
  'education',
  'analytics',
  'referral',
  'product_updates',
] as const;

export type EmailPreferenceCategory = (typeof EMAIL_PREFERENCE_CATEGORIES)[number];
export type EmailPreferenceBrand = ReturnType<typeof getBaiseAppKey>;

export type EmailPreferenceState = {
  valid: true;
  token: string;
  email: string;
  brand: EmailPreferenceBrand;
  brandName: string;
  unsubscribeAllMarketing: boolean;
  unsubscribeAllProducts: boolean;
  categoryPreferences: Record<EmailPreferenceCategory, boolean>;
};

export type EmailPreferenceUpdate = {
  token?: string;
  brand?: EmailPreferenceBrand;
  unsubscribeAllMarketing: boolean;
  unsubscribeAllProducts: boolean;
  categoryPreferences: Record<EmailPreferenceCategory, boolean>;
};

const isPreferenceState = (value: unknown): value is EmailPreferenceState => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<EmailPreferenceState>;
  return candidate.valid === true
    && typeof candidate.token === 'string'
    && typeof candidate.email === 'string'
    && typeof candidate.brandName === 'string'
    && (candidate.brand === 'casa' || candidate.brand === 'medical' || candidate.brand === 'legal')
    && Boolean(candidate.categoryPreferences);
};

export async function getPublicEmailPreferenceState(token: string): Promise<EmailPreferenceState | null> {
  const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const publishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '');
  if (!supabaseUrl || !token) return null;

  const response = await fetch(
    `${supabaseUrl}/functions/v1/email-unsubscribe?token=${encodeURIComponent(token)}`,
    {
      method: 'GET',
      headers: publishableKey ? { apikey: publishableKey } : undefined,
      cache: 'no-store',
    },
  );
  if (!response.ok) throw new Error(`Preference lookup failed (${response.status})`);
  const data: unknown = await response.json();
  return isPreferenceState(data) ? data : null;
}

export async function getAuthenticatedEmailPreferenceState(
  brand: EmailPreferenceBrand,
): Promise<EmailPreferenceState> {
  const { data, error } = await supabase.functions.invoke('email-unsubscribe', {
    body: { action: 'get', brand },
  });
  if (error) throw error;
  if (!isPreferenceState(data)) throw new Error('Invalid preference response');
  return data;
}

export async function saveEmailPreferences(update: EmailPreferenceUpdate): Promise<EmailPreferenceState> {
  const { data, error } = await supabase.functions.invoke('email-unsubscribe', {
    body: { action: 'update', ...update },
  });
  if (error) throw error;
  if (!isPreferenceState(data)) throw new Error('Invalid preference response');
  return data;
}

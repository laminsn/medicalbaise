import { supabase } from '@/integrations/supabase/client';

type AppKey = 'casa' | 'medical' | 'legal';
type LocaleKey = 'en' | 'es' | 'pt';
type Audience = 'client' | 'provider' | 'staff' | 'partner';

type QueueProviderUpdateInput = {
  providerId: string;
  targetUserId?: string | null;
  actorId?: string | null;
  eventKey: string;
  subject?: string | null;
  message?: string | null;
  actionPath?: string | null;
  resourceKind?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
  targetEmail?: string | null;
  targetPhone?: string | null;
  audience?: Audience;
  locale?: string;
};

type RpcClient = {
  rpc: (
    fn: 'queue_provider_update_notifications',
    args: Record<string, unknown>,
  ) => Promise<{ data: number | null; error: { message?: string } | null }>;
};

export const getBaiseAppKey = (): AppKey => {
  const key = String(import.meta.env.VITE_BAISE_APP || import.meta.env.VITE_BAISE_APP_KEY || '').toLowerCase();
  if (key === 'medical' || key === 'legal' || key === 'casa') return key;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('medical') || host.includes('mdbaise')) return 'medical';
    if (host.includes('legal')) return 'legal';
    if (host.includes('casa')) return 'casa';
  }
  return 'casa';
};

export const getBaiseAppUrl = () => {
  const key = getBaiseAppKey();
  if (key === 'medical') return 'https://www.mdbaise.com';
  if (key === 'legal') return 'https://legalbaise.com';
  return 'https://casabaise.com';
};

export const getLocaleKey = (language?: string): LocaleKey => {
  const normalized = (language || '').toLowerCase();
  if (normalized.startsWith('es')) return 'es';
  if (normalized.startsWith('pt')) return 'pt';
  return 'en';
};

export async function queueProviderUpdateNotification(input: QueueProviderUpdateInput) {
  const rpcClient = supabase as unknown as RpcClient;
  const { data, error } = await rpcClient.rpc('queue_provider_update_notifications', {
    target_provider_id: input.providerId,
    target_user_id: input.targetUserId || null,
    actor_id: input.actorId || null,
    event_key: input.eventKey,
    event_subject: input.subject || null,
    event_message: input.message || null,
    action_path: input.actionPath || '/customer-dashboard',
    resource_kind: input.resourceKind || null,
    resource_uuid: input.resourceId || null,
    event_metadata: input.metadata || {},
    target_email: input.targetEmail || null,
    target_phone: input.targetPhone || null,
    target_app_key: getBaiseAppKey(),
    target_locale: getLocaleKey(input.locale),
    target_audience: input.audience || 'client',
  });

  if (error) throw new Error(error.message || 'Unable to queue communication update');
  return data || 0;
}

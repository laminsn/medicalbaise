import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Unique topic per mount so remounts never .on() a subscribed channel.
 * Topic is `${prefix}:${crypto.randomUUID()}` — prefix only, never the bare name.
 */
export function subscribeUniqueChannel(
  prefix: string,
  bind: (channel: RealtimeChannel) => RealtimeChannel,
): RealtimeChannel | null {
  try {
    const topic = `${prefix}:${crypto.randomUUID()}`;
    return bind(supabase.channel(topic)).subscribe();
  } catch {
    return null;
  }
}

export function removeUniqueChannel(channel: RealtimeChannel | null): void {
  if (!channel) return;
  try {
    void supabase.removeChannel(channel);
  } catch {
    // Subscription may already be gone after remount/unmount races.
  }
}

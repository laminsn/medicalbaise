import { useEffect, useMemo, useState } from 'react';
import { Copy, Link2, Loader2, Mail, MessageSquare, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import {
  CLIENT_INVITE_WELCOME_COPY,
  type ClientInviteChannel,
  buildClientInviteShareBody,
  buildClientInviteShareHref,
  buildClientInviteWelcomeUrl,
  medicalInviteAppKey,
} from '@/lib/clientInvite';

type ProviderService = {
  id: string;
  description: string | null;
  fixed_price: number | null;
};

type MintResult = {
  ok?: boolean;
  error?: string;
  invite_id?: string;
  token?: string;
  expires_at?: string;
};

const db = supabase as unknown as {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
};

export function ProviderClientInviteCard({ providerId }: { providerId: string }) {
  const appKey = medicalInviteAppKey();
  const [services, setServices] = useState<ProviderService[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [minting, setMinting] = useState(false);
  const [sending, setSending] = useState<ClientInviteChannel | null>(null);
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [welcomeUrl, setWelcomeUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from('provider_services')
        .select('id, description, fixed_price')
        .eq('provider_id', providerId)
        .limit(20);
      if (!cancelled) setServices((data as ProviderService[]) || []);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [providerId]);

  const shareBody = useMemo(
    () => (welcomeUrl ? buildClientInviteShareBody(welcomeUrl) : ''),
    [welcomeUrl],
  );

  const toggleService = (id: string, checked: boolean) => {
    setSelected((current) => (checked ? [...current, id] : current.filter((value) => value !== id)));
  };

  const mint = async () => {
    setMinting(true);
    try {
      const { data, error } = await db.rpc('mint_client_invite', {
        p_app_key: appKey,
        p_service_ids: selected,
      });
      if (error) throw error;
      const result = (data || {}) as MintResult;
      if (!result.ok || !result.token) {
        toast.error(
          result.error === 'RATE_LIMITED'
            ? 'Please wait before creating another invitation.'
            : result.error === 'APP_KEY_REJECTED' || result.error === 'APP_KEY_MISMATCH'
              ? 'This app can only mint medical invitations.'
              : 'Could not create the invitation.',
        );
        return;
      }
      const url = buildClientInviteWelcomeUrl(result.token);
      setInviteId(result.invite_id || null);
      setWelcomeUrl(url);
      toast.success('Invitation link ready. Share the welcome message and link only.');
    } catch {
      toast.error('Could not create the invitation.');
    } finally {
      setMinting(false);
    }
  };

  const share = async (channel: ClientInviteChannel) => {
    if (!inviteId || !welcomeUrl) return;
    setSending(channel);
    try {
      const { data, error } = await db.rpc('record_client_invite_send', {
        p_invite_id: inviteId,
        p_channel: channel,
      });
      const result = (data || {}) as { ok?: boolean; error?: string };
      if (error || !result.ok) {
        toast.error(result.error === 'RATE_LIMITED' ? 'Send limit reached. Try again later.' : 'Could not record this send.');
        return;
      }
      if (channel === 'copy') {
        await navigator.clipboard.writeText(shareBody);
        toast.success('Welcome message and link copied.');
        return;
      }
      window.open(buildClientInviteShareHref(channel, welcomeUrl), '_blank', 'noopener,noreferrer');
    } finally {
      setSending(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New client invitation</CardTitle>
        <CardDescription>{CLIENT_INVITE_WELCOME_COPY}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Proposed services (optional)</Label>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add services in your catalog to attach them to an invitation.</p>
          ) : (
            <div className="space-y-2 rounded-md border p-3">
              {services.map((service) => (
                <label key={service.id} className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={selected.includes(service.id)}
                    onCheckedChange={(checked) => toggleService(service.id, checked === true)}
                  />
                  <span>{service.description || 'Service'}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <Button onClick={() => void mint()} disabled={minting}>
          {minting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
          Create invitation link
        </Button>

        {welcomeUrl && (
          <div className="space-y-3 rounded-md border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground break-all">{welcomeUrl}</p>
            <p className="text-xs text-muted-foreground">Share the welcome sentence and this link only. Other clients are never included.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={sending !== null} onClick={() => void share('email')}>
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button size="sm" variant="outline" disabled={sending !== null} onClick={() => void share('whatsapp')}>
                <MessageSquare className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
              <Button size="sm" variant="outline" disabled={sending !== null} onClick={() => void share('sms')}>
                <Phone className="mr-2 h-4 w-4" />
                Text
              </Button>
              <Button size="sm" variant="outline" disabled={sending !== null} onClick={() => void share('copy')}>
                <Copy className="mr-2 h-4 w-4" />
                Copy link
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

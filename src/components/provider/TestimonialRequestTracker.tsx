import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Loader2, MailCheck, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';

type TrackedRequest = {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  status: string;
  requested_at: string;
  last_sent_at: string | null;
  reminder_count: number;
  fulfilled: boolean;
};

type Candidate = { user_id: string; label: string };

/**
 * Testimonial request tracking.
 *
 * client_testimonial_requests existed with status / last_sent_at /
 * monthly_reminder_count but nothing in any app read or wrote it, so there was
 * no way to ask a client for a testimonial or see what happened next. This is
 * that surface: send, see status, and nudge — where a repeat send becomes a
 * reminder on the same row rather than a second request.
 */
export function TestimonialRequestTracker({ providerId }: { providerId: string }) {
  const { t } = useTranslation();
  const appKey = getBaiseAppKey();
  const [rows, setRows] = useState<TrackedRequest[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('list_testimonial_requests', {
      p_provider_id: providerId,
    });
    if (!error && data) setRows(data as TrackedRequest[]);
    setLoading(false);
  }, [providerId]);

  useEffect(() => { void load(); }, [load]);

  // People this provider has actually worked with — the only sensible targets.
  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('active_jobs')
        .select('customer_id, profiles:customer_id(first_name, last_name, email)')
        .eq('provider_id', providerId)
        .limit(50);
      const seen = new Set<string>();
      const list: Candidate[] = [];
      for (const row of (data ?? []) as unknown as
        { customer_id: string; profiles: { first_name?: string; last_name?: string; email?: string } | null }[]) {
        if (!row.customer_id || seen.has(row.customer_id)) continue;
        seen.add(row.customer_id);
        const p = row.profiles;
        const name = [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim();
        list.push({ user_id: row.customer_id, label: name || p?.email || row.customer_id.slice(0, 8) });
      }
      setCandidates(list);
    })();
  }, [providerId]);

  const send = async (customerId: string) => {
    setSendingId(customerId);
    try {
      const { data, error } = await supabase.rpc('create_testimonial_request', {
        p_provider_id: providerId,
        p_customer_id: customerId,
        p_app_key: appKey,
      });
      if (error) throw error;
      const result = data as { ok: boolean; error?: string; reminder?: boolean };
      if (!result?.ok) {
        toast.error(
          result?.error === 'CUSTOMER_NOT_FOUND'
            ? t('testimonialTrack.errors.noCustomer', 'Cliente não encontrado.')
            : t('testimonialTrack.errors.generic', 'Não foi possível enviar o pedido.'),
        );
        return;
      }
      toast.success(result.reminder
        ? t('testimonialTrack.reminded', 'Lembrete enviado — sem criar um novo pedido.')
        : t('testimonialTrack.sent', 'Pedido de depoimento enviado.'));
      await load();
    } catch {
      toast.error(t('testimonialTrack.errors.generic', 'Não foi possível enviar o pedido.'));
    } finally {
      setSendingId(null);
    }
  };

  const statusBadge = (row: TrackedRequest) => {
    if (row.fulfilled || row.status === 'completed') {
      return <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />{t('testimonialTrack.done', 'Recebido')}</Badge>;
    }
    if (row.status === 'opened') {
      return <Badge variant="secondary" className="gap-1"><MailCheck className="h-3 w-3" />{t('testimonialTrack.opened', 'Aberto')}</Badge>;
    }
    if (row.status === 'cancelled') {
      return <Badge variant="outline">{t('testimonialTrack.cancelled', 'Cancelado')}</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{t('testimonialTrack.waiting', 'Aguardando')}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('testimonialTrack.title', 'Pedidos de depoimento')}</CardTitle>
        <CardDescription>
          {t('testimonialTrack.subtitle', 'Peça um depoimento a quem você já atendeu e acompanhe o que aconteceu. Reenviar não cria um novo pedido — vira um lembrete.')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {candidates.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">{t('testimonialTrack.askFrom', 'Pedir a um cliente')}</p>
            <div className="flex flex-wrap gap-2">
              {candidates.map((c) => (
                <Button key={c.user_id} size="sm" variant="outline"
                  disabled={sendingId === c.user_id} onClick={() => send(c.user_id)}>
                  {sendingId === c.user_id
                    ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    : <Send className="mr-1.5 h-3 w-3" />}
                  {c.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading', 'Carregando…')}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('testimonialTrack.empty', 'Nenhum pedido ainda. Depois de concluir um trabalho, peça um depoimento — é o que mais ajuda novos clientes a escolherem você.')}
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.recipient_name || row.recipient_email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t('testimonialTrack.requestedOn', 'Pedido em {{date}}', {
                      date: new Date(row.requested_at).toLocaleDateString(),
                    })}
                    {row.reminder_count > 0 && ` · ${t('testimonialTrack.reminders', '{{n}} lembrete(s)', { n: row.reminder_count })}`}
                  </p>
                </div>
                {statusBadge(row)}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

import { FormEvent, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AlertTriangle, FlaskConical, Loader2, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';
import { useAuth } from '@/hooks/useAuth';

const MAX_FILES = 5;
const MAX_BYTES = 100 * 1024 * 1024; // matches the bucket's file_size_limit

type Attachment = { path: string; type: string; name: string; size: number };

/**
 * Pilot-mode banner + issue reporter.
 *
 * Rendered once at the app root so it appears on every page. It renders
 * nothing at all for real users — the only gate that matters is
 * profiles.is_test_account, which the server also enforces inside
 * submit_pilot_issue, so a non-tester cannot file even by calling directly.
 */
export function PilotModeBanner() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const location = useLocation();
  const appKey = getBaiseAppKey();

  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState('normal');
  const [area, setArea] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const isTester = Boolean(user && (profile as { is_test_account?: boolean } | null)?.is_test_account);
  if (!isTester) return null;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const tooBig = incoming.find((f) => f.size > MAX_BYTES);
    if (tooBig) {
      toast.error(t('pilotIssue.errors.tooBig', 'Arquivo muito grande (máx. 100 MB): {{name}}', { name: tooBig.name }));
      return;
    }
    setFiles((prev) => [...prev, ...incoming].slice(0, MAX_FILES));
  };

  const reset = () => {
    setSeverity('normal'); setArea(''); setTitle(''); setBody(''); setFiles([]);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      // Upload evidence first; storage RLS pins each tester to their own folder.
      const attachments: Attachment[] = [];
      for (const file of files) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
        const path = `${user!.id}/${Date.now()}-${safe}`;
        const { error } = await supabase.storage.from('pilot-evidence').upload(path, file);
        if (error) throw error;
        attachments.push({ path, type: file.type || 'application/octet-stream', name: file.name, size: file.size });
      }

      const { data, error } = await supabase.rpc('submit_pilot_issue', {
        p_title: title,
        p_body: body,
        p_app_key: appKey,
        p_severity: severity,
        p_area: area || null,
        p_page_url: window.location.href,
        p_user_agent: navigator.userAgent,
        p_viewport: `${window.innerWidth}x${window.innerHeight}`,
        p_attachments: attachments,
      });
      if (error) throw error;

      const result = data as { ok: boolean; error?: string };
      if (!result?.ok) {
        const messages: Record<string, string> = {
          NOT_A_TEST_ACCOUNT: t('pilotIssue.errors.notTester', 'Apenas contas de teste podem relatar problemas por aqui.'),
          TITLE_TOO_SHORT: t('pilotIssue.errors.title', 'Dê um título um pouco mais descritivo.'),
          BODY_TOO_SHORT: t('pilotIssue.errors.body', 'Conte um pouco mais sobre o que aconteceu.'),
          RATE_LIMITED: t('pilotIssue.errors.rate', 'Muitos relatos seguidos. Tente de novo em uma hora.'),
        };
        toast.error(messages[result?.error ?? ''] ?? t('pilotIssue.errors.generic', 'Não foi possível enviar o relato.'));
        return;
      }

      toast.success(t('pilotIssue.sent', 'Relato enviado. Obrigado — nossa equipe já foi notificada.'));
      reset();
      setOpen(false);
    } catch {
      toast.error(t('pilotIssue.errors.generic', 'Não foi possível enviar o relato.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-50 w-full border-b border-amber-500/40 bg-amber-500/10 backdrop-blur">
        <div className="container flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
            <FlaskConical className="h-4 w-4" />
            {t('pilotBanner.label', 'MODO DE TESTE — Programa Piloto')}
          </span>
          <span className="text-muted-foreground">
            {t('pilotBanner.text', 'Nenhum pagamento é real e sua conta não aparece para clientes.')}
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
          >
            {t('pilotBanner.cta', 'Encontrou um problema? Relate aqui →')}
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('pilotIssue.title', 'Relatar um problema')}</DialogTitle>
            <DialogDescription>
              {t('pilotIssue.subtitle', 'Quanto mais detalhe, mais rápido corrigimos. Anexe print ou gravação de tela se puder.')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('pilotIssue.severity', 'Gravidade')}</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blocker">{t('pilotIssue.sev.blocker', 'Trava tudo — não consigo continuar')}</SelectItem>
                    <SelectItem value="major">{t('pilotIssue.sev.major', 'Grave — atrapalha muito')}</SelectItem>
                    <SelectItem value="normal">{t('pilotIssue.sev.normal', 'Normal')}</SelectItem>
                    <SelectItem value="minor">{t('pilotIssue.sev.minor', 'Pequeno — detalhe visual')}</SelectItem>
                    <SelectItem value="idea">{t('pilotIssue.sev.idea', 'Ideia / sugestão')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pilot-area">{t('pilotIssue.area', 'Onde aconteceu?')}</Label>
                <Input id="pilot-area" value={area} onChange={(e) => setArea(e.target.value)}
                  placeholder={t('pilotIssue.areaPlaceholder', 'Ex.: faturas, propostas, chat')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pilot-title">{t('pilotIssue.what', 'O que aconteceu?')} *</Label>
              <Input id="pilot-title" required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder={t('pilotIssue.whatPlaceholder', 'Resuma em uma linha')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pilot-body">{t('pilotIssue.detail', 'Detalhes')} *</Label>
              <Textarea id="pilot-body" required rows={5} value={body} onChange={(e) => setBody(e.target.value)}
                placeholder={t('pilotIssue.detailPlaceholder', 'O que você fez, o que esperava, e o que aconteceu.')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pilot-files">
                {t('pilotIssue.evidence', 'Prints, fotos ou gravação de tela')}
              </Label>
              <Input id="pilot-files" type="file" multiple
                accept="image/*,video/*,application/pdf"
                onChange={(e) => addFiles(e.target.files)} disabled={files.length >= MAX_FILES} />
              <p className="text-xs text-muted-foreground">
                {t('pilotIssue.evidenceHint', 'Até {{max}} arquivos, 100 MB cada. Só você e nossa equipe conseguem ver.', { max: MAX_FILES })}
              </p>
              {files.length > 0 && (
                <ul className="space-y-1">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded border bg-muted/40 px-2 py-1 text-xs">
                      <Paperclip className="h-3 w-3 shrink-0" />
                      <span className="truncate">{f.name}</span>
                      <span className="ml-auto shrink-0 text-muted-foreground">
                        {(f.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button type="button" aria-label="remove"
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="flex gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {t('pilotIssue.privacy', 'Não envie dados reais de clientes, pacientes ou processos. Use apenas informação fictícia.')}
            </p>

            <p className="text-xs text-muted-foreground">
              {t('pilotIssue.autoCapture', 'Enviamos junto a página, o navegador e o tamanho da tela para agilizar a correção.')}{' '}
              <span className="font-mono">{location.pathname}</span>
            </p>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                {t('common.cancel', 'Cancelar')}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('pilotIssue.submit', 'Enviar relato')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

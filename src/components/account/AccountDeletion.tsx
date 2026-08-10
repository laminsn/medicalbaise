import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

const DELETION_WINDOW_DAYS = 30;

export function AccountDeletionCard({ onScheduled }: { onScheduled: () => Promise<void> }) {
  const { t, i18n } = useTranslation();
  const formatDate = (value: string | number | Date) =>
    new Date(value).toLocaleDateString(i18n.resolvedLanguage || i18n.language, { dateStyle: 'long' });

  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [reauthenticated, setReauthenticated] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const requiredPhrase = t('settings.accountClosure.confirmPhrase');
  const phraseMatches = phrase === requiredPhrase;
  const canConfirm = phraseMatches && reauthenticated && !busy && !verifying;

  const scheduledFor = formatDate(Date.now() + DELETION_WINDOW_DAYS * 86400000);

  const reset = () => {
    setPhrase('');
    setPassword('');
    setReauthenticated(false);
    setVerifying(false);
    setError('');
  };

  const verifyIdentity = async () => {
    if (!password || verifying || busy) return;
    setVerifying(true);
    setError('');

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const email = userData.user?.email;
      if (userError || !email) {
        setError(t('settings.accountClosure.reauthFailed'));
        return;
      }

      const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password });
      if (reauthError) {
        setError(t('settings.accountClosure.reauthFailed'));
        return;
      }

      setPassword('');
      setReauthenticated(true);
    } catch {
      setError(t('settings.accountClosure.reauthFailed'));
    } finally {
      setVerifying(false);
    }
  };

  const confirmDeletion = async () => {
    if (!canConfirm) return;
    setBusy(true);
    setError('');

    try {
      const { data, error: requestError } = await supabase.functions.invoke('account-delete-request', {
        body: { appContext: getBaiseAppKey() },
      });
      if (requestError) {
        setError(t('settings.accountClosure.requestFailed'));
        return;
      }

      setMessage(
        t('settings.accountClosure.scheduledFor', {
          date: formatDate(data.scheduledPurgeAt),
        }),
      );
      setOpen(false);
      reset();
      await onScheduled();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <Trash2 className="h-4 w-4" />
            {t('settings.accountClosure.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('settings.accountClosure.description')}
          </p>
          <Button
            variant="destructive"
            className="w-full"
            disabled={busy}
            onClick={() => {
              reset();
              setOpen(true);
            }}
          >
            {t('settings.accountClosure.title')}
          </Button>
          {message && (
            <p className="text-sm" role="status">
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (busy) return;
          setOpen(next);
          if (!next) reset();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('settings.accountClosure.confirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.accountClosure.confirmBody', { date: scheduledFor })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-closure-phrase">
                {t('settings.accountClosure.phraseLabel', {
                  phrase: requiredPhrase,
                })}
              </Label>
              <Input
                id="account-closure-phrase"
                value={phrase}
                onChange={(event) => setPhrase(event.target.value)}
                autoComplete="off"
                disabled={busy || verifying}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-closure-password">
                {t('settings.accountClosure.passwordLabel')}
              </Label>
              <Input
                id="account-closure-password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setReauthenticated(false);
                }}
                autoComplete="current-password"
                disabled={busy || verifying || reauthenticated}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!password || busy || verifying || reauthenticated}
                onClick={verifyIdentity}
              >
                {verifying
                  ? t('settings.accountClosure.reauthenticating')
                  : t('settings.accountClosure.reauthenticate')}
              </Button>
              {reauthenticated && (
                <p className="text-sm text-muted-foreground" role="status">
                  {t('settings.accountClosure.reauthenticated')}
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              {t('settings.accountClosure.cancel')}
            </AlertDialogCancel>
            <Button variant="destructive" disabled={!canConfirm} onClick={confirmDeletion}>
              {busy
                ? t('settings.accountClosure.scheduling')
                : t('settings.accountClosure.confirmAction')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function AccountRecoveryGate({
  scheduledAt,
  onRecovered,
  closed = false,
}: {
  scheduledAt?: string | null;
  onRecovered: () => Promise<void>;
  closed?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const formatDate = (value: string | number | Date) =>
    new Date(value).toLocaleDateString(i18n.resolvedLanguage || i18n.language, { dateStyle: 'long' });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState(scheduledAt || null);

  useEffect(() => {
    if (date) return;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const result = await supabase
        .from('account_deletion_requests')
        .select('scheduled_purge_at')
        .eq('user_id', data.user.id)
        .eq('status', 'pending_deletion')
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setDate(result.data?.scheduled_purge_at || null);
    });
  }, [date]);

  const recover = async () => {
    setBusy(true);
    const result = await supabase.functions.invoke('account-recover', {
      body: { appContext: getBaiseAppKey() },
    });
    setBusy(false);
    if (result.error) {
      setError(
        t('settings.accountClosure.recoverFailed'),
      );
      return;
    }
    await onRecovered();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>
            {closed
              ? t('settings.accountClosure.closedTitle')
              : t('settings.accountClosure.pendingTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {closed ? (
            <p>
              {t('settings.accountClosure.closedBody')}
            </p>
          ) : (
            <>
              <p>
                {date
                  ? t(
                      'settings.accountClosure.pendingBodyWithDate',
                      { date: formatDate(date) },
                    )
                  : t('settings.accountClosure.pendingBody')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('settings.accountClosure.retentionNotice')}
              </p>
              <Button className="w-full" disabled={busy} onClick={recover}>
                {busy
                  ? t('settings.accountClosure.recovering')
                  : t('settings.accountClosure.recoverAction')}
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

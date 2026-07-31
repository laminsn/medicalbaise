import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, FlaskConical, AlertTriangle } from 'lucide-react';

type PreviewState = {
  role: 'provider' | 'client';
  tier: string | null;
  grantDays: number;
};

/**
 * Test-cohort code redemption.
 *
 * Single-use codes are issued per tester by an admin. This page previews what a
 * code grants, then redeems it. All validation lives server-side in
 * preview_test_cohort_code / redeem_test_cohort_code (SECURITY DEFINER) — the
 * client never sees another tester's code and cannot grant itself a tier.
 */
export default function TestCohortRedeem() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const appKey = getBaiseAppKey();

  const [code, setCode] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const errorMessage = (errorCode: string): string => {
    const messages: Record<string, string> = {
      INVALID_CODE: t('testCohort.errors.invalid', 'Código inválido. Verifique e tente novamente.'),
      CODE_REVOKED: t('testCohort.errors.revoked', 'Este código foi revogado. Fale com a equipe.'),
      CODE_ALREADY_USED: t('testCohort.errors.used', 'Este código já foi utilizado.'),
      CODE_EXPIRED: t('testCohort.errors.expired', 'Este código expirou.'),
      WRONG_APP: t('testCohort.errors.wrongApp', 'Este código pertence a outro aplicativo Baise.'),
      CAMPAIGN_INACTIVE: t('testCohort.errors.inactive', 'O programa de testes não está ativo no momento.'),
      ALREADY_A_TESTER: t('testCohort.errors.alreadyTester', 'Sua conta já faz parte do programa de testes.'),
      REAL_ACCOUNT_REFUSED: t('testCohort.errors.realAccount', 'Sua conta já possui uma assinatura ativa e não pode virar conta de teste.'),
      RATE_LIMITED: t('testCohort.errors.rateLimited', 'Muitas tentativas. Tente novamente em uma hora.'),
    };
    return messages[errorCode] ?? t('testCohort.errors.generic', 'Não foi possível validar o código.');
  };

  const handleCheck = async () => {
    setChecking(true);
    setError(null);
    setPreview(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('preview_test_cohort_code', {
        p_code: code,
        p_app_key: appKey,
      });
      if (rpcError) throw rpcError;

      const result = data as { ok: boolean; error?: string; role?: string; tier?: string | null; grant_days?: number };
      if (!result?.ok) {
        setError(errorMessage(result?.error ?? 'INVALID_CODE'));
        return;
      }
      setPreview({
        role: result.role === 'client' ? 'client' : 'provider',
        tier: result.tier ?? null,
        grantDays: result.grant_days ?? 60,
      });
    } catch {
      setError(t('testCohort.errors.generic', 'Não foi possível validar o código.'));
    } finally {
      setChecking(false);
    }
  };

  const handleRedeem = async () => {
    setRedeeming(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('redeem_test_cohort_code', {
        p_code: code,
        p_app_key: appKey,
        p_business_name: businessName.trim() || null,
      });
      if (rpcError) throw rpcError;

      const result = data as { ok: boolean; error?: string; role?: string };
      if (!result?.ok) {
        setError(errorMessage(result?.error ?? 'INVALID_CODE'));
        return;
      }

      await refreshProfile();
      toast.success(t('testCohort.success', 'Acesso de teste ativado.'));
      // straight into the instructions rather than dropping them on a dashboard
      navigate('/pilot/start');
    } catch {
      setError(t('testCohort.errors.generic', 'Não foi possível ativar o código.'));
    } finally {
      setRedeeming(false);
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="container max-w-lg py-10">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('testCohort.signInFirst', 'Entre na sua conta para ativar um código de teste.')}
            </AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => navigate('/auth')}>
            {t('testCohort.signIn', 'Entrar')}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Helmet>
        <title>{t('testCohort.title', 'Acesso de teste')}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="container max-w-lg py-10">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              <CardTitle>{t('testCohort.title', 'Acesso de teste')}</CardTitle>
            </div>
            <CardDescription>
              {t(
                'testCohort.subtitle',
                'Insira o código de uso único que você recebeu. Sua conta será marcada como conta de teste e ficará visível apenas para outros testadores.',
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cohort-code">{t('testCohort.codeLabel', 'Código de teste')}</Label>
              <Input
                id="cohort-code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.toUpperCase());
                  setPreview(null);
                  setError(null);
                }}
                placeholder="XXXX-XXXX-XXXX"
                autoComplete="off"
                spellCheck={false}
                disabled={redeeming}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {preview && (
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{t('testCohort.grants', 'Este código concede:')}</span>
                    <Badge variant="secondary">
                      {preview.role === 'provider'
                        ? t('testCohort.roleProvider', 'Prestador de serviço')
                        : t('testCohort.roleClient', 'Cliente')}
                    </Badge>
                    {preview.tier && <Badge>{preview.tier}</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('testCohort.duration', 'Duração: {{days}} dias', { days: preview.grantDays })}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {preview?.role === 'provider' && (
              <div className="space-y-2">
                <Label htmlFor="cohort-business">{t('testCohort.businessName', 'Nome do negócio (teste)')}</Label>
                <Input
                  id="cohort-business"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder={t('testCohort.businessPlaceholder', 'Ex.: Encanador Silva')}
                  disabled={redeeming}
                />
                <p className="text-xs text-muted-foreground">
                  {t('testCohort.markerNote', 'O prefixo [TESTE] será adicionado automaticamente.')}
                </p>
              </div>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {t(
                  'testCohort.syntheticDataWarning',
                  'Use somente dados fictícios. Não insira dados reais de clientes, pacientes, processos ou pagamentos.',
                )}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCheck}
                disabled={checking || redeeming || code.trim().length < 8}
                className="flex-1"
              >
                {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('testCohort.check', 'Verificar')}
              </Button>
              <Button onClick={handleRedeem} disabled={!preview || redeeming} className="flex-1">
                {redeeming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('testCohort.activate', 'Ativar acesso')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

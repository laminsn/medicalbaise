import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  AlertTriangle, ArrowRight, Bug, CheckCircle2, ClipboardList, CreditCard,
  EyeOff, FileText, MessageSquare, Sparkles, Users,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'baise_pilot_onboarding_done';

/**
 * The first thing a tester sees after redeeming their code.
 *
 * Deliberately short: what you have, the three rules, how to report a problem,
 * and a checklist of what we actually want exercised. Progress is kept in
 * localStorage — it is a courtesy, not a gate, so nothing here blocks the app.
 */
export default function PilotOnboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  // Lazy initializer rather than an effect: the value is available on first
  // paint and there is no setState-in-effect round trip.
  const [done, setDone] = useState<string[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  });
  const [grantEnds, setGrantEnds] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from('test_cohort_invites')
        .select('grant_expires_at')
        .eq('claimed_by', user.id)
        .maybeSingle();
      if (data?.grant_expires_at) {
        setGrantEnds(new Date(data.grant_expires_at).toLocaleDateString());
      }
    })();
  }, [user]);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const isProvider = (profile as { user_type?: string } | null)?.user_type === 'provider';

  const rules = [
    { icon: EyeOff, title: t('pilotStart.rule1Title', 'Você está invisível'),
      body: t('pilotStart.rule1Body', 'Sua conta tem a marca [TESTE] e só aparece para outros testadores. Nenhum cliente real vai encontrar ou contratar você.') },
    { icon: CreditCard, title: t('pilotStart.rule2Title', 'Nenhum dinheiro é real'),
      body: t('pilotStart.rule2Body', 'Não há forma de pagamento conectada. Faturas, saldos e repasses são simulados e ficam marcados como tal.') },
    { icon: AlertTriangle, title: t('pilotStart.rule3Title', 'Só dados fictícios'),
      body: t('pilotStart.rule3Body', 'Nunca insira dados reais de clientes, pacientes, processos, CPF, CNPJ ou banco. Invente tudo — é o esperado.') },
  ];

  const checklist = useMemo(() => (isProvider ? [
    { id: 'profile', icon: Sparkles, label: t('pilotStart.task1', 'Complete seu perfil e seus serviços'), to: '/services-settings' },
    { id: 'browse', icon: Users, label: t('pilotStart.task2', 'Veja os outros testadores em Explorar'), to: '/browse' },
    { id: 'bid', icon: ClipboardList, label: t('pilotStart.task3', 'Encontre um trabalho e envie uma proposta'), to: '/jobs' },
    { id: 'chat', icon: MessageSquare, label: t('pilotStart.task4', 'Converse com outro testador'), to: '/messages' },
    { id: 'invoice', icon: FileText, label: t('pilotStart.task5', 'Crie uma fatura e marque como paga (simulado)'), to: '/payments' },
    { id: 'report', icon: Bug, label: t('pilotStart.task6', 'Relate o primeiro problema que encontrar'), to: null },
  ] : [
    { id: 'post', icon: ClipboardList, label: t('pilotStart.ctask1', 'Publique um pedido de serviço'), to: '/post-job' },
    { id: 'browse', icon: Users, label: t('pilotStart.ctask2', 'Procure profissionais em Explorar'), to: '/browse' },
    { id: 'chat', icon: MessageSquare, label: t('pilotStart.ctask3', 'Converse com um profissional'), to: '/messages' },
    { id: 'report', icon: Bug, label: t('pilotStart.ctask4', 'Relate o primeiro problema que encontrar'), to: null },
  ]), [isProvider, t]);

  return (
    <AppLayout>
      <Helmet>
        <title>{t('pilotStart.metaTitle', 'Bem-vindo ao piloto')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="container max-w-3xl py-10">
        <Badge variant="outline" className="mb-5 border-primary/50 text-primary">
          {t('pilotStart.badge', 'Programa Piloto')}
        </Badge>
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight md:text-4xl">
          {t('pilotStart.h1', 'Sua conta de teste está ativa')}
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          {t('pilotStart.lede', 'Você tem acesso profissional completo. Use a plataforma como usaria de verdade — e nos conte tudo que quebrar, confundir ou irritar. É exatamente para isso que você está aqui.')}
          {grantEnds && ' ' + t('pilotStart.until', 'Seu acesso vai até {{date}}.', { date: grantEnds })}
        </p>

        <h2 className="mb-4 text-xl font-bold">{t('pilotStart.rulesTitle', 'Três coisas para saber')}</h2>
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {rules.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-5">
              <Icon className="mb-3 h-5 w-5 text-primary" />
              <h3 className="mb-1.5 text-sm font-semibold">{title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <Alert className="mb-10 border-amber-500/40 bg-amber-500/10">
          <Bug className="h-4 w-4" />
          <AlertDescription className="space-y-1">
            <span className="block font-semibold">
              {t('pilotStart.reportTitle', 'Como relatar um problema')}
            </span>
            <span className="block text-sm">
              {t('pilotStart.reportBody', 'A faixa amarela no topo aparece em todas as páginas. Clique em “Relate aqui” a qualquer momento — você pode anexar prints e gravações de tela. Vai direto para nossa equipe.')}
            </span>
          </AlertDescription>
        </Alert>

        <h2 className="mb-2 text-xl font-bold">{t('pilotStart.checklistTitle', 'O que queremos ver testado')}</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          {t('pilotStart.checklistLede', 'Não é obrigatório e não precisa ser hoje. É só um roteiro do que mais nos ajuda.')}
        </p>
        <Card className="mb-10">
          <CardContent className="divide-y p-0">
            {checklist.map(({ id, icon: Icon, label, to }) => {
              const isDone = done.includes(id);
              return (
                <div key={id} className="flex items-center gap-3 p-4">
                  <button type="button" onClick={() => toggle(id)} aria-pressed={isDone}
                    aria-label={label}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                      isDone ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                    }`}>
                    {isDone && <CheckCircle2 className="h-4 w-4" />}
                  </button>
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className={`text-sm ${isDone ? 'text-muted-foreground line-through' : ''}`}>{label}</span>
                  {to && (
                    <Button variant="ghost" size="sm" className="ml-auto shrink-0" asChild>
                      <Link to={to}>{t('pilotStart.go', 'Ir')}</Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={() => navigate(isProvider ? '/provider-dashboard' : '/browse')}>
            {t('pilotStart.start', 'Começar a testar')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/settings">{t('pilotStart.settings', 'Ajustar meu perfil')}</Link>
          </Button>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          {t('pilotStart.thanks', 'Obrigado por reservar seu tempo para isso. Cada problema que você encontrar é um problema que um cliente real não vai encontrar.')}
        </p>
      </div>
    </AppLayout>
  );
}

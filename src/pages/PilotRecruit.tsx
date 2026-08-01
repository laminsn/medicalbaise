import { FormEvent, useEffect, useMemo, useState } from 'react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight, CheckCircle2, FlaskConical, Loader2, ShieldCheck, Sparkles, Users,
} from 'lucide-react';
import { PageMetadata } from '@/components/seo/PageMetadata';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SignaturePad } from '@/components/pilot/SignaturePad';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';
import {
  BRAND_SEO, SeoLocale, localizedPublicPath, normalizeSeoLocale, publicPageImagePath,
} from '@/lib/publicPageSeo';

/**
 * Public pilot-tester recruitment page.
 *
 * Captures the application AND the signature. Ticking the two boxes IS the
 * acceptance (counsel-approved 2026-07-31) — there is no separate contract to
 * countersign afterwards. The
 * attorney-cleared Tester Agreement is still executed separately before any
 * access code is issued (apply -> sign -> code).
 *
 * All validation and storage live in submit_pilot_application (SECURITY
 * DEFINER); the applications table has no read path for anon or authenticated.
 */

const CONSENT_VERSION = 'pilot-tester-agreement-v1.0-2026-07-30';
const COHORT_SIZE = 20;

type PilotRecruitProps = { defaultLocale?: SeoLocale };

export default function PilotRecruit({ defaultLocale }: PilotRecruitProps) {
  const { t, i18n } = useTranslation();
  const appKey = getBaiseAppKey();
  const locale = defaultLocale || normalizeSeoLocale(i18n.resolvedLanguage || i18n.language);

  useEffect(() => {
    if (!defaultLocale) return;
    const current = i18n.resolvedLanguage || i18n.language || '';
    if (!current.startsWith(defaultLocale)) void i18n.changeLanguage(defaultLocale);
  }, [defaultLocale, i18n]);

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', city: '',
    role: '', profession: '', years: '', device: '', motivation: '',
  });
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentLgpd, setConsentLgpd] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const providerLabel = useMemo(() => ({
    casa: t('pilot.roleProviderCasa', 'Prestador de serviço'),
    medical: t('pilot.roleProviderMedical', 'Profissional de saúde'),
    legal: t('pilot.roleProviderLegal', 'Profissional jurídico'),
  }[appKey]), [appKey, t]);

  const terms = [
    t('pilot.terms.1', 'Sua conta de teste é invisível ao público. Ela recebe a marca [TESTE] e só outros testadores podem vê-la — nenhum cliente real vai encontrar você.'),
    t('pilot.terms.2', 'Nenhum dinheiro real se movimenta. Nenhuma forma de pagamento é conectada. Faturas, saldos e repasses que você vir são simulados.'),
    t('pilot.terms.3', 'Use apenas dados fictícios. Não insira informações de nenhuma pessoa real — nem clientes, nem pacientes, nem processos, nem CPF, CNPJ ou dados bancários verdadeiros.'),
    t('pilot.terms.4', 'O software é pré-lançamento, fornecido "como está". Ele vai conter falhas. Não use para trabalho real e não dependa dele como registro.'),
    t('pilot.terms.5', 'Ao final dos 60 dias sua conta é desativada e o conteúdo do teste é removido. Nada é guardado para você.'),
    t('pilot.terms.6', 'Confidencialidade: você verá recursos e telas ainda não lançados. Não publique nem compartilhe até liberarmos.'),
  ];

  // Rendered visibly below AND emitted as FAQPage structured data. Schema
  // requires the answers to be on the page, so these two must stay in sync.
  const faqs = [
    { q: t('pilot.faq.q1', 'O programa custa alguma coisa?'),
      a: t('pilot.faq.a1', 'Não. As 60 dias de acesso profissional completo são gratuitos. Não pedimos cartão e não há cobrança em nenhum momento.') },
    { q: t('pilot.faq.q2', 'Vou receber ou pagar dinheiro de verdade?'),
      a: t('pilot.faq.a2', 'Não. Nenhuma forma de pagamento é conectada. As faturas, saldos e repasses que você vir são simulados e ficam marcados como tal no sistema.') },
    { q: t('pilot.faq.q3', 'Clientes reais vão me encontrar?'),
      a: t('pilot.faq.a3', 'Não. Sua conta recebe a marca [TESTE] e fica invisível para o público — só outros testadores conseguem ver você. Isso é garantido no banco de dados, não apenas na tela.') },
    { q: t('pilot.faq.q4', 'O que acontece depois dos 60 dias?'),
      a: t('pilot.faq.a4', 'O acesso expira automaticamente e a conta é desativada. O conteúdo criado durante o teste não é aproveitado para uma conta real.') },
    { q: t('pilot.faq.q5', 'Preciso assinar alguma coisa?'),
      a: t('pilot.faq.a5', 'Você aceita as regras nesta própria página, marcando as caixas antes de enviar — e pode assinar com o dedo se quiser. Não há outro contrato depois.') },
    { q: t('pilot.faq.q6', 'Quanto tempo isso vai tomar?'),
      a: t('pilot.faq.a6', 'O que você puder dar. Pedimos que use a plataforma como usaria de verdade e nos conte o que quebrar ou confundir.') },
  ];

  const brand = BRAND_SEO[appKey];

  // Organization + WebPage now come from PageMetadata; this page only adds the
  // FAQ node, whose questions must stay identical to the visible list above.
  const faqSchema = {
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const benefits = [
    { icon: Sparkles, title: t('pilot.benefit1Title', '60 dias de acesso completo'),
      body: t('pilot.benefit1Body', 'Conta profissional com todos os recursos liberados: anúncios, orçamentos, faturas, subcontratados e equipe.') },
    { icon: Users, title: t('pilot.benefit2Title', 'Teste com outros profissionais'),
      body: t('pilot.benefit2Body', 'Você negocia, contrata e fatura com os outros testadores — não com telas vazias.') },
    { icon: ShieldCheck, title: t('pilot.benefit3Title', 'Sua opinião muda o produto'),
      body: t('pilot.benefit3Body', 'O que você encontrar é corrigido antes do lançamento. É esse o objetivo do piloto.') },
  ];

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!consentTerms || !consentLgpd) {
      toast.error(t('pilot.errors.consent', 'Confirme os dois itens para continuar.'));
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('submit_pilot_application', {
        p_app_key: appKey,
        p_full_name: form.fullName,
        p_email: form.email,
        p_intended_role: form.role,
        p_consent_terms: true,
        p_consent_lgpd: true,
        p_consent_version: CONSENT_VERSION,
        p_phone: form.phone || null,
        p_city: form.city || null,
        p_profession: form.profession || null,
        p_years_experience: form.years ? Number(form.years) : null,
        p_device: form.device || null,
        p_motivation: form.motivation || null,
        p_signature: signature,
        p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });
      if (error) throw error;

      const result = data as { ok: boolean; error?: string };
      if (!result?.ok) {
        const messages: Record<string, string> = {
          CONSENT_REQUIRED: t('pilot.errors.consent', 'Confirme os dois itens para continuar.'),
          INVALID_EMAIL: t('pilot.errors.email', 'Informe um e-mail válido.'),
          INVALID_NAME: t('pilot.errors.name', 'Informe seu nome completo.'),
          INVALID_ROLE: t('pilot.errors.role', 'Escolha como você quer participar.'),
        };
        toast.error(messages[result?.error ?? ''] ?? t('pilot.errors.generic', 'Não foi possível enviar sua inscrição.'));
        return;
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Confirmation email, in the language they filled the form in. Deliberately
      // not awaited and never surfaced: the application is already saved, and a
      // mail failure must not read to the applicant as a failed submission.
      void supabase.functions
        .invoke('send-pilot-confirmation', {
          body: {
            email: form.email.trim().toLowerCase(),
            name: form.fullName,
            app_key: appKey,
            locale: (i18n.resolvedLanguage || i18n.language || 'pt').slice(0, 2),
          },
        })
        .then(null, () => null);
    } catch {
      toast.error(t('pilot.errors.generic', 'Não foi possível enviar sua inscrição.'));
    } finally {
      setSubmitting(false);
    }
  };

  const heroImage = publicPageImagePath('pilot', locale);

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <PageMetadata page="pilot" locale={locale} path={localizedPublicPath('/pilot', locale)} basePath="/pilot" />
        <div className="container max-w-xl py-24 text-center">
          <CheckCircle2 className="mx-auto mb-6 h-14 w-14 text-primary" />
          <h1 className="mb-4 text-3xl font-bold">
            {t('pilot.successTitle', 'Inscrição recebida')}
          </h1>
          <p className="mb-8 text-muted-foreground">
            {t('pilot.successBody', 'Vamos analisar as inscrições e entrar em contato pelo e-mail que você informou. Se você for selecionado, enviaremos o seu código de acesso individual.')}
          </p>
          <Button asChild variant="outline">
            {/* NOT localizedPublicPath: only blog/pilot/influencer/testimonial/
                give-a-month/bio/links have /pt and /es routes. Home and /privacy
                do not, so prefixing the locale 404s. */}
            <Link to="/">
              {t('pilot.backHome', 'Voltar ao início')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageMetadata
        page="pilot"
        locale={locale}
        path={localizedPublicPath('/pilot', locale)}
        basePath="/pilot"
        structuredData={faqSchema}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-primary/25 blur-[110px]" />
        <div className="container relative grid gap-12 py-16 md:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            {/* This page has no app header, so without a selector here a
                non-Portuguese speaker has no way to switch. Consent has to be
                legible before it can be given. */}
            <div className="mb-8 flex items-center gap-3">
              <img src="/baise-logo.svg" alt="" width={40} height={40} className="rounded-lg" />
              <span className="text-xl font-extrabold tracking-tight">{brand.name}</span>
              <div className="ml-auto">
                <LanguageSelector />
              </div>
            </div>
            <Badge variant="outline" className="mb-6 border-primary/50 text-primary">
              <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
              {t('pilot.kicker', 'Programa Piloto — {{count}} vagas', { count: COHORT_SIZE })}
            </Badge>
            <h1 className="mb-5 text-4xl font-extrabold tracking-tight md:text-6xl">
              {t('pilot.h1', 'Ajude a testar antes do lançamento')}
            </h1>
            <p className="mb-8 max-w-xl text-lg text-muted-foreground">
              {t('pilot.lede', 'Estamos abrindo {{count}} vagas para profissionais testarem a plataforma completa por 60 dias. Sem custo e sem pagamento real — o objetivo é encontrar os problemas antes que os clientes encontrem.', { count: COHORT_SIZE })}
            </p>
            <Button size="lg" asChild>
              <a href="#inscricao">
                {t('pilot.ctaPrimary', 'Quero me inscrever')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
          <div className="relative">
            <img
              src={heroImage}
              width={1200}
              height={630}
              loading="eager"
              alt={t('pilot.heroAlt', 'Programa piloto de testadores — 60 dias de acesso profissional completo.')}
              className="w-full rounded-2xl border shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="container py-16">
        <h2 className="mb-10 text-2xl font-bold md:text-3xl">
          {t('pilot.benefitsTitle', 'O que você recebe')}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-6">
              <Icon className="mb-4 h-6 w-6 text-primary" />
              <h3 className="mb-2 font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pilot terms — visible, not buried behind a link */}
      <section className="border-y bg-muted/40">
        <div className="container py-16">
          <h2 className="mb-3 text-2xl font-bold md:text-3xl">
            {t('pilot.termsTitle', 'As regras do piloto')}
          </h2>
          <p className="mb-8 max-w-2xl text-muted-foreground">
            {t('pilot.termsLede', 'Leia com atenção. Ao marcar as caixas abaixo você aceita estes termos — não há outro contrato para assinar depois.')}
          </p>
          <ul className="grid gap-4 md:grid-cols-2">
            {terms.map((line, index) => (
              <li key={index} className="flex gap-3 rounded-lg border bg-background p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm leading-relaxed">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ — rendered visibly because the FAQPage schema above describes it */}
      <section className="container py-16">
        <h2 className="mb-10 text-2xl font-bold md:text-3xl">
          {t('pilot.faqTitle', 'Perguntas frequentes')}
        </h2>
        <dl className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {faqs.map(({ q, a }) => (
            <div key={q}>
              <dt className="mb-2 font-semibold">{q}</dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Application */}
      <section id="inscricao" className="container py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-3 text-2xl font-bold md:text-3xl">
            {t('pilot.formTitle', 'Inscrição')}
          </h2>
          <p className="mb-8 text-muted-foreground">
            {t('pilot.formLede', 'Leva menos de dois minutos. Analisamos cada inscrição individualmente.')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pilot-name">{t('pilot.fieldName', 'Nome completo')} *</Label>
                <Input id="pilot-name" required value={form.fullName}
                  onChange={(e) => set('fullName')(e.target.value)} autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pilot-email">{t('pilot.fieldEmail', 'E-mail')} *</Label>
                <Input id="pilot-email" type="email" required value={form.email}
                  onChange={(e) => set('email')(e.target.value)} autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pilot-phone">{t('pilot.fieldPhone', 'WhatsApp')}</Label>
                <Input id="pilot-phone" value={form.phone}
                  onChange={(e) => set('phone')(e.target.value)} autoComplete="tel"
                  placeholder="+55 21 90000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pilot-city">{t('pilot.fieldCity', 'Cidade')}</Label>
                <Input id="pilot-city" value={form.city}
                  onChange={(e) => set('city')(e.target.value)} autoComplete="address-level2" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('pilot.fieldRole', 'Como você quer participar?')} *</Label>
              <Select value={form.role} onValueChange={set('role')} required>
                <SelectTrigger><SelectValue placeholder={t('pilot.fieldRolePlaceholder', 'Escolha uma opção')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="provider">{providerLabel}</SelectItem>
                  <SelectItem value="client">{t('pilot.roleClient', 'Cliente — quero contratar serviços')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pilot-profession">{t('pilot.fieldProfession', 'Profissão ou especialidade')}</Label>
                <Input id="pilot-profession" value={form.profession}
                  onChange={(e) => set('profession')(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pilot-years">{t('pilot.fieldYears', 'Anos de experiência')}</Label>
                <Input id="pilot-years" type="number" min={0} max={70} value={form.years}
                  onChange={(e) => set('years')(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('pilot.fieldDevice', 'Você vai testar mais no…')}</Label>
              <Select value={form.device} onValueChange={set('device')}>
                <SelectTrigger><SelectValue placeholder={t('pilot.fieldDevicePlaceholder', 'Escolha uma opção')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">{t('pilot.devicePhone', 'Celular')}</SelectItem>
                  <SelectItem value="computer">{t('pilot.deviceComputer', 'Computador')}</SelectItem>
                  <SelectItem value="both">{t('pilot.deviceBoth', 'Os dois')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pilot-motivation">{t('pilot.fieldMotivation', 'Por que você quer participar?')}</Label>
              <Textarea id="pilot-motivation" rows={3} value={form.motivation}
                onChange={(e) => set('motivation')(e.target.value)}
                placeholder={t('pilot.fieldMotivationPlaceholder', 'Uma ou duas frases já bastam.')} />
            </div>

            {/* Consent */}
            <div className="space-y-4 rounded-xl border bg-muted/40 p-5">
              <div className="flex gap-3">
                <Checkbox id="pilot-consent-terms" checked={consentTerms}
                  onCheckedChange={(v) => setConsentTerms(v === true)} className="mt-1" />
                <Label htmlFor="pilot-consent-terms" className="text-sm font-normal leading-relaxed">
                  {t('pilot.consentTerms', 'Li e aceito as regras do piloto acima. Entendo que este é um software de teste, que vou usar apenas dados fictícios e que nenhum pagamento real acontece.')} *
                </Label>
              </div>
              <div className="flex gap-3">
                <Checkbox id="pilot-consent-lgpd" checked={consentLgpd}
                  onCheckedChange={(v) => setConsentLgpd(v === true)} className="mt-1" />
                <Label htmlFor="pilot-consent-lgpd" className="text-sm font-normal leading-relaxed">
                  {t('pilot.consentLgpd', 'Autorizo o uso dos meus dados de contato para avaliar minha inscrição e falar comigo sobre o piloto. Posso retirar essa autorização a qualquer momento.')} *{' '}
                  <Link to="/privacy" className="text-primary underline underline-offset-2">
                    {t('pilot.privacyLink', 'Política de Privacidade')}
                  </Link>
                </Label>
              </div>

              <div className="border-t pt-4">
                <p className="mb-2 text-sm font-medium">
                  {t('pilot.signature.title', 'Sua assinatura')}
                </p>
                <SignaturePad onChange={setSignature} />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full"
              disabled={submitting || !consentTerms || !consentLgpd}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('pilot.submit', 'Enviar inscrição')}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {t('pilot.signNote', 'Ao enviar, você aceita os termos acima. Guardamos a data, a versão dos termos e sua assinatura como registro.')}
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}

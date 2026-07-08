import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Gift,
  Link2,
  QrCode,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { InfluencerCampaignShell } from '@/components/partner/InfluencerCampaignShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBaiseAppKey } from '@/lib/providerCommunication';

const brandName = {
  casa: 'Casa Baise',
  medical: 'Medical Baise',
  legal: 'Legal Baise',
} as const;

type LocaleKey = 'en' | 'pt';

type GiveMonthReferralCampaignProps = {
  defaultLocale?: LocaleKey;
};

const COPY = {
  en: {
    title: 'Give a Month, Get a Month',
    description: 'Baise premium members can earn a free month for every friend, family member, client, or provider who registers for a premium-level service through their referral link.',
    badge: 'Referral campaign',
    dateWindow: 'July 1 - August 31, 2026',
    eyebrow: 'Share Baise. Earn premium months.',
    headline: 'Give a month, get a month.',
    intro: 'Premium Baise customers can refer friends, family, clients, and trusted contacts. Every qualifying premium registration gives the person you invite a reason to join and gives you a free month back.',
    proofStats: [
      { label: 'Maximum yearly credits', value: '12 months' },
      { label: 'Campaign window', value: 'Jul + Aug' },
      { label: 'Reward per premium referral', value: '1 month' },
    ],
    benefits: [
      {
        icon: Gift,
        title: 'One premium referral. One free month.',
        body: 'When someone joins a premium-level service through your referral link, code, or QR code, you earn one free month.',
      },
      {
        icon: Repeat2,
        title: 'Stack up to a full year',
        body: 'Earn up to 12 free months in a calendar year, so active referrers can cover a full year of eligible premium service.',
      },
      {
        icon: Users,
        title: 'For providers and service receivers',
        body: 'Premium service providers and premium service receivers can both share their referral code with friends, family, clients, and trusted contacts.',
      },
      {
        icon: ShieldCheck,
        title: 'Premium registrations only',
        body: 'Credits apply when the referred person registers for a premium-level service and the referral is tracked to your account.',
      },
    ],
    howTitle: 'How the referral campaign works',
    steps: [
      'Register for or keep an active premium-level Baise service.',
      'Open your referral dashboard and share your link, QR code, or referral code.',
      'Your friend, family member, client, or provider joins a premium-level service.',
      'Baise credits your account with one free month for every qualifying premium referral.',
    ],
    trackedTitle: 'Tracked by Baise',
    trackedBody: 'Every eligible member can share a link, QR code, or referral code.',
    rewardLabel: 'Referral reward',
    rewardTitle: 'Earn one free month for each qualifying premium registration.',
    rewardBody: 'Earn up to 12 free months in a calendar year when referrals register for premium-level service.',
    audienceTitle: 'Who this is for',
    audienceBody: 'This campaign is for current Baise customers on premium-level service, including service providers and service receivers. Share Baise with people who need trusted providers, legal support, medical support, or a better way to manage service relationships.',
    audienceLanes: ['Service providers', 'Service receivers', 'Clients', 'Families', 'Friends', 'Business contacts'],
    cardEyebrow: 'Current customer campaign',
    cardTitle: 'Start earning free months',
    cardBody: 'Premium members can share from the referral dashboard. Not premium yet? Choose a premium-level service first, then start sharing.',
    referralCta: 'Open referral dashboard',
    premiumCta: 'View premium services',
    termsTitle: 'Campaign terms',
    terms: [
      'Campaign runs July 1 through August 31, 2026.',
      'One free month is earned for each qualifying premium-level registration.',
      'Maximum reward is 12 free months per calendar year.',
      'Referral must be tracked through your Baise link, QR code, or referral code.',
      'Credits apply to eligible premium-level service on the referring account.',
    ],
  },
  pt: {
    title: 'Indique um Mês, Ganhe um Mês',
    description: 'Membros premium da Baise podem ganhar um mês grátis para cada amigo, familiar, cliente ou prestador que se cadastrar em um serviço premium pelo link de indicação.',
    badge: 'Campanha de indicação',
    dateWindow: '1 de julho - 31 de agosto de 2026',
    eyebrow: 'Compartilhe Baise. Ganhe meses premium.',
    headline: 'Indique um mês, ganhe um mês.',
    intro: 'Clientes premium da Baise podem indicar amigos, familiares, clientes e contatos de confiança. Cada cadastro premium qualificado da pessoa indicada gera valor para ela e devolve um mês grátis para você.',
    proofStats: [
      { label: 'Crédito máximo anual', value: '12 meses' },
      { label: 'Período da campanha', value: 'Jul + Ago' },
      { label: 'Recompensa por indicação premium', value: '1 mês' },
    ],
    benefits: [
      {
        icon: Gift,
        title: 'Uma indicação premium. Um mês grátis.',
        body: 'Quando alguém entra em um serviço premium pelo seu link, código ou QR code de indicação, você ganha um mês grátis.',
      },
      {
        icon: Repeat2,
        title: 'Acumule até um ano completo',
        body: 'Ganhe até 12 meses grátis em um ano calendário, para que clientes ativos possam cobrir um ano inteiro de serviço premium elegível.',
      },
      {
        icon: Users,
        title: 'Para prestadores e clientes',
        body: 'Prestadores premium e clientes premium podem compartilhar seu código de indicação com amigos, familiares, clientes e contatos de confiança.',
      },
      {
        icon: ShieldCheck,
        title: 'Apenas cadastros premium',
        body: 'Os créditos se aplicam quando a pessoa indicada se cadastra em um serviço premium e a indicação é rastreada para a sua conta.',
      },
    ],
    howTitle: 'Como a campanha de indicação funciona',
    steps: [
      'Cadastre-se ou mantenha um serviço premium ativo na Baise.',
      'Abra seu painel de indicações e compartilhe seu link, QR code ou código de indicação.',
      'Seu amigo, familiar, cliente ou prestador entra em um serviço premium.',
      'A Baise credita um mês grátis na sua conta para cada indicação premium qualificada.',
    ],
    trackedTitle: 'Rastreado pela Baise',
    trackedBody: 'Todo membro elegível pode compartilhar um link, QR code ou código de indicação.',
    rewardLabel: 'Recompensa de indicação',
    rewardTitle: 'Ganhe um mês grátis por cada cadastro premium qualificado.',
    rewardBody: 'Ganhe até 12 meses grátis em um ano calendário quando suas indicações entrarem em um serviço premium.',
    audienceTitle: 'Para quem é esta campanha',
    audienceBody: 'Esta campanha é para clientes atuais da Baise com serviço premium, incluindo prestadores de serviço e pessoas que contratam serviços. Compartilhe a Baise com quem precisa de prestadores confiáveis, apoio jurídico, apoio médico ou uma forma melhor de gerenciar relações de serviço.',
    audienceLanes: ['Prestadores de serviço', 'Clientes', 'Famílias', 'Amigos', 'Contatos comerciais', 'Indicações premium'],
    cardEyebrow: 'Campanha para clientes atuais',
    cardTitle: 'Comece a ganhar meses grátis',
    cardBody: 'Membros premium podem compartilhar pelo painel de indicações. Ainda não é premium? Escolha primeiro um serviço premium e depois comece a compartilhar.',
    referralCta: 'Abrir painel de indicações',
    premiumCta: 'Ver serviços premium',
    termsTitle: 'Termos da campanha',
    terms: [
      'A campanha acontece de 1 de julho a 31 de agosto de 2026.',
      'Um mês grátis é ganho por cada cadastro premium qualificado.',
      'A recompensa máxima é de 12 meses grátis por ano calendário.',
      'A indicação deve ser rastreada pelo seu link, QR code ou código de indicação Baise.',
      'Os créditos se aplicam ao serviço premium elegível da conta que fez a indicação.',
    ],
  },
} as const;

export default function GiveMonthReferralCampaign({ defaultLocale }: GiveMonthReferralCampaignProps) {
  const { i18n } = useTranslation();
  const appKey = getBaiseAppKey();
  const brand = brandName[appKey];
  const resolved = (i18n.resolvedLanguage || i18n.language || '').toLowerCase();
  const locale: LocaleKey = resolved.startsWith('pt') ? 'pt' : 'en';
  const copy = COPY[locale];

  useEffect(() => {
    if (!defaultLocale) return;
    const current = (i18n.resolvedLanguage || i18n.language || '').toLowerCase();
    if (!current.startsWith(defaultLocale)) {
      void i18n.changeLanguage(defaultLocale);
    }
  }, [defaultLocale, i18n]);

  return (
    <InfluencerCampaignShell brand={brand}>
      <Helmet>
        <html lang={locale === 'pt' ? 'pt-BR' : 'en'} />
        <title>{copy.title} | {brand}</title>
        <meta
          name="description"
          content={copy.description}
        />
      </Helmet>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8 lg:pb-16 lg:pt-8">
        <div className="min-w-0 space-y-8 lg:py-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="rounded-md border-white/15 bg-white/10 text-white hover:bg-white/10">
              {copy.badge}
            </Badge>
            <span className="text-sm font-medium text-white/58">{copy.dateWindow}</span>
          </div>

          <div className="max-w-4xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
              {copy.eyebrow}
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              {copy.headline}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/68 sm:text-lg">
              {copy.intro}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {copy.proofStats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-white/12 bg-white/[0.06] p-4">
                <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.08em] text-white/48">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-white/12 bg-white/[0.05]">
            <div className="grid gap-px bg-white/12 md:grid-cols-2">
              {copy.benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="bg-[#101114] p-5">
                    <span className="mb-4 inline-flex rounded-md bg-emerald-400/10 p-2 text-emerald-300 ring-1 ring-emerald-300/15">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h2 className="text-base font-semibold">{benefit.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/58">{benefit.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5 rounded-lg border border-white/12 bg-white/[0.04] p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <h2 className="text-xl font-semibold">{copy.howTitle}</h2>
              <div className="mt-4 grid gap-3 text-sm text-white/66 sm:grid-cols-2">
                {copy.steps.map((item) => (
                  <div key={item} className="flex gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 text-[#101114]">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-[#101114] p-2 text-white">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{copy.trackedTitle}</p>
                  <p className="text-xs text-black/54">{copy.trackedBody}</p>
                </div>
              </div>
              <div className="mt-4 rounded-md border bg-[#f6f7f2] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{copy.rewardLabel}</p>
                <p className="mt-2 text-xl font-semibold leading-tight">{copy.rewardTitle}</p>
                <p className="mt-2 text-xs leading-5 text-black/58">{copy.rewardBody}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/12 bg-[#15161a] p-5">
            <h2 className="text-xl font-semibold">{copy.audienceTitle}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
              {copy.audienceBody}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {copy.audienceLanes.map((lane) => (
                <span key={lane} className="rounded-md border border-white/12 bg-white/[0.05] px-3 py-2 text-sm text-white/72">
                  {lane}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-white/14 bg-white p-5 text-[#101114] shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{copy.cardEyebrow}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">{copy.cardTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-black/58">
                  {copy.cardBody}
                </p>
              </div>
              <Gift className="h-6 w-6 text-amber-500" />
            </div>

            <div className="space-y-3">
              <Button asChild className="h-11 w-full gap-2">
                <Link to="/referral">
                  {copy.referralCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 w-full gap-2 border-black/10 bg-white text-[#101114] hover:bg-black/[0.04] hover:text-[#101114]">
                <Link to="/pricing">
                  {copy.premiumCta}
                  <Link2 className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-5 rounded-lg bg-black/[0.04] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CalendarDays className="h-4 w-4 text-emerald-700" />
                {copy.termsTitle}
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-black/58">
                {copy.terms.map((term) => (
                  <li key={term} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-700" />
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </section>
    </InfluencerCampaignShell>
  );
}

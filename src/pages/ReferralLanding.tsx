import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Gift, QrCode, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InfluencerCampaignShell } from '@/components/partner/InfluencerCampaignShell';
import { PageMetadata } from '@/components/seo/PageMetadata';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';
import { SeoLocale, normalizeSeoLocale } from '@/lib/publicPageSeo';

type ReferralIdentity = {
  referrer_id: string;
  client_id: string | null;
  referral_code: string | null;
  referral_slug: string | null;
  referrer_label: string | null;
  user_type: string | null;
  app_key: 'casa' | 'medical' | 'legal';
  referral_url: string | null;
};

const db = supabase as any;

const brandName = {
  casa: 'Casa Baise',
  medical: 'Medical Baise',
  legal: 'Legal Baise',
} as const;

const brandCopy = {
  casa: {
    title: 'Your trusted service invitation is ready.',
    body: 'Use this invite to find verified service providers, manage quotes, payments, receipts, reviews, and service history in one Baise account.',
    primary: 'Create your account',
    secondary: 'Browse providers',
  },
  medical: {
    title: 'Your trusted medical support invitation is ready.',
    body: 'Use this invite to find trusted medical support, keep records organized, and manage service history from one secure Baise account.',
    primary: 'Create your account',
    secondary: 'Explore Medical Baise',
  },
  legal: {
    title: 'Your trusted legal support invitation is ready.',
    body: 'Use this invite to find trusted legal support, keep documents and receipts organized, and manage service history from one secure Baise account.',
    primary: 'Create your account',
    secondary: 'Explore Legal Baise',
  },
} as const;

type ReferralLandingProps = {
  defaultLocale?: SeoLocale;
};

export default function ReferralLanding({ defaultLocale }: ReferralLandingProps) {
  const { i18n } = useTranslation();
  const { code = '' } = useParams();
  const appKey = getBaiseAppKey();
  const brand = brandName[appKey];
  const copy = brandCopy[appKey];
  const locale = defaultLocale || normalizeSeoLocale(i18n.resolvedLanguage || i18n.language);
  const [identity, setIdentity] = useState<ReferralIdentity | null>(null);

  const cleanCode = useMemo(() => decodeURIComponent(code).trim(), [code]);

  useEffect(() => {
    if (!defaultLocale) return;
    const current = (i18n.resolvedLanguage || i18n.language || '').toLowerCase();
    if (!current.startsWith(defaultLocale)) {
      void i18n.changeLanguage(defaultLocale);
    }
  }, [defaultLocale, i18n]);

  useEffect(() => {
    if (!cleanCode) return;
    localStorage.setItem('baise_referral_code', cleanCode);
    localStorage.setItem('baise_referral_landing', `${window.location.pathname}${window.location.search}`);

    const loadReferral = async () => {
      const { data } = await db.rpc('resolve_referral_identity', { target_code: cleanCode });
      const record = Array.isArray(data) ? data[0] : data;
      if (record) setIdentity(record as ReferralIdentity);
    };

    void loadReferral();
  }, [cleanCode]);

  const authPath = `/auth?ref=${encodeURIComponent(cleanCode)}&redirect=${encodeURIComponent('/customer-dashboard')}`;
  const discoverPath = `/discover?ref=${encodeURIComponent(cleanCode)}`;
  const label = identity?.referrer_label || 'A Baise member';
  const clientId = identity?.client_id || cleanCode;

  return (
    <InfluencerCampaignShell brand={brand}>
      <PageMetadata page="referral" locale={locale} path={window.location.pathname} />

      <main className="mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <section className="min-w-0 space-y-6">
          <Badge className="rounded-md border-white/15 bg-white/10 text-white hover:bg-white/10">
            Referral invitation
          </Badge>
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Give a month. Get trusted support.
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
              {copy.body}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: 'Trusted providers', body: 'Search with review, payment, and record support.' },
              { icon: Gift, title: 'Premium offer', body: 'Eligible premium signups can receive campaign credit.' },
              { icon: Sparkles, title: 'One account', body: 'Requests, invoices, receipts, reviews, and history stay together.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-lg border border-white/12 bg-white/[0.06] p-4">
                <Icon className="h-5 w-5 text-emerald-300" />
                <h2 className="mt-4 text-base font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/58">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-white/12 bg-white p-5 text-[#101114] shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="rounded-md bg-[#101114] p-2 text-white">
                <QrCode className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Invitation attached</p>
                <p className="mt-1 text-xs leading-5 text-black/58">
                  This code will be saved when you create your account.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-md border bg-[#f6f7f2] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Referred by</p>
              <p className="mt-2 text-xl font-semibold">{label}</p>
              <p className="mt-3 font-mono text-sm">{clientId}</p>
            </div>

            <div className="mt-5 grid gap-3">
              <Button asChild className="gap-2">
                <Link to={authPath}>
                  {copy.primary}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-black/15 bg-white text-[#101114] hover:bg-black/5 hover:text-[#101114]">
                <Link to={discoverPath}>{copy.secondary}</Link>
              </Button>
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-md bg-emerald-50 p-3 text-sm leading-5 text-emerald-900">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Referral tracking follows the link, QR code, and client ID into your account history.</span>
            </div>
          </div>
        </aside>
      </main>
    </InfluencerCampaignShell>
  );
}

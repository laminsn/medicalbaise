import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Crown,
  Gift,
  Link2,
  QrCode,
  Trophy,
  Users,
} from 'lucide-react';
import { InfluencerCampaignShell } from '@/components/partner/InfluencerCampaignShell';
import { PageMetadata } from '@/components/seo/PageMetadata';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';
import { SeoLocale, localizedPublicPath, normalizeSeoLocale } from '@/lib/publicPageSeo';

type OptInResult = {
  application_id: string;
  application_token: string;
  application_status: string;
  review_due_at: string;
};

const db = supabase as any;

const brandName = {
  casa: 'Casa Baise',
  medical: 'Medical Baise',
  legal: 'Legal Baise',
} as const;

const benefits = [
  {
    icon: BadgeDollarSign,
    title: 'R$150 per approved post',
    body: 'Apply, get approved, post from the campaign brief, and earn R$150 for each approved campaign post.',
  },
  {
    icon: Trophy,
    title: 'R$150 viral benchmark bonus',
    body: 'When an approved post reaches 10,000 verified views or more, you earn an additional R$150.',
  },
  {
    icon: Link2,
    title: 'Commission after real retention',
    body: 'Earn conversion commission after referred users stay premium or book paid services for three consecutive months.',
  },
  {
    icon: Gift,
    title: 'Free month for your audience',
    body: 'Your link, QR code, or coupon gives new users a free month on the first paid tier or a no-service-fee first eligible transaction.',
  },
  {
    icon: Users,
    title: 'All creator lanes welcome',
    body: 'UGC creators, homemakers, chefs, fitness trainers, lifestyle voices, local experts, and niche creators can apply.',
  },
  {
    icon: CalendarDays,
    title: '2 to 4 posts per month',
    body: 'This is a month-to-month campaign. Approved creators post at least twice and no more than four times per month.',
  },
];

const proofStats = [
  { label: 'Minimum followers', value: '5,000+' },
  { label: 'Per approved post', value: 'R$150' },
  { label: 'Viral bonus', value: 'R$150' },
];

const steps = [
  'Apply to join the Brazil creator campaign.',
  'Get approved and receive your campaign brief, link, QR code, and coupon code.',
  'Post original content two to four times per month.',
  'Get paid for approved posts, viral benchmarks, and qualifying retained conversions.',
];

const creatorLanes = [
  'UGC creators',
  'Homemakers',
  'Chefs',
  'Fitness trainers',
  'Lifestyle voices',
  'Local guides',
  'Business creators',
  'Brazil expat creators',
];

const initialForm = {
  full_name: '',
  email: '',
  phone: '',
};

const optInInputClass = 'border-black/10 bg-[#101114] text-white placeholder:text-white/45';

type InfluencerPartnersProps = {
  defaultLocale?: SeoLocale;
};

export default function InfluencerPartners({ defaultLocale }: InfluencerPartnersProps) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const appKey = getBaiseAppKey();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const brand = brandName[appKey];
  const locale = defaultLocale || normalizeSeoLocale(i18n.resolvedLanguage || i18n.language);
  const applicationPath = localizedPublicPath('/influencer-application', locale);

  useEffect(() => {
    if (!defaultLocale) return;
    const current = (i18n.resolvedLanguage || i18n.language || '').toLowerCase();
    if (!current.startsWith(defaultLocale)) {
      void i18n.changeLanguage(defaultLocale);
    }
  }, [defaultLocale, i18n]);

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submitOptIn = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error('Add your name and email to start the influencer application.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        campaign_interests: ['brazil_influencer', 'services', 'legal', 'medical'],
        metrics: {
          opt_in_source: 'influencer_partner_landing',
          lead_form: 'short_opt_in',
          market: 'brazil',
          minimum_followers: 5000,
          monthly_posts_min: 2,
          monthly_posts_max: 4,
          post_payment_brl: 150,
          viral_bonus_brl: 150,
          viral_threshold_views: 10000,
          retained_conversion_months: 3,
          audience_offer: 'free_first_month_or_no_first_transaction_service_fee',
        },
      };

      const { data, error } = await db.rpc('submit_influencer_partner_application', {
        target_app_key: appKey,
        application_stage: 'lead',
        application_payload: payload,
      });

      if (error) throw error;

      const result = (Array.isArray(data) ? data[0] : data) as OptInResult | undefined;
      if (result) {
        sessionStorage.setItem('baise_influencer_application', JSON.stringify({ ...result, payload }));
        navigate(`${applicationPath}?application=${result.application_id}&token=${result.application_token}`);
      } else {
        navigate(applicationPath);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start the influencer application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <InfluencerCampaignShell brand={brand}>
      <PageMetadata page="influencer" locale={locale} path={localizedPublicPath('/influencer-partners', locale)} basePath="/influencer-partners" />

        <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8 lg:pb-16 lg:pt-8">
          <div className="min-w-0 space-y-8 lg:py-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-md border-white/15 bg-white/10 text-white hover:bg-white/10">
                Brazil creator campaign
              </Badge>
              <span className="text-sm font-medium text-white/58">Month-to-month - 2 to 4 posts monthly</span>
            </div>

            <div className="max-w-4xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
                R$150 posts. Viral bonuses. Tracked commissions.
              </p>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                Become a Baise Brazil influencer.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-white/68 sm:text-lg">
                Help people in Brazil find trusted service providers, legal support, and medical support without guessing where to start. Baise gives your audience real value on day one, and gives you a clear paid campaign with simple tracking.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {proofStats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-white/12 bg-white/[0.06] p-4">
                  <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.08em] text-white/48">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-lg border border-white/12 bg-white/[0.05]">
              <div className="grid gap-px bg-white/12 md:grid-cols-2">
                {benefits.map((benefit) => {
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
                <h2 className="text-xl font-semibold">How the campaign works</h2>
                <div className="mt-4 grid gap-3 text-sm text-white/66 sm:grid-cols-2">
                  {steps.map((item) => (
                    <div key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
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
                    <p className="text-sm font-semibold">Tracked by Baise</p>
                    <p className="text-xs text-black/54">Every creator gets a link, QR code, and coupon code.</p>
                  </div>
                </div>
                <div className="mt-4 rounded-md border bg-[#f6f7f2] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Audience offer</p>
                  <p className="mt-2 text-xl font-semibold leading-tight">Free first month or no service fee on the first eligible transaction.</p>
                  <p className="mt-2 text-xs leading-5 text-black/58">The offer follows your link, QR code, or coupon code so your impact stays visible.</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/12 bg-[#15161a] p-5">
              <h2 className="text-xl font-semibold">Who should apply</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
                This campaign is for Brazil-based creators with at least 5,000 followers who can explain real value simply. You do not need to fit one mold. If your audience trusts you, and your content can help people find better service, legal, or medical support, you belong in the conversation.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {creatorLanes.map((lane) => (
                  <span key={lane} className="rounded-md border border-white/12 bg-white/[0.05] px-3 py-2 text-sm text-white/72">
                    {lane}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <form onSubmit={submitOptIn} className="rounded-lg border border-white/14 bg-white p-5 text-[#101114] shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Influencer opt-in</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">Apply to post for Baise</h2>
                  <p className="mt-2 text-sm leading-6 text-black/58">
                    Start with your basic contact details. The next page is the complete influencer form for platforms, followers, audience, and campaign fit.
                  </p>
                </div>
                <Crown className="h-6 w-6 text-amber-500" />
              </div>

              <div className="space-y-4">
                <Field label="Full name">
                  <Input className={optInInputClass} value={form.full_name} onChange={(event) => updateForm('full_name', event.target.value)} placeholder="Your name" />
                </Field>
                <Field label="Email">
                  <Input className={optInInputClass} type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder="you@example.com" />
                </Field>
                <Field label="WhatsApp or phone">
                  <Input className={optInInputClass} value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} placeholder="+55..." />
                </Field>
              </div>

              <Button type="submit" disabled={isSubmitting} className="mt-5 h-11 w-full gap-2">
                {isSubmitting ? 'Starting application...' : 'Continue to partner application'}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </Button>

              <p className="mt-4 text-center text-xs leading-5 text-black/48">
                The full influencer application follows next. Minimum 5,000 followers required for approval.
              </p>
              <Button asChild type="button" variant="ghost" className="mt-3 w-full text-[#101114] hover:bg-black/5">
                <Link to="/partner-dashboard">Already approved? Open partner portal</Link>
              </Button>
            </form>
          </aside>
        </section>
    </InfluencerCampaignShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

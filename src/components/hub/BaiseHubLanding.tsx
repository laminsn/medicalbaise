import type { ComponentType, SVGProps } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BadgeCheck,
  BarChart3,
  CalendarClock,
  ClipboardCheck,
  Gauge,
  Handshake,
  Mail,
  MessageCircle,
  Percent,
  ReceiptText,
  Sparkles,
  Radio,
  Video,
  PenSquare,
  Megaphone,
  ArrowRight,
  Star,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react';
import { LocaleControls } from '@/components/LocaleControls';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { BaiseAppCard, type BaiseApp } from './BaiseAppCard';

const APPS: readonly BaiseApp[] = ['casa', 'medical', 'legal'] as const;

const APP_URLS: Record<BaiseApp, string> = {
  casa: 'https://casabaise.com/discover',
  medical: 'https://mdbaise.com/discover',
  legal: 'https://legalbaise.com/discover',
};

const APP_ACCENTS: Record<BaiseApp, string> = {
  casa: '#1dbf73',
  medical: '#00b8d4',
  legal: '#7c3aed',
};

const IN_APP_TARGET = '/discover';

const RAW_APP = ((import.meta.env.VITE_BAISE_APP ?? 'casa') as string).trim().toLowerCase();
const CURRENT_APP: BaiseApp =
  RAW_APP === 'medical' || RAW_APP === 'legal' ? RAW_APP : 'casa';
const CURRENT_ACCENT = APP_ACCENTS[CURRENT_APP];

const BG = 'hsl(0 0% 7%)'; // matches each app's --background dark token (#121212)
const FG = 'hsl(0 0% 100%)';
const BORDER = 'hsl(0 0% 18%)';
const PROVIDER_AUTH_TARGET = '/auth?mode=signup&role=provider';

const PAYMENT_LOGOS = [
  { src: '/payment-logos/visa.svg', alt: 'Visa' },
  { src: '/payment-logos/mastercard.webp', alt: 'Mastercard' },
  { src: '/payment-logos/apple-pay.png', alt: 'Apple Pay' },
  { src: '/payment-logos/google-pay.png', alt: 'Google Pay' },
  { src: '/payment-logos/american-express.png', alt: 'American Express' },
  { src: '/payment-logos/discover.png', alt: 'Discover' },
  { src: '/payment-logos/pix.png', alt: 'Pix' },
  { src: '/payment-logos/swift-payment.png', alt: 'Swift payment' },
];

type LandingFeature = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  titleKey: string;
  bodyKey: string;
  to?: string;
  ctaKey?: string;
};

const REVIEW_CARDS = [
  {
    name: 'Mariana Costa',
    roleKey: 'hub.reviews.mariana.role',
    rating: '4.9',
    bodyKey: 'hub.reviews.mariana.body',
  },
  {
    name: 'Daniel Ribeiro',
    roleKey: 'hub.reviews.daniel.role',
    rating: '4.8',
    bodyKey: 'hub.reviews.daniel.body',
  },
  {
    name: 'Priya Mendes',
    roleKey: 'hub.reviews.priya.role',
    rating: '4.7',
    bodyKey: 'hub.reviews.priya.body',
  },
];

const HERO_CTA_LINKS = [
  { labelKey: 'hub.hero.ctaFind', to: '/discover', tone: 'primary' },
  { labelKey: 'hub.hero.ctaProvider', to: PROVIDER_AUTH_TARGET, tone: 'secondary' },
];

const PLATFORM_SCREENSHOTS = [
  {
    src: '/platform-screenshots/provider-command.png',
    titleKey: 'hub.platform.screenshots.revenue.title',
    bodyKey: 'hub.platform.screenshots.revenue.body',
    ctaKey: 'hub.platform.screenshots.revenue.cta',
    to: PROVIDER_AUTH_TARGET,
  },
  {
    src: '/platform-screenshots/analytics-dashboard.png',
    titleKey: 'hub.platform.screenshots.growth.title',
    bodyKey: 'hub.platform.screenshots.growth.body',
    ctaKey: 'hub.platform.screenshots.growth.cta',
    to: PROVIDER_AUTH_TARGET,
  },
  {
    src: '/platform-screenshots/payment-ledger.png',
    titleKey: 'hub.platform.screenshots.records.title',
    bodyKey: 'hub.platform.screenshots.records.body',
    ctaKey: 'hub.platform.screenshots.records.cta',
    to: PROVIDER_AUTH_TARGET,
  },
];

const BUSINESS_FEATURES: LandingFeature[] = [
  {
    icon: Users,
    titleKey: 'hub.providerFeatures.clientAcquisition.title',
    bodyKey: 'hub.providerFeatures.clientAcquisition.body',
  },
  {
    icon: Megaphone,
    titleKey: 'hub.providerFeatures.marketing.title',
    bodyKey: 'hub.providerFeatures.marketing.body',
  },
  {
    icon: WalletCards,
    titleKey: 'hub.providerFeatures.payments.title',
    bodyKey: 'hub.providerFeatures.payments.body',
  },
  {
    icon: CalendarClock,
    titleKey: 'hub.providerFeatures.flexiblePayments.title',
    bodyKey: 'hub.providerFeatures.flexiblePayments.body',
  },
  {
    icon: ClipboardCheck,
    titleKey: 'hub.providerFeatures.serviceProof.title',
    bodyKey: 'hub.providerFeatures.serviceProof.body',
  },
  {
    icon: Mail,
    titleKey: 'hub.providerFeatures.messaging.title',
    bodyKey: 'hub.providerFeatures.messaging.body',
  },
  {
    icon: Percent,
    titleKey: 'hub.providerFeatures.offers.title',
    bodyKey: 'hub.providerFeatures.offers.body',
  },
  {
    icon: MessageCircle,
    titleKey: 'hub.providerFeatures.reviews.title',
    bodyKey: 'hub.providerFeatures.reviews.body',
  },
  {
    icon: Handshake,
    titleKey: 'hub.providerFeatures.referrals.title',
    bodyKey: 'hub.providerFeatures.referrals.body',
    to: '/influencer-partners',
    ctaKey: 'hub.providerFeatures.referrals.cta',
  },
  {
    icon: ReceiptText,
    titleKey: 'hub.providerFeatures.records.title',
    bodyKey: 'hub.providerFeatures.records.body',
  },
  {
    icon: BarChart3,
    titleKey: 'hub.providerFeatures.dashboard.title',
    bodyKey: 'hub.providerFeatures.dashboard.body',
  },
];

const UPGRADE_FEATURES: LandingFeature[] = [
  {
    icon: TrendingUp,
    titleKey: 'hub.providerFeatures.socialAnalytics.title',
    bodyKey: 'hub.providerFeatures.socialAnalytics.body',
  },
  {
    icon: BadgeCheck,
    titleKey: 'hub.providerFeatures.verifiedBadge.title',
    bodyKey: 'hub.providerFeatures.verifiedBadge.body',
  },
  {
    icon: Gauge,
    titleKey: 'hub.providerFeatures.performance.title',
    bodyKey: 'hub.providerFeatures.performance.body',
  },
];

const HUB_FOOTER_LINKS = [
  { to: '/discover', labelKey: 'hub.footer.discover', fallback: 'Discover' },
  { to: '/blog', labelKey: 'hub.footer.blog', fallback: 'Blog' },
  { to: '/influencer-partners', labelKey: 'hub.footer.partners', fallback: 'Partners' },
  { to: '/give-a-month-get-a-month', labelKey: 'hub.footer.referrals', fallback: 'Referrals' },
  { to: '/testimonial-request', labelKey: 'hub.footer.testimonials', fallback: 'Testimonials' },
  { to: '/pricing', labelKey: 'hub.footer.specialOffers', fallback: 'Special Offers' },
  { to: '/terms', labelKey: 'hub.footer.terms', fallback: 'Terms' },
  { to: '/privacy', labelKey: 'hub.footer.privacy', fallback: 'Privacy' },
];

const FAQ_ITEMS = [
  {
    questionKey: 'hub.faq.find.question',
    answerKey: 'hub.faq.find.answer',
  },
  {
    questionKey: 'hub.faq.providerGrowth.question',
    answerKey: 'hub.faq.providerGrowth.answer',
  },
  {
    questionKey: 'hub.faq.paymentPlans.question',
    answerKey: 'hub.faq.paymentPlans.answer',
  },
  {
    questionKey: 'hub.faq.account.question',
    answerKey: 'hub.faq.account.answer',
  },
  {
    questionKey: 'hub.faq.clientRecords.question',
    answerKey: 'hub.faq.clientRecords.answer',
  },
  {
    questionKey: 'hub.faq.services.question',
    answerKey: 'hub.faq.services.answer',
  },
];

export default function BaiseHubLanding() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>{t('hub.metaTitle')}</title>
        <meta name="description" content={t('hub.metaDescription')} />
        <meta name="theme-color" content="#111111" />
      </Helmet>
      <div
        className="relative min-h-screen flex flex-col overflow-hidden"
        style={{ background: BG, color: FG, colorScheme: 'dark' }}
      >
        {/* Background ambient gradients */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: `
              radial-gradient(900px circle at 15% -10%, ${CURRENT_ACCENT}26, transparent 50%),
              radial-gradient(700px circle at 90% 5%, ${CURRENT_ACCENT}1a, transparent 60%),
              radial-gradient(1100px circle at 50% 110%, ${CURRENT_ACCENT}14, transparent 55%)
            `,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Header */}
        <header
          className="relative z-20 sticky top-0 backdrop-blur-xl"
          style={{
            backgroundColor: 'hsl(0 0% 7% / 0.7)',
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5">
            <Link
              to="/"
              className="flex items-center gap-2.5 group"
              aria-label="Baise Group"
            >
              <img
                src="/baise-logo.svg"
                alt=""
                className="w-9 h-9 rounded-lg ring-1 ring-white/10"
                width={36}
                height={36}
              />
              <div className="leading-tight">
                <p className="font-bold text-[17px] text-white tracking-tight">
                  Baise Group
                </p>
                <p className="text-[10.5px] text-white/45 -mt-0.5 hidden sm:block tracking-wider uppercase">
                  {t('hub.tagline')}
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <LocaleControls />
              {user ? (
                <Link to="/profile">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10"
                  >
                    {t('nav.profile')}
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button
                    size="sm"
                    className="bg-white text-black hover:bg-white/90 font-semibold"
                  >
                    {t('header.login')}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-1 flex flex-col">
          {/* Hero */}
          <section className="px-4 sm:px-6 pt-16 md:pt-24 pb-10 md:pb-14 text-center max-w-5xl mx-auto">
            <p
              className="mb-7 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: CURRENT_ACCENT }}
            >
              {t('hub.heroBadge')}
            </p>
            <h1 className="text-[40px] sm:text-[56px] md:text-[76px] font-extrabold text-white tracking-[-0.035em] mb-6 leading-[0.98]">
              {t('hub.hero.titlePart1')}{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(120deg, ${APP_ACCENTS.casa}, ${APP_ACCENTS.medical}, ${APP_ACCENTS.legal})`,
                }}
              >
                {t('hub.hero.titlePart2')}
              </span>
            </h1>
            <p className="text-base md:text-xl text-white/65 max-w-2xl mx-auto leading-relaxed">
              {t('hub.hero.subtitle')}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {HERO_CTA_LINKS.map((cta) => (
                <Link
                  key={cta.labelKey}
                  to={cta.to}
                  className={
                    cta.tone === 'primary'
                      ? 'inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5'
                      : cta.tone === 'secondary'
                        ? 'inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.09]'
                        : 'inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white/70 transition-colors hover:text-white'
                  }
                  style={
                    cta.tone === 'primary'
                      ? {
                          background: `linear-gradient(135deg, ${CURRENT_ACCENT} 0%, ${CURRENT_ACCENT}dd 100%)`,
                          boxShadow: `0 14px 34px -18px ${CURRENT_ACCENT}`,
                        }
                      : undefined
                  }
                >
                  {t(cta.labelKey)}
                </Link>
              ))}
            </div>
          </section>

          <SocialProofSection />

          <AppCardsSection />

          <PlatformScreenshotsSection />

          <BusinessOperatingSection />

          <ProfessionalContentSection />

          <FAQSection />

          <PaymentMethodsSection />
        </main>

        {/* Footer */}
        <footer
          className="relative z-10 px-4 sm:px-6 py-8"
          style={{ borderTop: `1px solid ${BORDER}` }}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
            <p className="text-white/40">© {new Date().getFullYear()} Baise Group</p>
            <nav
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
              aria-label={t('hub.footer.label')}
            >
              {HUB_FOOTER_LINKS.map((link) => (
                <Link key={link.to} to={link.to} className="hover:text-white transition-colors">
                  {t(link.labelKey, link.fallback)}
                </Link>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}

function AppCardsSection() {
  const { t } = useTranslation();

  return (
    <section
      className="relative px-4 sm:px-6 pb-14 md:pb-20"
      aria-labelledby="hub-apps-heading"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 max-w-2xl">
            <p
              className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em]"
              style={{ color: CURRENT_ACCENT }}
            >
              {t('hub.apps.eyebrow')}
            </p>
            <h2
              id="hub-apps-heading"
              className="text-3xl font-bold leading-tight tracking-tight text-white md:text-[42px]"
            >
              {t('hub.apps.title')}
            </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {APPS.map((app) => {
            const isCurrent = app === CURRENT_APP;
            const href = isCurrent ? IN_APP_TARGET : APP_URLS[app];
            return (
              <BaiseAppCard
                key={app}
                app={app}
                current={isCurrent}
                href={href}
                external={!isCurrent}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SocialProofSection() {
  const { t } = useTranslation();

  return (
    <section
      className="relative px-4 sm:px-6 pb-12 md:pb-16"
      aria-label={t('hub.socialProof.ariaLabel')}
    >
      <div className="max-w-6xl mx-auto">
        <div
          className="relative rounded-2xl p-5 pt-24 md:p-7 md:pt-8"
          style={{
            background:
              'linear-gradient(135deg, hsl(0 0% 10%) 0%, hsl(0 0% 6%) 100%)',
            border: `1px solid ${BORDER}`,
            boxShadow: '0 24px 80px hsl(0 0% 0% / 0.32)',
          }}
        >
          <FloatingRatingCard />

          <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div>
              <p
                className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em]"
                style={{ color: CURRENT_ACCENT }}
              >
                {t('hub.socialProof.eyebrow')}
              </p>
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-white md:text-[32px]">
                {t('hub.socialProof.title')}
              </h2>
              <p className="text-[15px] leading-relaxed text-white/60">
                {t('hub.socialProof.subtitle')}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3 lg:gap-4">
              {REVIEW_CARDS.map((review, index) => {
                const floatClass =
                  index === 0
                    ? 'md:translate-y-3 md:-rotate-1'
                    : index === 1
                      ? 'md:-translate-y-2'
                      : 'md:translate-y-4 md:rotate-1';

                return (
                  <article
                    key={review.name}
                    className={`rounded-2xl border border-white/12 bg-white/[0.07] p-4 text-left shadow-xl backdrop-blur transition-transform duration-300 hover:-translate-y-1 md:min-h-[210px] ${floatClass}`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">{t('hub.socialProof.googleReviews')}</p>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/38">
                          {t('hub.socialProof.sampleReview')}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-black">
                        {review.rating}
                      </span>
                    </div>
                    <div className="mb-3 flex items-center gap-1 text-[#fbbf24]">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star
                          key={starIndex}
                          className="h-3.5 w-3.5 fill-current"
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <p className="mb-4 text-[13px] leading-relaxed text-white/74">
                      "{t(review.bodyKey)}"
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="grid h-8 w-8 place-items-center rounded-full text-xs font-black text-white"
                        style={{ backgroundColor: CURRENT_ACCENT }}
                        aria-hidden="true"
                      >
                        {review.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white">{review.name}</p>
                        <p className="text-[11px] text-white/45">{t(review.roleKey)}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlatformScreenshotsSection() {
  const { t } = useTranslation();
  const [featuredScreenshot, ...supportingScreenshots] = PLATFORM_SCREENSHOTS;

  return (
    <section
      className="relative px-4 sm:px-6 pb-14 md:pb-20"
      aria-labelledby="platform-preview-heading"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p
              className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em]"
              style={{ color: CURRENT_ACCENT }}
            >
              {t('hub.platform.eyebrow')}
            </p>
            <h2
              id="platform-preview-heading"
              className="text-3xl font-bold leading-tight tracking-tight text-white md:text-[42px]"
            >
              {t('hub.platform.title')}
            </h2>
          </div>
          <Link
            to={PROVIDER_AUTH_TARGET}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/85 transition-all hover:-translate-y-0.5 hover:border-white/30 hover:text-white md:self-auto"
          >
            {t('hub.platform.cta')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:items-start">
          <article className="overflow-hidden rounded-2xl border border-white/12 bg-white/[0.045] shadow-2xl">
            <div className="aspect-[16/9] overflow-hidden bg-black">
              <img
                src={featuredScreenshot.src}
                alt={t(featuredScreenshot.titleKey)}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-end md:p-6">
              <div>
                <h3 className="mb-2 text-xl font-bold tracking-tight text-white md:text-2xl">
                  {t(featuredScreenshot.titleKey)}
                </h3>
                <p className="max-w-2xl text-[13.5px] leading-relaxed text-white/58 md:text-sm">
                  {t(featuredScreenshot.bodyKey)}
                </p>
              </div>
              <Link
                to={featuredScreenshot.to}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-bold transition-colors hover:border-white/30 hover:text-white"
                style={{ color: CURRENT_ACCENT }}
              >
                {t(featuredScreenshot.ctaKey)}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </article>

          <div className="grid gap-4">
            {supportingScreenshots.map((screenshot) => (
            <article
              key={screenshot.titleKey}
              className="grid overflow-hidden rounded-2xl border border-white/12 bg-white/[0.045] shadow-2xl sm:grid-cols-[0.88fr_1.12fr] lg:grid-cols-1"
            >
              <div className="aspect-[16/10] overflow-hidden bg-black sm:aspect-auto lg:aspect-[16/9]">
                <img
                  src={screenshot.src}
                  alt={t(screenshot.titleKey)}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <h3 className="mb-2 text-lg font-bold tracking-tight text-white">
                  {t(screenshot.titleKey)}
                </h3>
                <p className="mb-4 text-[13.5px] leading-relaxed text-white/58">
                  {t(screenshot.bodyKey)}
                </p>
                <Link
                  to={screenshot.to}
                  className="inline-flex items-center gap-2 text-sm font-bold transition-colors hover:text-white"
                  style={{ color: CURRENT_ACCENT }}
                >
                  {t(screenshot.ctaKey)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BusinessOperatingSection() {
  const { t } = useTranslation();
  const providerBenefits = [...BUSINESS_FEATURES, ...UPGRADE_FEATURES];
  const repeatedProviderBenefits = [...providerBenefits, ...providerBenefits];

  return (
    <section
      className="relative px-4 sm:px-6 pb-14 md:pb-20"
      aria-labelledby="business-operating-heading"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-4 md:grid-cols-[0.82fr_1.18fr] md:items-end">
          <div>
            <p
              className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em]"
              style={{ color: CURRENT_ACCENT }}
            >
              {t('hub.business.eyebrow')}
            </p>
            <h2
              id="business-operating-heading"
              className="text-3xl font-bold leading-tight tracking-tight text-white md:text-[42px]"
            >
              {t('hub.business.title')}
            </h2>
          </div>
          <div className="space-y-4">
            <p className="text-[15px] leading-relaxed text-white/62 md:text-base">
              {t('hub.business.subtitle')}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={PROVIDER_AUTH_TARGET}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: CURRENT_ACCENT }}
              >
                {t('hub.business.cta')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div
          className="baise-provider-benefit-marquee overflow-hidden rounded-2xl border border-white/12 bg-white/[0.045] p-3"
          aria-label={t('hub.business.ariaLabel')}
        >
          <div className="baise-provider-benefit-track flex w-max gap-3">
            {repeatedProviderBenefits.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article
                  key={`${feature.titleKey}-${index}`}
                  className="w-[244px] shrink-0 rounded-xl border border-white/10 bg-black/24 p-3.5"
                >
                  <span
                    className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${CURRENT_ACCENT}22`,
                      border: `1px solid ${CURRENT_ACCENT}33`,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: CURRENT_ACCENT }} aria-hidden="true" />
                  </span>
                  <h3 className="mb-2 text-[15px] font-bold tracking-tight text-white">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="line-clamp-3 text-[12px] leading-relaxed text-white/55">
                    {t(feature.bodyKey)}
                  </p>
                  {feature.to ? (
                    <Link
                      to={feature.to}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold transition-colors hover:text-white"
                      style={{ color: CURRENT_ACCENT }}
                    >
                      {t(feature.ctaKey || 'hub.providerFeatures.learnMore', 'Explore partner programs')}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-center text-[13px] font-semibold text-white/45">
          {t('hub.business.summary')}
        </p>
      </div>
    </section>
  );
}

function ProfessionalContentSection() {
  const { t } = useTranslation();

  return (
    <section className="relative px-4 sm:px-6 pb-14 md:pb-20">
      <div className="mx-auto max-w-5xl">
        <div
          className="relative overflow-hidden rounded-2xl p-7 md:p-10"
          style={{
            background: 'linear-gradient(135deg, hsl(0 0% 9%) 0%, hsl(0 0% 7%) 100%)',
            border: `1px solid ${BORDER}`,
          }}
        >
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full blur-3xl opacity-25"
            style={{
              background: `linear-gradient(135deg, ${APP_ACCENTS.casa}, ${APP_ACCENTS.medical}, ${APP_ACCENTS.legal})`,
            }}
          />

          <div className="relative">
            <p
              className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em]"
              style={{ color: CURRENT_ACCENT }}
            >
              {t('hub.pros.eyebrow')}
            </p>
            <h2 className="mb-3 text-2xl font-bold leading-tight tracking-tight text-white md:text-[32px]">
              {t('hub.pros.title')}
            </h2>
            <p className="mb-8 max-w-2xl text-[15px] leading-relaxed text-white/65 md:text-base">
              {t('hub.pros.subtitle')}
            </p>

            <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
              <FeaturePill
                icon={Radio}
                label={t('hub.pros.goLive.label')}
                desc={t('hub.pros.goLive.desc')}
              />
              <FeaturePill
                icon={Video}
                label={t('hub.pros.stream.label')}
                desc={t('hub.pros.stream.desc')}
              />
              <FeaturePill
                icon={PenSquare}
                label={t('hub.pros.post.label')}
                desc={t('hub.pros.post.desc')}
              />
              <FeaturePill
                icon={Sparkles}
                label={t('hub.pros.stories.label')}
                desc={t('hub.pros.stories.desc')}
              />
              <FeaturePill
                icon={Megaphone}
                label={t('hub.pros.promote.label')}
                desc={t('hub.pros.promote.desc')}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={PROVIDER_AUTH_TARGET}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${CURRENT_ACCENT} 0%, ${CURRENT_ACCENT}dd 100%)`,
                  color: '#fff',
                  boxShadow: `0 8px 24px -10px ${CURRENT_ACCENT}aa`,
                }}
              >
                <span>{t('hub.pros.ctaPrimary')}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/feed"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition-all hover:border-white/30 hover:text-white"
              >
                <span>{t('hub.pros.ctaSecondary')}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const { t } = useTranslation();

  return (
    <section
      className="relative px-4 sm:px-6 pb-14 md:pb-20"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 text-center">
          <p
            className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em]"
            style={{ color: CURRENT_ACCENT }}
          >
            {t('hub.faq.eyebrow')}
          </p>
          <h2
            id="faq-heading"
            className="text-3xl font-bold leading-tight tracking-tight text-white md:text-[42px]"
          >
            {t('hub.faq.title')}
          </h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => (
            <details
              key={item.questionKey}
              className="group rounded-2xl border border-white/12 bg-white/[0.045] p-5"
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-bold text-white">
                {t(item.questionKey)}
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/12 text-sm transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-white/58">
                {t(item.answerKey)}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/discover"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-black transition-all hover:-translate-y-0.5 hover:bg-white/90"
          >
            {t('hub.faq.ctaFind')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to={PROVIDER_AUTH_TARGET}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/85 transition-all hover:-translate-y-0.5 hover:border-white/30 hover:text-white"
          >
            {t('hub.faq.ctaProvider')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PaymentMethodsSection() {
  const { t } = useTranslation();
  const repeatedLogos = [...PAYMENT_LOGOS, ...PAYMENT_LOGOS];

  return (
    <section
      className="relative px-4 sm:px-6 py-14 md:py-20"
      aria-labelledby="payment-methods-heading"
      style={{
        borderTop: `1px solid ${BORDER}`,
        backgroundColor: 'hsl(0 0% 5%)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <p
            className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em]"
            style={{ color: CURRENT_ACCENT }}
          >
            {t('hub.payments.eyebrow')}
          </p>
          <h2
            id="payment-methods-heading"
            className="text-3xl font-bold tracking-tight text-white md:text-[40px]"
          >
            {t('hub.payments.title')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-white/56 md:text-base">
            {t('hub.payments.subtitle')}
          </p>
        </div>
        <div
          className="baise-logo-marquee relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          aria-label={t('hub.payments.ariaLabel')}
        >
          <div className="baise-logo-track flex w-max gap-3">
            {repeatedLogos.map((logo, index) => (
              <div
                key={`${logo.alt}-${index}`}
                className="flex h-16 min-w-[150px] items-center justify-center rounded-xl bg-white px-4 shadow-sm ring-1 ring-black/10"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="max-h-9 max-w-[116px] object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingRatingCard() {
  const { t } = useTranslation();

  return (
    <div
      className="absolute left-5 right-5 top-5 z-10 rounded-2xl border bg-black/90 px-4 py-3 text-left shadow-2xl backdrop-blur md:left-auto md:right-7 md:top-[-22px] md:w-[360px]"
      style={{ borderColor: `${CURRENT_ACCENT}55` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-1 text-[#fbbf24]">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="h-4 w-4 fill-current" aria-hidden="true" />
            ))}
            <span className="ml-1 text-sm font-black text-white">4.8</span>
          </div>
          <p className="text-[12px] font-semibold leading-snug text-white/80">
            {t('hub.floatingRating')}
          </p>
        </div>
        <div className="flex -space-x-2" aria-hidden="true">
          {['CB', 'MD', 'LB'].map((label, index) => (
            <span
              key={label}
              className="grid h-9 w-9 place-items-center rounded-full border-2 border-black text-[10px] font-black text-white shadow-lg"
              style={{
                backgroundColor:
                  index === 0 ? APP_ACCENTS.casa : index === 1 ? APP_ACCENTS.medical : APP_ACCENTS.legal,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

interface FeaturePillProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  desc: string;
}

function FeaturePill({ icon: Icon, label, desc }: FeaturePillProps) {
  return (
    <div
      className="relative rounded-xl p-3.5 transition-all duration-300 hover:bg-white/[0.03]"
      style={{
        backgroundColor: 'hsl(0 0% 11%)',
        border: '1px solid hsl(0 0% 16%)',
      }}
    >
      <div
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2.5"
        style={{
          backgroundColor: `${CURRENT_ACCENT}22`,
          border: `1px solid ${CURRENT_ACCENT}33`,
        }}
      >
        <Icon className="w-4 h-4" style={{ color: CURRENT_ACCENT }} aria-hidden="true" />
      </div>
      <p className="font-semibold text-white text-[13px] tracking-tight mb-1">{label}</p>
      <p className="text-[11.5px] text-white/55 leading-snug">{desc}</p>
    </div>
  );
}

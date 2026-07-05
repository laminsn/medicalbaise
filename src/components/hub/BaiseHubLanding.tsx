import type { ComponentType, SVGProps } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  Filter,
  Gauge,
  Handshake,
  ShieldCheck,
  Globe2,
  Lock,
  KeyRound,
  Mail,
  MessageCircle,
  Percent,
  ReceiptText,
  Sparkles,
  Compass,
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
import { LanguageSelector } from '@/components/LanguageSelector';
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

const PAYMENT_LOGOS = [
  { src: '/payment-logos/visa.svg', alt: 'Visa' },
  { src: '/payment-logos/mastercard.webp', alt: 'Mastercard' },
  { src: '/payment-logos/american-express.png', alt: 'American Express' },
  { src: '/payment-logos/discover.png', alt: 'Discover' },
  { src: '/payment-logos/pix.png', alt: 'Pix' },
  { src: '/payment-logos/swift-payment.png', alt: 'Swift payment' },
];

const PAIN_POINTS = [
  {
    title: 'Finding real trust is exhausting',
    body: 'Reviews, licenses, identity checks, pricing, and availability usually live in different places.',
  },
  {
    title: 'Pricing gets vague too fast',
    body: 'Quotes, add-ons, retainers, travel, and scope changes are hard to compare before you commit.',
  },
  {
    title: 'Messages disappear everywhere',
    body: 'Calls, DMs, documents, photos, booking notes, and follow-ups get scattered across too many apps.',
  },
  {
    title: 'Payment confidence is fragile',
    body: 'Clients want secure checkout signals, while professionals need clear receipts and fewer disputes.',
  },
  {
    title: 'Local rules create friction',
    body: 'Brazil-specific expectations, bilingual service, credentials, and compliance details slow decisions down.',
  },
  {
    title: 'Good professionals are hard to evaluate',
    body: 'Clients need proof of work, and providers need a credible place to show expertise before the first message.',
  },
];

const REVIEW_CARDS = [
  {
    name: 'Mariana Costa',
    role: 'Small business owner',
    rating: '4.9',
    body: 'Baise made it simple to compare trusted professionals, review pricing, and book with confidence.',
  },
  {
    name: 'Daniel Ribeiro',
    role: 'Agency operator',
    rating: '4.8',
    body: 'The payment flow felt secure, the profiles were clear, and the whole experience saved us time.',
  },
  {
    name: 'Priya Mendes',
    role: 'Global client',
    rating: '4.7',
    body: 'I could move from discovery to messaging to payment without losing trust at any step.',
  },
];

const HERO_CTA_LINKS = [
  { label: 'Explore trusted pros', to: '/discover', tone: 'primary' },
  { label: 'Become a provider', to: '/auth?mode=signup&role=provider', tone: 'secondary' },
  { label: 'View pricing', to: '/pricing', tone: 'ghost' },
];

const COMPARISON_ROWS = [
  {
    benefit: 'Secure transactions',
    baise: 'Built-in payment flow, receipts, invoices, and dispute-ready records.',
    youtube: 'Great for learning, but payments happen somewhere else.',
    referrals: 'Trust depends on the person making the introduction.',
    diy: 'You carry the payment and proof risk yourself.',
    google: 'Search results lead to separate sites, calls, and checkout tools.',
  },
  {
    benefit: 'Social platform',
    baise: 'Profiles, posts, live updates, portfolios, reviews, and service discovery stay connected.',
    youtube: 'Strong video reach, weak booking and service-management context.',
    referrals: 'Private conversations with limited public proof.',
    diy: 'No built-in audience, sharing, or professional content loop.',
    google: 'Discovery starts there, but engagement leaves immediately.',
  },
  {
    benefit: 'Reviews and reputation',
    baise: 'Review signals sit beside profiles, booking paths, and verified provider badges.',
    youtube: 'Comments are not structured service reviews.',
    referrals: 'Anecdotal trust, often without recent proof.',
    diy: 'No third-party reputation layer.',
    google: 'Helpful ratings, but less connected to service workflow.',
  },
  {
    benefit: 'Background checks',
    baise: 'Verified badge can show background check status and 4+ star reputation for upgraded accounts.',
    youtube: 'Creator verification does not equal service-provider vetting.',
    referrals: 'Usually informal unless the client checks manually.',
    diy: 'The client manages every verification step.',
    google: 'Business listings may not include deeper provider checks.',
  },
  {
    benefit: 'Business marketing support',
    baise: 'Coupons, campaigns, posts, referrals, sponsor metrics, and UGC support can work together.',
    youtube: 'Content-first promotion with limited invoicing or operations.',
    referrals: 'Hard to scale and measure.',
    diy: 'Requires multiple separate tools.',
    google: 'Strong intent capture, limited business operating support.',
  },
  {
    benefit: 'Transaction records',
    baise: 'Clients and providers can pull receipts, invoices, filters, exports, and tax-ready history.',
    youtube: 'No service transaction ledger.',
    referrals: 'Records are scattered across messages and bank apps.',
    diy: 'Manual spreadsheets and folders.',
    google: 'Search does not preserve service history.',
  },
  {
    benefit: 'National and international users',
    baise: 'Built for Brazil-based services plus global users who need payment, proof, and bilingual context.',
    youtube: 'Global visibility, but not a service marketplace workflow.',
    referrals: 'Works locally, breaks down across borders.',
    diy: 'International trust and payment logistics get complicated.',
    google: 'Broad reach, but users still must verify every next step.',
  },
];

const PLATFORM_SCREENSHOTS = [
  {
    src: '/platform-screenshots/discover.png',
    title: 'Find trusted pros faster',
    body: 'A focused discovery experience for comparing categories, providers, reviews, and next steps before a client books.',
    cta: 'Browse providers',
    to: '/discover',
  },
  {
    src: '/platform-screenshots/feed.png',
    title: 'Turn service work into social proof',
    body: 'Posts, stories, live updates, and provider content help businesses show their process, results, and personality.',
    cta: 'Open the feed',
    to: '/feed',
  },
  {
    src: '/platform-screenshots/jobs.png',
    title: 'Manage jobs, bids, and follow-up',
    body: 'Clients can post work, providers can compete for opportunities, and both sides keep a clearer record of progress.',
    cta: 'See jobs',
    to: '/jobs',
  },
];

const BUSINESS_FEATURES = [
  {
    icon: Users,
    title: 'Client acquisition',
    body: 'Profiles, categories, search, jobs, referrals, and CTAs bring new leads into one place.',
  },
  {
    icon: Megaphone,
    title: 'Marketing engine',
    body: 'Run posts, coupons, promotions, email campaigns, WhatsApp campaigns, and UGC pushes.',
  },
  {
    icon: WalletCards,
    title: 'Invoicing and payment processing',
    body: 'Move from quote to invoice, payment, receipt, and record without losing the paper trail.',
  },
  {
    icon: ClipboardCheck,
    title: 'Inspections and service proof',
    body: 'Keep photos, notes, job evidence, and completed-service history tied to the customer record.',
  },
  {
    icon: Mail,
    title: 'Email and WhatsApp campaigns',
    body: 'Reach past clients and new leads with campaign workflows for reminders, promos, and updates.',
  },
  {
    icon: Percent,
    title: 'Coupons and offers',
    body: 'Launch trackable discounts and seasonal offers without splitting promotion from booking.',
  },
  {
    icon: MessageCircle,
    title: 'Reviews and client follow-up',
    body: 'Collect reviews, respond to clients, and keep reputation-building tied to completed work.',
  },
  {
    icon: Handshake,
    title: 'Referral growth',
    body: 'Turn happy customers into repeat business, introductions, and measurable referral loops.',
  },
  {
    icon: ReceiptText,
    title: 'Receipts and tax tracking',
    body: 'Create cleaner tax records with searchable receipts, client history, and exportable transaction trails.',
  },
  {
    icon: BarChart3,
    title: 'Big 7 CEO metrics',
    body: 'Track revenue, leads, conversion, CAC, repeat business, cash flow, and review velocity from the dashboard.',
  },
];

const UPGRADE_FEATURES = [
  {
    icon: TrendingUp,
    title: 'Influencer analytics upgrade',
    body: 'Advanced social analytics for content reach, engagement, sponsor reporting, social media growth, and UGC campaigns.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified provider badge',
    body: 'Requires an upgraded or monthly account, background check status, and a rating above 4 stars.',
  },
  {
    icon: Gauge,
    title: 'Sponsor-ready performance view',
    body: 'Highlight social engagement metrics, campaign traction, and content-building signals for potential sponsors.',
  },
];

const CLIENT_RECORD_FEATURES = [
  {
    icon: ReceiptText,
    title: 'Full transaction history',
    body: 'Clients can pull receipts, invoices, payment proof, provider history, and service records from their account.',
  },
  {
    icon: FileDown,
    title: 'Bulk downloads',
    body: 'Export monthly, month-to-date, and annual transaction history for bookkeeping, proof, and tax records.',
  },
  {
    icon: Filter,
    title: 'Custom filters',
    body: 'Filter by date, provider, service category, status, payment method, amount, or business purpose.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'How does Baise help clients hire with more confidence?',
    answer:
      'Baise puts provider profiles, reviews, secure payment signals, receipts, and service records closer together so clients can compare trust signals before they book.',
  },
  {
    question: 'Can service providers manage their business from Baise?',
    answer:
      'Yes. The platform is designed to support client acquisition, marketing, invoicing, payments, reviews, coupons, inspections, referrals, receipts, tax records, and performance dashboards.',
  },
  {
    question: 'What is included in the upgraded provider account?',
    answer:
      'Upgraded accounts can unlock stronger marketing tools, verified badge eligibility, background-check visibility, advanced social analytics, and sponsor-ready reporting features.',
  },
  {
    question: 'Can clients download records for taxes or proof?',
    answer:
      'Clients can keep a full transaction history and use monthly, MTD, annual, bulk, and custom filtered downloads for receipts, invoices, proof, and tax organization.',
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
              <LanguageSelector />
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
                  key={cta.label}
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
                  {cta.label}
                </Link>
              ))}
            </div>
          </section>

          <PainPointsSection />

          <ComparisonTableSection />

          {/* App cards */}
          <section
            className="relative px-4 sm:px-6 pb-14 md:pb-20"
            aria-labelledby="hub-apps-heading"
          >
            <h2 id="hub-apps-heading" className="sr-only">
              {t('hub.hero.titlePart1')} {t('hub.hero.titlePart2')}
            </h2>
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
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
          </section>

          <SocialProofSection />

          <PlatformScreenshotsSection />

          {/* SSO callout */}
          <section className="relative px-4 sm:px-6 pb-14 md:pb-20">
            <div className="max-w-5xl mx-auto">
              <div
                className="relative overflow-hidden rounded-2xl p-7 md:p-10"
                style={{
                  background:
                    'linear-gradient(135deg, hsl(0 0% 9%) 0%, hsl(0 0% 7%) 100%)',
                  border: `1px solid ${BORDER}`,
                }}
              >
                <div
                  aria-hidden="true"
                  className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30"
                  style={{
                    background: `linear-gradient(135deg, ${APP_ACCENTS.casa}, ${APP_ACCENTS.medical}, ${APP_ACCENTS.legal})`,
                  }}
                />
                <div className="relative grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      background:
                        'linear-gradient(135deg, hsl(0 0% 18%), hsl(0 0% 12%))',
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    <KeyRound className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <p
                      className="text-[10.5px] font-bold tracking-[0.18em] uppercase mb-2"
                      style={{ color: CURRENT_ACCENT }}
                    >
                      {t('hub.sso.eyebrow')}
                    </p>
                    <h2 className="text-2xl md:text-[28px] font-bold text-white mb-2 tracking-tight">
                      {t('hub.sso.title')}
                    </h2>
                    <p className="text-[15px] md:text-base text-white/65 leading-relaxed max-w-2xl">
                      {t('hub.sso.subtitle')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* For Professionals — post, stream, go live, stories, promote */}
          <section className="relative px-4 sm:px-6 pb-14 md:pb-20">
            <div className="max-w-5xl mx-auto">
              <div
                className="relative overflow-hidden rounded-2xl p-7 md:p-10"
                style={{
                  background: 'linear-gradient(135deg, hsl(0 0% 9%) 0%, hsl(0 0% 7%) 100%)',
                  border: `1px solid ${BORDER}`,
                }}
              >
                <div
                  aria-hidden="true"
                  className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full blur-3xl opacity-25"
                  style={{
                    background: `linear-gradient(135deg, ${APP_ACCENTS.casa}, ${APP_ACCENTS.medical}, ${APP_ACCENTS.legal})`,
                  }}
                />

                <div className="relative">
                  <p
                    className="text-[10.5px] font-bold tracking-[0.18em] uppercase mb-3"
                    style={{ color: CURRENT_ACCENT }}
                  >
                    {t('hub.pros.eyebrow')}
                  </p>
                  <h2 className="text-2xl md:text-[32px] font-bold text-white mb-3 tracking-tight leading-tight">
                    {t('hub.pros.title')}
                  </h2>
                  <p className="text-[15px] md:text-base text-white/65 leading-relaxed max-w-2xl mb-8">
                    {t('hub.pros.subtitle')}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8">
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

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      to="/auth?mode=signup&role=provider"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                      style={{
                        background: `linear-gradient(135deg, ${CURRENT_ACCENT} 0%, ${CURRENT_ACCENT}dd 100%)`,
                        color: '#fff',
                        boxShadow: `0 8px 24px -10px ${CURRENT_ACCENT}aa`,
                      }}
                    >
                      <span>{t('hub.pros.ctaPrimary')}</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    <Link
                      to="/feed"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-white/15 text-white/85 hover:text-white hover:border-white/30 transition-all"
                    >
                      <span>{t('hub.pros.ctaSecondary')}</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <BusinessOperatingSection />

          {/* Why Baise Group */}
          <section
            className="relative px-4 sm:px-6 py-14 md:py-20"
            style={{
              borderTop: `1px solid ${BORDER}`,
              borderBottom: `1px solid ${BORDER}`,
              backgroundColor: 'hsl(0 0% 5%)',
            }}
          >
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <p
                  className="text-[10.5px] font-bold tracking-[0.18em] uppercase mb-3"
                  style={{ color: CURRENT_ACCENT }}
                >
                  {t('hub.benefits.eyebrow')}
                </p>
                <h2 className="text-3xl md:text-[40px] font-bold text-white tracking-tight">
                  {t('hub.benefits.title')}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
                <BenefitCard
                  icon={ShieldCheck}
                  title={t('hub.benefits.verified.title')}
                  desc={t('hub.benefits.verified.desc')}
                />
                <BenefitCard
                  icon={Globe2}
                  title={t('hub.benefits.bilingual.title')}
                  desc={t('hub.benefits.bilingual.desc')}
                />
                <BenefitCard
                  icon={Lock}
                  title={t('hub.benefits.secure.title')}
                  desc={t('hub.benefits.secure.desc')}
                />
                <BenefitCard
                  icon={Compass}
                  title={t('hub.benefits.local.title')}
                  desc={t('hub.benefits.local.desc')}
                />
              </div>
            </div>
          </section>

          <ClientRecordsSection />

          {/* Trust strip */}
          <section className="relative px-4 sm:px-6 py-12 md:py-16">
            <div className="max-w-5xl mx-auto text-center">
              <p
                className="text-[10.5px] font-bold tracking-[0.18em] uppercase text-white/40 mb-5"
              >
                {t('hub.trust.eyebrow')}
              </p>
              <p className="text-xl md:text-2xl text-white/85 leading-relaxed font-medium tracking-tight">
                {t('hub.trust.line')}
              </p>
            </div>
          </section>

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
              className="flex items-center gap-5"
              aria-label={t('hub.footer.label')}
            >
              <Link
                to="/discover"
                className="hover:text-white transition-colors"
              >
                {t('hub.footer.discover')}
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                {t('hub.footer.terms')}
              </Link>
              <Link to="/privacy" className="hover:text-white transition-colors">
                {t('hub.footer.privacy')}
              </Link>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}

function PainPointsSection() {
  return (
    <section
      className="relative px-4 sm:px-6 pb-14 md:pb-20"
      aria-labelledby="pain-points-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div
          className="relative overflow-hidden rounded-2xl p-6 md:p-8"
          style={{
            background:
              'linear-gradient(135deg, hsl(0 0% 10%) 0%, hsl(0 0% 6%) 100%)',
            border: `1px solid ${BORDER}`,
          }}
        >
          <div className="mb-7 grid gap-4 md:grid-cols-[0.78fr_1.22fr] md:items-end">
            <div>
              <p
                className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em]"
                style={{ color: CURRENT_ACCENT }}
              >
                Pain points
              </p>
              <h2
                id="pain-points-heading"
                className="text-3xl font-bold leading-tight tracking-tight text-white md:text-[42px]"
              >
                What makes hiring feel risky.
              </h2>
            </div>
            <p className="max-w-2xl text-[15px] leading-relaxed text-white/62 md:text-base">
              Before Baise, the hard part is not choosing a category. It is proving who is trustworthy,
              what it costs, where the conversation lives, and whether the payment will be handled safely.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {PAIN_POINTS.map((painPoint, index) => (
              <article
                key={painPoint.title}
                className="rounded-2xl border border-white/12 bg-white/[0.055] p-5 text-left"
              >
                <span
                  className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-black"
                  style={{ backgroundColor: CURRENT_ACCENT }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mb-2 text-[16px] font-bold tracking-tight text-white">
                  {painPoint.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-white/58">
                  {painPoint.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonTableSection() {
  return (
    <section
      className="relative px-4 sm:px-6 pb-14 md:pb-20"
      aria-labelledby="comparison-heading"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 grid gap-4 md:grid-cols-[0.82fr_1.18fr] md:items-end">
          <div>
            <p
              className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em]"
              style={{ color: CURRENT_ACCENT }}
            >
              Better than scattered research
            </p>
            <h2
              id="comparison-heading"
              className="text-3xl font-bold leading-tight tracking-tight text-white md:text-[42px]"
            >
              Built for national and international users who need proof.
            </h2>
          </div>
          <div className="space-y-4">
            <p className="text-[15px] leading-relaxed text-white/62 md:text-base">
              Baise brings marketplace trust, social proof, payments, records, and business tools
              into one workflow, while search, videos, referrals, and DIY projects leave users
              stitching the risky parts together themselves.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/discover"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-black transition-all hover:-translate-y-0.5 hover:bg-white/90"
              >
                Compare providers
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/auth?mode=signup&role=provider"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/85 transition-all hover:-translate-y-0.5 hover:border-white/30 hover:text-white"
              >
                List your business
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-[1020px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.055]">
                  <th className="w-[180px] px-4 py-4 text-xs font-black uppercase tracking-[0.14em] text-white/55">
                    Benefit
                  </th>
                  <th className="w-[230px] px-4 py-4 text-xs font-black uppercase tracking-[0.14em] text-white">
                    Baise apps
                  </th>
                  <th className="px-4 py-4 text-xs font-black uppercase tracking-[0.14em] text-white/45">
                    YouTube
                  </th>
                  <th className="px-4 py-4 text-xs font-black uppercase tracking-[0.14em] text-white/45">
                    Referrals
                  </th>
                  <th className="px-4 py-4 text-xs font-black uppercase tracking-[0.14em] text-white/45">
                    DIY projects
                  </th>
                  <th className="px-4 py-4 text-xs font-black uppercase tracking-[0.14em] text-white/45">
                    Google searches
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.benefit} className="border-b border-white/10 last:border-b-0">
                    <th className="align-top px-4 py-4 text-sm font-bold text-white">
                      {row.benefit}
                    </th>
                    <td className="align-top px-4 py-4 text-[13px] leading-relaxed text-white/78">
                      <span className="flex items-start gap-2">
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0"
                          style={{ color: CURRENT_ACCENT }}
                          aria-hidden="true"
                        />
                        <span>{row.baise}</span>
                      </span>
                    </td>
                    <td className="align-top px-4 py-4 text-[13px] leading-relaxed text-white/48">
                      {row.youtube}
                    </td>
                    <td className="align-top px-4 py-4 text-[13px] leading-relaxed text-white/48">
                      {row.referrals}
                    </td>
                    <td className="align-top px-4 py-4 text-[13px] leading-relaxed text-white/48">
                      {row.diy}
                    </td>
                    <td className="align-top px-4 py-4 text-[13px] leading-relaxed text-white/48">
                      {row.google}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProofSection() {
  return (
    <section
      className="relative px-4 sm:px-6 pb-14 md:pb-20"
      aria-label="Baise Group social proof"
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
                Social proof
              </p>
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-white md:text-[32px]">
                Floating reviews that make trust visible.
              </h2>
              <p className="text-[15px] leading-relaxed text-white/60">
                The homepage now carries the quick confidence cues visitors expect before they click
                into a category, profile, quote, or booking flow.
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
                        <p className="text-sm font-black text-white">Google Reviews</p>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/38">
                          Sample review
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
                      "{review.body}"
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
                        <p className="text-[11px] text-white/45">{review.role}</p>
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
              Platform preview
            </p>
            <h2
              id="platform-preview-heading"
              className="text-3xl font-bold leading-tight tracking-tight text-white md:text-[42px]"
            >
              Screens from the experience users step into.
            </h2>
          </div>
          <Link
            to="/discover"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/85 transition-all hover:-translate-y-0.5 hover:border-white/30 hover:text-white md:self-auto"
          >
            Start exploring
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {PLATFORM_SCREENSHOTS.map((screenshot) => (
            <article
              key={screenshot.title}
              className="overflow-hidden rounded-2xl border border-white/12 bg-white/[0.045] shadow-2xl"
            >
              <div className="aspect-[16/10] overflow-hidden bg-black">
                <img
                  src={screenshot.src}
                  alt={screenshot.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <h3 className="mb-2 text-lg font-bold tracking-tight text-white">
                  {screenshot.title}
                </h3>
                <p className="mb-4 text-[13.5px] leading-relaxed text-white/58">
                  {screenshot.body}
                </p>
                <Link
                  to={screenshot.to}
                  className="inline-flex items-center gap-2 text-sm font-bold transition-colors hover:text-white"
                  style={{ color: CURRENT_ACCENT }}
                >
                  {screenshot.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BusinessOperatingSection() {
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
              Provider business command center
            </p>
            <h2
              id="business-operating-heading"
              className="text-3xl font-bold leading-tight tracking-tight text-white md:text-[42px]"
            >
              Service providers can run the full business from Baise.
            </h2>
          </div>
          <div className="space-y-4">
            <p className="text-[15px] leading-relaxed text-white/62 md:text-base">
              The platform is positioned as more than a listing. It connects client acquisition,
              marketing, invoicing, payment processing, reviews, coupons, inspections, campaigns,
              referrals, receipts, tax records, and executive metrics in one operating layer.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/auth?mode=signup&role=provider"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: CURRENT_ACCENT }}
              >
                Start provider account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/85 transition-all hover:-translate-y-0.5 hover:border-white/30 hover:text-white"
              >
                Compare upgrades
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {BUSINESS_FEATURES.map((feature) => (
              <OperatingFeatureCard key={feature.title} {...feature} />
            ))}
          </div>

          <aside className="rounded-2xl border border-white/12 bg-white/[0.055] p-5 md:p-6">
            <p
              className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em]"
              style={{ color: CURRENT_ACCENT }}
            >
              Paid growth features
            </p>
            <h3 className="mb-3 text-2xl font-bold tracking-tight text-white">
              Upgrade for verified trust and influencer analytics.
            </h3>
            <p className="mb-5 text-[14px] leading-relaxed text-white/58">
              Advanced provider accounts can highlight stronger trust signals and deeper social
              performance for sponsors, creators, agencies, and service businesses building content.
            </p>
            <div className="space-y-3">
              {UPGRADE_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="flex gap-3 rounded-xl bg-black/28 p-3">
                    <span
                      className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${CURRENT_ACCENT}22`,
                        border: `1px solid ${CURRENT_ACCENT}33`,
                      }}
                    >
                      <Icon className="h-4 w-4" style={{ color: CURRENT_ACCENT }} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-white">{feature.title}</span>
                      <span className="block text-[12.5px] leading-relaxed text-white/55">
                        {feature.body}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
            <Link
              to="/subscription"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-black transition-all hover:-translate-y-0.5 hover:bg-white/90"
            >
              Upgrade provider tools
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}

function ClientRecordsSection() {
  return (
    <section
      className="relative px-4 sm:px-6 py-14 md:py-20"
      aria-labelledby="client-records-heading"
      style={{
        borderTop: `1px solid ${BORDER}`,
        borderBottom: `1px solid ${BORDER}`,
        backgroundColor: 'hsl(0 0% 5%)',
      }}
    >
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p
            className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em]"
            style={{ color: CURRENT_ACCENT }}
          >
            Client records
          </p>
          <h2
            id="client-records-heading"
            className="mb-4 text-3xl font-bold leading-tight tracking-tight text-white md:text-[42px]"
          >
            Every receipt, invoice, and proof record stays within reach.
          </h2>
          <p className="mb-6 text-[15px] leading-relaxed text-white/62 md:text-base">
            Clients can keep a full transaction history for personal proof, business expense
            tracking, tax organization, and repeat-service planning across national and
            international use cases.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/auth?mode=signup"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: CURRENT_ACCENT }}
            >
              Create client account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/payments"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/85 transition-all hover:-translate-y-0.5 hover:border-white/30 hover:text-white"
            >
              View payment history
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            {CLIENT_RECORD_FEATURES.map((feature) => (
              <OperatingFeatureCard key={feature.title} {...feature} />
            ))}
          </div>
          <div className="rounded-2xl border border-white/12 bg-white/[0.045] p-5">
            <p className="mb-3 text-sm font-bold text-white">Download presets and filters</p>
            <div className="flex flex-wrap gap-2">
              {['Monthly', 'MTD', 'Annual', 'Bulk export', 'Custom filters', 'Receipts', 'Invoices', 'Tax proof'].map((preset) => (
                <span
                  key={preset}
                  className="rounded-full border border-white/12 bg-black/25 px-3 py-1.5 text-xs font-semibold text-white/70"
                >
                  {preset}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
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
            FAQ
          </p>
          <h2
            id="faq-heading"
            className="text-3xl font-bold leading-tight tracking-tight text-white md:text-[42px]"
          >
            Quick answers before users choose a path.
          </h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-white/12 bg-white/[0.045] p-5"
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-bold text-white">
                {item.question}
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/12 text-sm transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-white/58">
                {item.answer}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/discover"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-black transition-all hover:-translate-y-0.5 hover:bg-white/90"
          >
            Find a trusted pro
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/auth?mode=signup&role=provider"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/85 transition-all hover:-translate-y-0.5 hover:border-white/30 hover:text-white"
          >
            Grow as a provider
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PaymentMethodsSection() {
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
            Trusted payment methods
          </p>
          <h2
            id="payment-methods-heading"
            className="text-3xl font-bold tracking-tight text-white md:text-[40px]"
          >
            Familiar payment signals at the finish line.
          </h2>
        </div>
        <div
          className="baise-logo-marquee relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          aria-label="Accepted payment methods"
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
            Trusted by over 30,000 small business, agencies and global users worldwide
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

interface OperatingFeatureCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  body: string;
}

function OperatingFeatureCard({ icon: Icon, title, body }: OperatingFeatureCardProps) {
  return (
    <article className="rounded-2xl border border-white/12 bg-white/[0.045] p-5">
      <span
        className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${CURRENT_ACCENT}22`,
          border: `1px solid ${CURRENT_ACCENT}33`,
        }}
      >
        <Icon className="h-4 w-4" style={{ color: CURRENT_ACCENT }} aria-hidden="true" />
      </span>
      <h3 className="mb-2 text-[15px] font-bold tracking-tight text-white">{title}</h3>
      <p className="text-[13px] leading-relaxed text-white/55">{body}</p>
    </article>
  );
}

interface BenefitCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
}

function BenefitCard({ icon: Icon, title, desc }: BenefitCardProps) {
  return (
    <div
      className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        backgroundColor: 'hsl(0 0% 9%)',
        border: '1px solid hsl(0 0% 16%)',
      }}
    >
      <div
        className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4"
        style={{
          backgroundColor: 'hsl(0 0% 14%)',
          border: '1px solid hsl(0 0% 22%)',
        }}
      >
        <Icon className="w-5 h-5 text-white" aria-hidden="true" />
      </div>
      <h3 className="font-semibold text-white mb-1.5 text-[15px] tracking-tight">
        {title}
      </h3>
      <p className="text-[13.5px] text-white/55 leading-relaxed">{desc}</p>
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

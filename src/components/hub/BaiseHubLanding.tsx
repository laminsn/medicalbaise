import type { ComponentType, SVGProps } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Globe2,
  Lock,
  KeyRound,
  Sparkles,
  Compass,
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
            <div
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] mb-7 px-3.5 py-1.5 rounded-full border"
              style={{
                borderColor: `${CURRENT_ACCENT}55`,
                color: CURRENT_ACCENT,
                backgroundColor: `${CURRENT_ACCENT}10`,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('hub.heroBadge')}</span>
            </div>
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
          </section>

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

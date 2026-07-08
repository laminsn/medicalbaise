import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBaiseAppKey } from '@/lib/providerCommunication';

const brandNames = {
  casa: 'Casa Baise',
  medical: 'MD Baise',
  legal: 'Legal Baise',
} as const;

const footerLinks = [
  { to: '/blog', key: 'footer.blog', fallback: 'Blog' },
  { to: '/influencer-partners', key: 'footer.partners', fallback: 'Partners' },
  { to: '/give-a-month-get-a-month', key: 'footer.referrals', fallback: 'Referrals' },
  { to: '/testimonial-request', key: 'footer.testimonials', fallback: 'Testimonials' },
  { to: '/pricing', key: 'footer.specialOffers', fallback: 'Special Offers' },
  { to: '/terms', key: 'footer.terms', fallback: 'Terms of Service' },
  { to: '/privacy', key: 'footer.privacy', fallback: 'Privacy Policy' },
];

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const brandName = brandNames[getBaiseAppKey()];

  return (
    <footer className="mt-auto border-t border-border bg-card/50 px-4 py-7">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground" aria-label={t('footer.label', 'Footer')}>
          {footerLinks.map((link) => (
            <Link key={link.to} to={link.to} className="hover:text-foreground transition-colors">
              {t(link.key, link.fallback)}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground">
          © {currentYear} {brandName}. {t('footer.rights', 'All rights reserved.')}
        </p>
      </div>
    </footer>
  );
}

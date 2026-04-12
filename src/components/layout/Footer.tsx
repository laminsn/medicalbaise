import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/50 px-4 py-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground transition-colors">
            {t('footer.terms', 'Terms of Service')}
          </Link>
          <span className="hidden sm:inline">|</span>
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            {t('footer.privacy', 'Privacy Policy')}
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          © {currentYear} Medical Baise. {t('footer.rights', 'All rights reserved.')}
        </p>
      </div>
    </footer>
  );
}

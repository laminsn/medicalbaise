import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

const HTML_LANG: Record<string, string> = {
  en: 'en',
  pt: 'pt-BR',
  es: 'es',
};

function applyHtmlLang(code: string) {
  if (typeof document === 'undefined') return;
  const language = (code || 'pt').split('-')[0];
  document.documentElement.lang = HTML_LANG[language] || language;
}

export function LanguageSelector() {
  const { t, i18n } = useTranslation();

  const resolved = i18n.resolvedLanguage || i18n.language || '';
  const currentLanguage =
    languages.find((lang) => resolved.startsWith(lang.code)) ||
    languages.find((lang) => lang.code === 'pt') ||
    languages[0];

  const pickLanguage = (code: string) => {
    void i18n.changeLanguage(code);
    applyHtmlLang(code);
    try {
      localStorage.setItem('i18nextLng', code);
    } catch {
      // localStorage unavailable (private mode) — language change still applied via i18n.
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          aria-label={t('language.changeLanguage')}
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onSelect={(event) => {
              event.preventDefault();
              pickLanguage(lang.code);
            }}
            className={resolved.startsWith(lang.code) ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

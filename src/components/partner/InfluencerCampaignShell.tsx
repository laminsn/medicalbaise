import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';

interface InfluencerCampaignShellProps {
  brand: string;
  children: ReactNode;
}

export function InfluencerCampaignShell({ brand, children }: InfluencerCampaignShellProps) {
  const { i18n } = useTranslation();
  const isPortuguese = (i18n.resolvedLanguage || i18n.language || '').toLowerCase().startsWith('pt');
  const copyright = isPortuguese ? 'Todos os direitos reservados.' : 'All rights reserved.';

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0b0d] text-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3" aria-label={brand}>
          <img src="/baise-logo.svg" alt="" className="h-9 w-9 rounded-md shadow-lg shadow-black/20" />
          <span className="text-sm font-semibold tracking-tight text-white sm:text-base">{brand}</span>
        </div>
        <div className="rounded-md border border-white/12 bg-white/[0.06] [&_button]:text-white [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
          <LanguageSelector />
        </div>
      </div>

      <main className="flex-1">{children}</main>

      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/42">
        © {new Date().getFullYear()} {brand}. {copyright}
      </div>
    </div>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, Megaphone, ReceiptText, Share2, WalletCards } from 'lucide-react';
import { PageMetadata } from '@/components/seo/PageMetadata';
import { Button } from '@/components/ui/button';
import { PartnerCampaignCommandCenter } from '@/components/partner/PartnerCampaignCommandCenter';
import { useAuth } from '@/hooks/useAuth';
import { getBaiseAppKey } from '@/lib/providerCommunication';

const brandTitle = {
  casa: 'Casa Baise',
  medical: 'Medical Baise',
  legal: 'Legal Baise',
} as const;

const partnerNav = [
  { label: 'Dashboard', href: '#partner-overview', icon: Megaphone },
  { label: 'Campaigns', href: '#partner-campaigns', icon: Share2 },
  { label: 'Payouts', href: '#partner-payouts', icon: WalletCards },
  { label: 'Receipts', href: '#partner-receipts', icon: ReceiptText },
] as const;

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { signOut } = useAuth();
  const appKey = getBaiseAppKey();
  const brand = brandTitle[appKey];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <PageMetadata page="partner-dashboard" locale={i18n.resolvedLanguage || i18n.language} path="/partner-dashboard" noIndex />

      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="min-w-0">
              <span className="block text-sm font-semibold text-muted-foreground">{brand}</span>
              <span className="block truncate text-xl font-semibold tracking-tight">Partner Portal</span>
            </Link>
            <Button type="button" variant="ghost" size="sm" className="gap-2 lg:hidden" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>

          <nav aria-label="Partner portal sections" className="flex gap-1 overflow-x-auto">
            {partnerNav.map(({ label, href, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {label}
              </a>
            ))}
          </nav>

          <Button type="button" variant="outline" size="sm" className="hidden gap-2 lg:inline-flex" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <PartnerCampaignCommandCenter />
      </main>
    </div>
  );
}

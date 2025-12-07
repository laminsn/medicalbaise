import { ReactNode } from 'react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { PromoBanner } from './PromoBanner';

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showNav?: boolean;
}

export function AppLayout({ children, showHeader = true, showNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PromoBanner />
      {showHeader && <Header />}
      <main className={`flex-1 ${showNav ? 'pb-20' : ''}`}>
        {children}
      </main>
      {showNav && <MobileNav />}
    </div>
  );
}
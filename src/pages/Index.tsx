import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { ProTierBanner } from '@/components/home/ProTierBanner';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProviders } from '@/components/home/FeaturedProviders';
import { RecentJobs } from '@/components/home/RecentJobs';
import { PromoSection } from '@/components/home/PromoSection';
import AIChatBot from '@/components/chat/AIChatBot';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Brasil Base - Find Trusted Home Service Professionals</title>
        <meta name="description" content="Connect with verified plumbers, electricians, cleaners, and more. Get competitive bids or book directly. Trusted by thousands across Brazil." />
      </Helmet>
      <AppLayout>
        <main className="flex flex-col min-h-screen">
          <HeroSection />
          <ProTierBanner />
          <CategoryGrid />
          <FeaturedProviders />
          <RecentJobs />
          <PromoSection />
        </main>
        <AIChatBot />
      </AppLayout>
    </>
  );
};

export default Index;

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
        <title>MedicalBase by Baise - Find Trusted Medical Service Professionals</title>
        <meta name="description" content="Connect with verified medical professionals and healthcare providers. Get competitive quotes or book directly. Trusted by thousands." />
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

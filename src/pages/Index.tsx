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
        <title>MD Baise - Find Trusted Doctors & Healthcare Professionals</title>
        <meta name="description" content="Connect with verified doctors, specialists, and healthcare providers. Book consultations, teleconsultations, and appointments. Trusted by thousands of patients." />
        <meta name="keywords" content="doctors, healthcare, medical, consultation, teleconsultation, appointment, specialist, clinic" />
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

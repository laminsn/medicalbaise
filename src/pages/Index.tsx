import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { ProTierBanner } from '@/components/home/ProTierBanner';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProviders } from '@/components/home/FeaturedProviders';
import { RecentAppointments } from '@/components/home/RecentAppointments';
import { PromoSection } from '@/components/home/PromoSection';
import AIChatBot from '@/components/chat/AIChatBot';
import { useTranslation } from 'react-i18next';

const Index = () => {
  const { i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');

  const title = isPt
    ? 'MD Baise - Encontre médicos e profissionais de saúde de confiança'
    : isEs
      ? 'MD Baise - Encuentra médicos y profesionales de salud de confianza'
      : 'MD Baise - Find Trusted Doctors & Healthcare Professionals';

  const description = isPt
    ? 'Conecte-se com médicos, especialistas e profissionais de saúde verificados. Agende consultas presenciais e teleconsultas. Confiado por milhares de pacientes.'
    : isEs
      ? 'Conéctate con médicos, especialistas y profesionales de salud verificados. Agenda consultas presenciales y teleconsultas. Con la confianza de miles de pacientes.'
      : 'Connect with verified doctors, specialists, and healthcare providers. Book consultations, teleconsultations, and appointments. Trusted by thousands of patients.';

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content="doctors, healthcare, medical, consultation, teleconsultation, appointment, specialist, clinic" />
      </Helmet>
      <AppLayout>
        <main className="flex flex-col min-h-screen">
          <HeroSection />
          <ProTierBanner />
          <CategoryGrid />
          <FeaturedProviders />
          <RecentAppointments />
          <PromoSection />
        </main>
        <AIChatBot />
      </AppLayout>
    </>
  );
};

export default Index;

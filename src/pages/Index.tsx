import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { HomeTrustStrip } from '@/components/home/HomeTrustStrip';
import { ProTierBanner } from '@/components/home/ProTierBanner';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProviders } from '@/components/home/FeaturedProviders';
import { RecentAppointments } from '@/components/home/RecentAppointments';
import { PromoSection } from '@/components/home/PromoSection';
import { AgentConnectSection } from '@/components/home/AgentConnectSection';
import AIChatBot from '@/components/chat/AIChatBot';
import { useTranslation } from 'react-i18next';

const Index = () => {
  const { i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');

  const title = isPt
    ? 'MD Baise - Descubra prestadores de serviços de saúde'
    : isEs
      ? 'MD Baise - Descubre proveedores de servicios de salud'
      : 'MD Baise - Discover Healthcare Service Providers';

  const description = isPt
    ? 'Descubra perfis de prestadores, acompanhe stories e lives e solicite consultas. Prestadores também podem gerenciar relacionamentos com clientes, faturas e registros no portal.'
    : isEs
      ? 'Descubre perfiles de proveedores, mira historias y transmisiones en vivo y solicita citas. Los proveedores también pueden gestionar relaciones con clientes, facturas y registros en el portal.'
      : 'Discover provider profiles, watch stories and live video, and request appointments. Providers can also manage client relationships, invoices, and records in the portal.';

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content="healthcare service providers, provider stories, live video, appointments, provider CRM, invoices, medical services" />
      </Helmet>
      <AppLayout>
        <main className="flex flex-col min-h-screen">
          <HeroSection />
          <HomeTrustStrip />
          <ProTierBanner />
          <CategoryGrid />
          <FeaturedProviders />
          <RecentAppointments />
          <PromoSection />
          <AgentConnectSection />
        </main>
        <AIChatBot />
      </AppLayout>
    </>
  );
};

export default Index;

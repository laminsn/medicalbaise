export type AppKey = 'casa' | 'medical' | 'legal';
export type SeoLocale = 'en' | 'pt' | 'es';
export type PublicPageKey =
  | 'give-month'
  | 'influencer'
  | 'influencer-application'
  | 'testimonial'
  | 'referral'
  | 'referral-dashboard'
  | 'partner-dashboard'
  | 'partner-review'
  | 'pilot';

export type PublicPageSeo = {
  title: string;
  description: string;
  imageAlt: string;
};

export const BRAND_SEO: Record<AppKey, { name: string; url: string; twitter: string }> = {
  casa: {
    name: 'Casa Baise',
    url: 'https://www.casabaise.com',
    twitter: '@CasaBaise',
  },
  legal: {
    name: 'Legal Baise',
    url: 'https://www.legalbaise.com',
    twitter: '@LegalBaise',
  },
  medical: {
    name: 'MD Baise',
    url: 'https://www.mdbaise.com',
    twitter: '@MDBaise',
  },
};

export const LOCALE_META: Record<SeoLocale, { htmlLang: string; ogLocale: string }> = {
  en: { htmlLang: 'en', ogLocale: 'en_US' },
  pt: { htmlLang: 'pt-BR', ogLocale: 'pt_BR' },
  es: { htmlLang: 'es', ogLocale: 'es_ES' },
};

export const normalizeSeoLocale = (language?: string | null): SeoLocale => {
  const normalized = (language || '').toLowerCase();
  if (normalized.startsWith('pt')) return 'pt';
  if (normalized.startsWith('es')) return 'es';
  return 'en';
};

const appAudience = {
  casa: {
    en: 'trusted service providers in Brazil',
    pt: 'prestadores de serviço confiáveis no Brasil',
    es: 'prestadores de servicios confiables en Brasil',
  },
  legal: {
    en: 'trusted legal support in Brazil',
    pt: 'apoio jurídico confiável no Brasil',
    es: 'apoyo legal confiable en Brasil',
  },
  medical: {
    en: 'trusted medical support in Brazil',
    pt: 'apoio médico confiável no Brasil',
    es: 'apoyo médico confiable en Brasil',
  },
} as const;

export const PUBLIC_PAGE_SEO: Record<PublicPageKey, Record<SeoLocale, (app: AppKey) => PublicPageSeo>> = {
  pilot: {
    en: (app) => ({
      title: `Pilot Tester Program | ${BRAND_SEO[app].name}`,
      description: `Apply to join the ${BRAND_SEO[app].name} pilot. Twenty testers get 60 days of full professional account access to help us find problems before launch. No cost, no real payments, fictitious data only.`,
      imageAlt: `${BRAND_SEO[app].name} pilot tester program preview with 60 days of full professional access.`,
    }),
    pt: (app) => ({
      title: `Programa Piloto de Testadores | ${BRAND_SEO[app].name}`,
      description: `Inscreva-se no programa piloto da ${BRAND_SEO[app].name}. Vinte testadores recebem 60 dias de acesso profissional completo para nos ajudar a encontrar problemas antes do lançamento. Sem custo, sem pagamentos reais, apenas dados fictícios.`,
      imageAlt: `Prévia do programa piloto de testadores da ${BRAND_SEO[app].name} com 60 dias de acesso profissional completo.`,
    }),
    es: (app) => ({
      title: `Programa Piloto de Testers | ${BRAND_SEO[app].name}`,
      description: `Postúlate al programa piloto de ${BRAND_SEO[app].name}. Veinte testers reciben 60 días de acceso profesional completo para ayudarnos a encontrar problemas antes del lanzamiento. Sin costo, sin pagos reales, solo datos ficticios.`,
      imageAlt: `Vista previa del programa piloto de testers de ${BRAND_SEO[app].name} con 60 días de acceso profesional completo.`,
    }),
  },
  'give-month': {
    en: (app) => ({
      title: `Give a Month, Get a Month | ${BRAND_SEO[app].name}`,
      description: `Premium ${BRAND_SEO[app].name} members can give friends, family, clients, and providers a reason to join and earn one free premium month for every qualifying referral, up to 12 months per year.`,
      imageAlt: `${BRAND_SEO[app].name} Give a Month, Get a Month referral campaign preview.`,
    }),
    pt: (app) => ({
      title: `Indique um Mês, Ganhe um Mês | ${BRAND_SEO[app].name}`,
      description: `Membros premium da ${BRAND_SEO[app].name} podem indicar amigos, familiares, clientes e prestadores, ganhar um mês grátis por cada indicação premium qualificada e acumular até 12 meses por ano.`,
      imageAlt: `Prévia da campanha Indique um Mês, Ganhe um Mês da ${BRAND_SEO[app].name}.`,
    }),
    es: (app) => ({
      title: `Regala un Mes, Gana un Mes | ${BRAND_SEO[app].name}`,
      description: `Los miembros premium de ${BRAND_SEO[app].name} pueden invitar amigos, familiares, clientes y proveedores, ganar un mes gratis por cada referido premium calificado y acumular hasta 12 meses por año.`,
      imageAlt: `Vista previa de la campaña Regala un Mes, Gana un Mes de ${BRAND_SEO[app].name}.`,
    }),
  },
  influencer: {
    en: (app) => ({
      title: `Brazil Influencer Campaign | ${BRAND_SEO[app].name}`,
      description: `Apply to become a ${BRAND_SEO[app].name} Brazil influencer. Approved influencers and creators earn R$150 per approved post, viral bonuses, tracked commissions, and give their audience access to ${appAudience[app].en}.`,
      imageAlt: `${BRAND_SEO[app].name} Brazil influencer campaign preview with creator payouts and tracked commissions.`,
    }),
    pt: (app) => ({
      title: `Campanha de Influenciadores no Brasil | ${BRAND_SEO[app].name}`,
      description: `Inscreva-se para ser influenciador da ${BRAND_SEO[app].name} no Brasil. Influenciadores e criadores aprovados recebem R$150 por post aprovado, bônus viral, comissões rastreadas e ajudam o público a encontrar ${appAudience[app].pt}.`,
      imageAlt: `Prévia da campanha de influenciadores da ${BRAND_SEO[app].name} com pagamentos e comissões rastreadas.`,
    }),
    es: (app) => ({
      title: `Campaña de Influencers en Brasil | ${BRAND_SEO[app].name}`,
      description: `Postúlate para ser influencer de ${BRAND_SEO[app].name} en Brasil. Influencers y creadores aprobados ganan R$150 por publicación aprobada, bono viral, comisiones rastreadas y ayudan a su audiencia a encontrar ${appAudience[app].es}.`,
      imageAlt: `Vista previa de la campaña de influencers de ${BRAND_SEO[app].name} con pagos y comisiones rastreadas.`,
    }),
  },
  'influencer-application': {
    en: (app) => ({
      title: `Influencer Partner Application | ${BRAND_SEO[app].name}`,
      description: `Complete your ${BRAND_SEO[app].name} influencer partner application with platforms, followers, audience details, campaign fit, and payout information for the Brazil creator campaign.`,
      imageAlt: `${BRAND_SEO[app].name} influencer application preview for creator review and campaign approval.`,
    }),
    pt: (app) => ({
      title: `Inscrição de Influenciador Parceiro | ${BRAND_SEO[app].name}`,
      description: `Complete sua inscrição como influenciador parceiro da ${BRAND_SEO[app].name} com plataformas, seguidores, público, aderência à campanha e dados de pagamento.`,
      imageAlt: `Prévia da inscrição de influenciador parceiro da ${BRAND_SEO[app].name}.`,
    }),
    es: (app) => ({
      title: `Solicitud de Influencer Socio | ${BRAND_SEO[app].name}`,
      description: `Completa tu solicitud como influencer socio de ${BRAND_SEO[app].name} con plataformas, seguidores, audiencia, encaje de campaña y datos de pago.`,
      imageAlt: `Vista previa de la solicitud de influencer socio de ${BRAND_SEO[app].name}.`,
    }),
  },
  testimonial: {
    en: (app) => ({
      title: `Share Private Feedback | ${BRAND_SEO[app].name}`,
      description: `After a completed ${BRAND_SEO[app].name} appointment, you may share voluntary, honest feedback through your secure account. No payment, credit, discount, or benefit is offered.`,
      imageAlt: `${BRAND_SEO[app].name} voluntary private feedback request preview.`,
    }),
    pt: (app) => ({
      title: `Compartilhe Feedback Privado | ${BRAND_SEO[app].name}`,
      description: `Depois de uma consulta concluída na ${BRAND_SEO[app].name}, você pode compartilhar feedback voluntário e honesto pela sua conta segura. Nenhum pagamento, crédito, desconto ou benefício é oferecido.`,
      imageAlt: `Prévia do pedido de feedback privado e voluntário da ${BRAND_SEO[app].name}.`,
    }),
    es: (app) => ({
      title: `Comparte Comentarios Privados | ${BRAND_SEO[app].name}`,
      description: `Después de una cita completada en ${BRAND_SEO[app].name}, puedes compartir comentarios voluntarios y honestos mediante tu cuenta segura. No se ofrece pago, crédito, descuento o beneficio.`,
      imageAlt: `Vista previa de comentarios privados y voluntarios de ${BRAND_SEO[app].name}.`,
    }),
  },
  referral: {
    en: (app) => ({
      title: `Your Referral Invitation | ${BRAND_SEO[app].name}`,
      description: `Accept a ${BRAND_SEO[app].name} referral invitation to find ${appAudience[app].en}, create one secure account, and keep requests, invoices, receipts, reviews, and service history together.`,
      imageAlt: `${BRAND_SEO[app].name} referral invitation preview for trusted services and account setup.`,
    }),
    pt: (app) => ({
      title: `Seu Convite de Indicação | ${BRAND_SEO[app].name}`,
      description: `Aceite um convite de indicação da ${BRAND_SEO[app].name} para encontrar ${appAudience[app].pt}, criar uma conta segura e manter solicitações, faturas, recibos, avaliações e histórico juntos.`,
      imageAlt: `Prévia do convite de indicação da ${BRAND_SEO[app].name}.`,
    }),
    es: (app) => ({
      title: `Tu Invitación de Referido | ${BRAND_SEO[app].name}`,
      description: `Acepta una invitación de referido de ${BRAND_SEO[app].name} para encontrar ${appAudience[app].es}, crear una cuenta segura y mantener solicitudes, facturas, recibos, reseñas e historial juntos.`,
      imageAlt: `Vista previa de la invitación de referido de ${BRAND_SEO[app].name}.`,
    }),
  },
  'referral-dashboard': {
    en: (app) => ({
      title: `Referral Dashboard | ${BRAND_SEO[app].name}`,
      description: `Share your ${BRAND_SEO[app].name} referral link, QR code, and client ID, track referrals, and manage earned credits from one secure account dashboard.`,
      imageAlt: `${BRAND_SEO[app].name} referral dashboard preview with link, QR code, and credits.`,
    }),
    pt: (app) => ({
      title: `Painel de Indicações | ${BRAND_SEO[app].name}`,
      description: `Compartilhe seu link, QR code e ID de cliente da ${BRAND_SEO[app].name}, acompanhe indicações e gerencie créditos em um painel seguro.`,
      imageAlt: `Prévia do painel de indicações da ${BRAND_SEO[app].name}.`,
    }),
    es: (app) => ({
      title: `Panel de Referidos | ${BRAND_SEO[app].name}`,
      description: `Comparte tu enlace, código QR e ID de cliente de ${BRAND_SEO[app].name}, rastrea referidos y administra créditos desde un panel seguro.`,
      imageAlt: `Vista previa del panel de referidos de ${BRAND_SEO[app].name}.`,
    }),
  },
  'partner-dashboard': {
    en: (app) => ({
      title: `Partner Portal | ${BRAND_SEO[app].name}`,
      description: `Approved ${BRAND_SEO[app].name} partners can view campaigns, links, QR codes, custom codes, monthly earnings, payouts, receipts, and conversion results from one clean portal.`,
      imageAlt: `${BRAND_SEO[app].name} partner portal preview with campaigns, payouts, and receipts.`,
    }),
    pt: (app) => ({
      title: `Portal de Parceiros | ${BRAND_SEO[app].name}`,
      description: `Parceiros aprovados da ${BRAND_SEO[app].name} podem ver campanhas, links, QR codes, códigos personalizados, ganhos mensais, pagamentos, recibos e conversões em um portal simples.`,
      imageAlt: `Prévia do portal de parceiros da ${BRAND_SEO[app].name}.`,
    }),
    es: (app) => ({
      title: `Portal de Socios | ${BRAND_SEO[app].name}`,
      description: `Los socios aprobados de ${BRAND_SEO[app].name} pueden ver campañas, enlaces, códigos QR, códigos personalizados, ganancias mensuales, pagos, recibos y conversiones en un portal simple.`,
      imageAlt: `Vista previa del portal de socios de ${BRAND_SEO[app].name}.`,
    }),
  },
  'partner-review': {
    en: (app) => ({
      title: `Partner Review Queue | ${BRAND_SEO[app].name}`,
      description: `Authorized ${BRAND_SEO[app].name} staff can review partner and influencer applications, approve campaign access, waitlist applicants, and keep vetting decisions organized.`,
      imageAlt: `${BRAND_SEO[app].name} partner review queue preview for staff approvals.`,
    }),
    pt: (app) => ({
      title: `Fila de Revisão de Parceiros | ${BRAND_SEO[app].name}`,
      description: `Equipes autorizadas da ${BRAND_SEO[app].name} podem revisar inscrições de parceiros e influenciadores, aprovar campanhas, colocar candidatos em espera e organizar decisões.`,
      imageAlt: `Prévia da fila de revisão de parceiros da ${BRAND_SEO[app].name}.`,
    }),
    es: (app) => ({
      title: `Cola de Revisión de Socios | ${BRAND_SEO[app].name}`,
      description: `El equipo autorizado de ${BRAND_SEO[app].name} puede revisar solicitudes de socios e influencers, aprobar campañas, poner candidatos en lista de espera y organizar decisiones.`,
      imageAlt: `Vista previa de la cola de revisión de socios de ${BRAND_SEO[app].name}.`,
    }),
  },
};

export const getPublicPageSeo = (page: PublicPageKey, app: AppKey, locale: SeoLocale): PublicPageSeo =>
  PUBLIC_PAGE_SEO[page][locale](app);

export const publicPageImagePath = (page: PublicPageKey, locale: SeoLocale) => `/og/${page}-${locale}.png`;

export const localizedPublicPath = (path: string, locale: SeoLocale) => {
  if (locale === 'en') return path;
  return `/${locale}${path}`;
};

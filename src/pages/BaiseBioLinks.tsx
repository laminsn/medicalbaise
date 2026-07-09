import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  CalendarCheck,
  Gift,
  Globe2,
  Handshake,
  MessageCircle,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserRoundCheck,
  Youtube,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BAISE_BLOG_POSTS } from "@/content/baiseBlogPosts";
import { getBaiseAppKey, getBaiseAppUrl } from "@/lib/providerCommunication";
import { supabase } from "@/integrations/supabase/client";

type AppKey = "casa" | "medical" | "legal";
type LocaleKey = "en" | "pt";
type BioEventType = "page_view" | "cta_click" | "language_change";

type BioLink = {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  section: string;
  intent: "primary" | "promo" | "watch" | "quiet";
};

type BaiseBioLinksProps = {
  defaultLocale?: LocaleKey;
};

type BioRpcClient = {
  rpc: (fn: "track_bio_link_event", args: Record<string, unknown>) => Promise<{ data: string | null; error: unknown }>;
};

const brandProfiles: Record<AppKey, {
  name: string;
  shortName: string;
  domain: string;
  youtubeUrl: string;
  accent: string;
  ring: string;
  heroGradient: string;
  description: Record<LocaleKey, string>;
  promise: Record<LocaleKey, string>;
}> = {
  casa: {
    name: "Casa Baise",
    shortName: "Casa",
    domain: "https://www.casabaise.com",
    youtubeUrl: "https://www.youtube.com/@CasaBaise",
    accent: "text-emerald-200",
    ring: "ring-emerald-300/35",
    heroGradient: "from-emerald-400 via-teal-300 to-sky-400",
    description: {
      en: "Trusted pros for home, business, and everyday service needs in Brazil.",
      pt: "Profissionais confiaveis para casa, negocios e servicos do dia a dia no Brasil.",
    },
    promise: {
      en: "Find reliable help without guessing who to trust.",
      pt: "Encontre ajuda confiavel sem precisar adivinhar em quem confiar.",
    },
  },
  medical: {
    name: "Medical Baise",
    shortName: "Medical",
    domain: "https://www.mdbaise.com",
    youtubeUrl: "https://www.youtube.com/@MDBaise",
    accent: "text-cyan-200",
    ring: "ring-cyan-300/35",
    heroGradient: "from-cyan-300 via-blue-300 to-emerald-300",
    description: {
      en: "Clearer access to trusted medical support, records, and next steps.",
      pt: "Acesso mais claro a apoio medico confiavel, registros e proximos passos.",
    },
    promise: {
      en: "Book care with more clarity, proof, and confidence.",
      pt: "Agende cuidados com mais clareza, prova e confianca.",
    },
  },
  legal: {
    name: "Legal Baise",
    shortName: "Legal",
    domain: "https://www.legalbaise.com",
    youtubeUrl: "https://www.youtube.com/@LegalBaise",
    accent: "text-amber-200",
    ring: "ring-amber-300/35",
    heroGradient: "from-amber-300 via-yellow-200 to-emerald-300",
    description: {
      en: "A calmer path to trusted legal support, documents, and consultations.",
      pt: "Um caminho mais claro para suporte juridico confiavel, documentos e consultas.",
    },
    promise: {
      en: "Get organized before money, documents, or decisions move.",
      pt: "Organize-se antes que dinheiro, documentos ou decisoes avancem.",
    },
  },
};

const copy = {
  en: {
    languageLabel: "Language",
    eyebrow: "Baise quick links",
    title: "Book trusted help, claim offers, and learn what to do next.",
    subtitle:
      "One focused place for calls, current promotions, practical videos, new guides, and client support.",
    trusted: "Trusted marketplace for Casa, Legal, and Medical support in Brazil.",
    topChoice: "Start with the best next step",
    moreWays: "More ways to move forward",
    chooseBrand: "Choose your Baise path",
    latestLearning: "Latest guides and videos",
    clientProof: "Trust signals",
    videoTitle: "New videos for smarter decisions",
    blogTitle: "Fresh blog guides",
    primaryCta: "Book a call or get matched",
    primaryDescription: "Tell us what you need and we will point you to the right Baise path.",
    promoCta: "Claim Give a Month, Get a Month",
    promoDescription: "Premium users can refer someone and earn up to 12 free months in a calendar year.",
    youtubeCta: "Watch latest YouTube content",
    youtubeDescription: "Short, practical guidance before you book, hire, refer, or grow.",
    portalCta: "Open the client portal",
    portalDescription: "Access messages, receipts, documents, bookings, and your service history.",
    blogCta: "Read the newest guides",
    blogDescription: "Helpful articles for choosing, booking, paying, and keeping clean records.",
    providerCta: "Grow as a service provider",
    providerDescription: "Create your provider account and manage leads, payments, reviews, and campaigns.",
    partnerCta: "Become a partner or influencer",
    partnerDescription: "Apply for approved campaigns with tracked links, codes, payouts, and rules.",
    referralCta: "Share your referral link",
    referralDescription: "Give a month, get a month when eligible premium referrals convert.",
    testimonialCta: "Send a testimonial",
    testimonialDescription: "Submit a Google review or video testimonial for future service credit.",
    successCta: "Talk to Client Success",
    successDescription: "Need help choosing the right next step? Start here.",
    brandLabels: {
      casa: "Home and local services",
      medical: "Medical support",
      legal: "Legal support",
    },
    videoCards: [
      "How to choose trusted help in Brazil",
      "What to keep in your service records",
      "How providers can turn trust into booked work",
    ],
    metaTitle: "Baise Links | Book trusted help, offers, videos and guides",
    metaDescription:
      "Start with Baise quick links for booking calls, promotions, YouTube content, latest blog posts, referrals, testimonials, and client support.",
  },
  pt: {
    languageLabel: "Idioma",
    eyebrow: "Links rapidos Baise",
    title: "Agende ajuda confiavel, resgate ofertas e saiba o proximo passo.",
    subtitle:
      "Um lugar direto para chamadas, promocoes atuais, videos praticos, novos guias e suporte ao cliente.",
    trusted: "Marketplace confiavel para suporte Casa, Legal e Medical no Brasil.",
    topChoice: "Comece pelo melhor proximo passo",
    moreWays: "Mais formas de avancar",
    chooseBrand: "Escolha seu caminho Baise",
    latestLearning: "Guias e videos recentes",
    clientProof: "Sinais de confianca",
    videoTitle: "Novos videos para decisoes melhores",
    blogTitle: "Guias recentes no blog",
    primaryCta: "Agendar ou encontrar ajuda",
    primaryDescription: "Diga o que voce precisa e apontamos o melhor caminho Baise.",
    promoCta: "Resgatar Give a Month, Get a Month",
    promoDescription: "Usuarios premium podem indicar alguem e ganhar ate 12 meses gratis por ano.",
    youtubeCta: "Assistir conteudo no YouTube",
    youtubeDescription: "Orientacao curta e pratica antes de agendar, contratar, indicar ou crescer.",
    portalCta: "Abrir portal do cliente",
    portalDescription: "Acesse mensagens, recibos, documentos, agendamentos e historico de servicos.",
    blogCta: "Ler os guias mais recentes",
    blogDescription: "Artigos uteis para escolher, agendar, pagar e manter registros limpos.",
    providerCta: "Crescer como prestador",
    providerDescription: "Crie sua conta e gerencie leads, pagamentos, avaliacoes e campanhas.",
    partnerCta: "Ser parceiro ou influenciador",
    partnerDescription: "Inscreva-se em campanhas aprovadas com links, codigos, pagamentos e regras.",
    referralCta: "Compartilhar seu link de indicacao",
    referralDescription: "Indique premium e ganhe um mes quando a indicacao elegivel converter.",
    testimonialCta: "Enviar depoimento",
    testimonialDescription: "Envie avaliacao Google ou video e receba credito futuro quando aprovado.",
    successCta: "Falar com Client Success",
    successDescription: "Precisa escolher o melhor proximo passo? Comece aqui.",
    brandLabels: {
      casa: "Servicos locais e para casa",
      medical: "Suporte medico",
      legal: "Suporte juridico",
    },
    videoCards: [
      "Como escolher ajuda confiavel no Brasil",
      "O que guardar nos seus registros de servico",
      "Como prestadores transformam confianca em trabalho",
    ],
    metaTitle: "Links Baise | Agendamentos, ofertas, videos e guias",
    metaDescription:
      "Comece pelos links rapidos Baise para agendar chamadas, ver promocoes, YouTube, blog, indicacoes, depoimentos e suporte.",
  },
} as const;

const supportedLocales: LocaleKey[] = ["pt", "en"];
type BrandProfile = (typeof brandProfiles)[AppKey];

const getSessionId = () => {
  if (typeof window === "undefined") return "server";
  const key = "baise-bio-link-session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const next = window.crypto?.randomUUID?.() || `bio-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(key, next);
  return next;
};

const appendTrackingParams = (href: string, ctaKey: string) => {
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return href;
  if (typeof window === "undefined") return href;

  const url = new URL(href, window.location.origin);
  const current = new URLSearchParams(window.location.search);
  url.searchParams.set("source", current.get("source") || current.get("utm_source") || "social_bio");
  url.searchParams.set("campaign", current.get("campaign") || current.get("utm_campaign") || "bio_link_hub");
  url.searchParams.set("cta", ctaKey);

  if (!href.startsWith("http")) return `${url.pathname}${url.search}${url.hash}`;
  return url.toString();
};

const LinkMascot = ({ brand }: { brand: BrandProfile }) => (
  <div className={`relative mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br ${brand.heroGradient} p-[2px] shadow-2xl shadow-black/35`}>
    <div className="flex h-full w-full items-center justify-center rounded-[1.85rem] bg-slate-950/88">
      <img src="/baise-logo.svg" alt="Baise" className="h-14 w-14 object-contain" />
    </div>
    <div className="absolute -right-3 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white text-slate-950 shadow-lg">
      <Sparkles className="h-4 w-4" aria-hidden="true" />
    </div>
    <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 bg-slate-950 px-3 py-1 text-[11px] font-semibold text-white shadow-lg">
      <Star className="h-3 w-3 fill-amber-300 text-amber-300" aria-hidden="true" />
      4.8
    </div>
  </div>
);

const BioButton = ({
  link,
  brand,
  onClick,
}: {
  link: BioLink;
  brand: BrandProfile;
  onClick: (link: BioLink) => void;
}) => {
  const Icon = link.icon;
  const href = appendTrackingParams(link.href, link.key);
  const isExternal = href.startsWith("http");
  const gradient =
    link.intent === "primary"
      ? brand.heroGradient
      : link.intent === "promo"
        ? "from-amber-300 via-yellow-200 to-emerald-300"
        : link.intent === "watch"
          ? "from-red-400 via-rose-300 to-orange-300"
          : "from-white/12 via-white/8 to-white/12";
  const textColor = link.intent === "quiet" ? "text-white" : "text-slate-950";

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      onClick={() => onClick(link)}
      className={`group flex min-h-[76px] w-full items-center gap-3 rounded-2xl border border-white/12 bg-gradient-to-r ${gradient} p-[2px] shadow-lg shadow-black/25 outline-none transition-[transform,box-shadow,border-color] duration-150 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/70`}
    >
      <span className="flex h-full min-h-[72px] w-full items-center gap-3 rounded-[0.9rem] bg-slate-950/10 px-4 py-3 backdrop-blur-sm">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/92 text-slate-950 shadow-sm">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className={`min-w-0 flex-1 ${textColor}`}>
          <span className="block text-sm font-black leading-tight sm:text-base">{link.label}</span>
          <span className={`mt-1 block text-xs leading-snug ${link.intent === "quiet" ? "text-white/70" : "text-slate-900/72"}`}>
            {link.description}
          </span>
        </span>
        <ArrowRight className={`h-5 w-5 shrink-0 transition-transform duration-150 ease-out group-hover:translate-x-0.5 ${textColor}`} aria-hidden="true" />
      </span>
    </a>
  );
};

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="px-1 text-xs font-black uppercase tracking-[0.18em] text-white/48">{children}</h2>
);

const BaiseBioLinks = ({ defaultLocale = "en" }: BaiseBioLinksProps) => {
  const appKey = getBaiseAppKey();
  const brand = brandProfiles[appKey];
  const appUrl = getBaiseAppUrl();
  const [locale, setLocale] = useState<LocaleKey>(defaultLocale);
  const [sessionId] = useState(getSessionId);
  const pageViewTracked = useRef(false);
  const text = copy[locale];
  const localizedPrefix = locale === "pt" ? "/pt" : "";

  const track = useCallback(
    (eventType: BioEventType, payload: Record<string, unknown> = {}) => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const body = {
        target_app_key: appKey,
        event_type: eventType,
        event_locale: locale,
        event_section: payload.section || null,
        event_cta_key: payload.ctaKey || null,
        event_cta_label: payload.label || null,
        event_destination_url: payload.href || null,
        event_source: params.get("source") || params.get("utm_source") || "social_bio",
        event_campaign: params.get("campaign") || params.get("utm_campaign") || "bio_link_hub",
        event_path: window.location.pathname,
        event_referrer: document.referrer || null,
        event_metadata: {
          ...payload,
          session_id: sessionId,
          utm_medium: params.get("utm_medium"),
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
        },
      };

      const analytics = (window as unknown as { analytics?: { track?: (event: string, data: Record<string, unknown>) => void } }).analytics;
      analytics?.track?.("baise_bio_link_event", body);
      void (async () => {
        try {
          await (supabase as unknown as BioRpcClient).rpc("track_bio_link_event", body);
        } catch {
          // Public analytics should never block the social-bio page.
        }
      })();
    },
    [appKey, locale, sessionId],
  );

  useEffect(() => {
    if (pageViewTracked.current) return;
    pageViewTracked.current = true;
    track("page_view", { section: "page", label: brand.name });
  }, [brand.name, track]);

  const primaryLinks = useMemo<BioLink[]>(
    () => [
      {
        key: "book_call_or_match",
        label: text.primaryCta,
        description: text.primaryDescription,
        href: "/auth?mode=signup&intent=book_call",
        icon: CalendarCheck,
        section: "primary",
        intent: "primary",
      },
      {
        key: "give_month_offer",
        label: text.promoCta,
        description: text.promoDescription,
        href: `${localizedPrefix}/give-a-month-get-a-month`,
        icon: Gift,
        section: "promotion",
        intent: "promo",
      },
      {
        key: "youtube_latest",
        label: text.youtubeCta,
        description: text.youtubeDescription,
        href: brand.youtubeUrl,
        icon: Youtube,
        section: "youtube",
        intent: "watch",
      },
    ],
    [brand.youtubeUrl, localizedPrefix, text],
  );

  const secondaryLinks = useMemo<BioLink[]>(
    () => [
      {
        key: "client_portal",
        label: text.portalCta,
        description: text.portalDescription,
        href: "/auth?mode=signin&redirect=/customer-dashboard",
        icon: ShieldCheck,
        section: "portal",
        intent: "quiet",
      },
      {
        key: "blog_index",
        label: text.blogCta,
        description: text.blogDescription,
        href: `${localizedPrefix}/blog`,
        icon: BookOpenText,
        section: "blog",
        intent: "quiet",
      },
      {
        key: "provider_signup",
        label: text.providerCta,
        description: text.providerDescription,
        href: "/auth?mode=signup&role=provider",
        icon: TrendingUp,
        section: "provider",
        intent: "quiet",
      },
      {
        key: "partner_influencer",
        label: text.partnerCta,
        description: text.partnerDescription,
        href: `${localizedPrefix}/influencer-partners`,
        icon: Handshake,
        section: "partner",
        intent: "quiet",
      },
      {
        key: "referral_offer",
        label: text.referralCta,
        description: text.referralDescription,
        href: `${localizedPrefix}/give-a-month-get-a-month`,
        icon: UserRoundCheck,
        section: "referral",
        intent: "quiet",
      },
      {
        key: "testimonial_request",
        label: text.testimonialCta,
        description: text.testimonialDescription,
        href: `${localizedPrefix}/testimonial-request`,
        icon: BadgeCheck,
        section: "testimonial",
        intent: "quiet",
      },
      {
        key: "client_success",
        label: text.successCta,
        description: text.successDescription,
        href: "/auth?mode=signup&intent=client_success",
        icon: MessageCircle,
        section: "support",
        intent: "quiet",
      },
    ],
    [localizedPrefix, text],
  );

  const blogPosts = useMemo(() => {
    const preferred = BAISE_BLOG_POSTS.filter(
      (post) => post.audience === "client" && (post.niche === appKey || post.niche === "cross-platform"),
    );
    return (preferred.length ? preferred : BAISE_BLOG_POSTS).slice(0, 3);
  }, [appKey]);

  const handleBioClick = (link: BioLink) => {
    track("cta_click", {
      section: link.section,
      ctaKey: link.key,
      label: link.label,
      href: link.href,
      destination: appendTrackingParams(link.href, link.key),
      intent: link.intent,
    });
  };

  const handleLocaleChange = (nextLocale: LocaleKey) => {
    if (nextLocale === locale) return;
    track("language_change", {
      section: "language",
      ctaKey: `language_${nextLocale}`,
      label: nextLocale.toUpperCase(),
      previous_locale: locale,
      target_locale: nextLocale,
    });
    setLocale(nextLocale);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(145deg,#020617_0%,#07111f_40%,#042f2e_100%)] px-4 py-5 text-white sm:px-6">
      <Helmet>
        <html lang={locale === "pt" ? "pt-BR" : "en"} />
        <title>{text.metaTitle}</title>
        <meta name="description" content={text.metaDescription} />
        <meta property="og:title" content={text.metaTitle} />
        <meta property="og:description" content={text.metaDescription} />
        <meta property="og:image" content={`${appUrl}/og/hero-preview.png`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${appUrl}${locale === "pt" ? "/pt" : ""}/links`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <a
            href={appendTrackingParams("/", "logo_home")}
            onClick={() => track("cta_click", { section: "brand", ctaKey: "logo_home", label: brand.name, href: "/" })}
            className="flex min-w-0 items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-2 shadow-lg shadow-black/20 backdrop-blur-md transition-[transform,border-color] duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <img src="/baise-logo.svg" alt={brand.name} className="h-7 w-7 shrink-0" />
            <span className="truncate text-sm font-black">{brand.name}</span>
          </a>
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/12 bg-white/8 p-1 text-xs font-bold backdrop-blur-md" aria-label={text.languageLabel}>
            <Globe2 className="ml-1 h-3.5 w-3.5 text-white/65" aria-hidden="true" />
            {supportedLocales.map((language) => (
              <button
                type="button"
                key={language}
                aria-pressed={locale === language}
                onClick={() => handleLocaleChange(language)}
                className={`min-w-9 rounded-full px-2.5 py-1 text-center transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.97] ${
                  locale === language ? "bg-white !text-slate-950" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {language.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <section className={`rounded-[1.75rem] border border-white/12 bg-white/[0.07] p-5 shadow-2xl shadow-black/35 ring-1 ${brand.ring} backdrop-blur-xl`}>
          <LinkMascot brand={brand} />
          <div className="mt-5 text-center">
            <p className={`text-xs font-black uppercase tracking-[0.22em] ${brand.accent}`}>{text.eyebrow}</p>
            <h1 className="mt-3 text-balance text-3xl font-black leading-[1.02] text-white sm:text-4xl">
              {text.title}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/72">{text.subtitle}</p>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-white/78">
            <span className="rounded-full border border-white/12 bg-black/20 px-3 py-1.5">{text.trusted}</span>
            <span className="rounded-full border border-white/12 bg-black/20 px-3 py-1.5">{brand.promise[locale]}</span>
          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle>{text.topChoice}</SectionTitle>
          {primaryLinks.map((link) => (
            <BioButton key={link.key} link={link} brand={brand} onClick={handleBioClick} />
          ))}
        </section>

        <section className="space-y-3">
          <SectionTitle>{text.chooseBrand}</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(brandProfiles) as AppKey[]).map((key) => {
              const item = brandProfiles[key];
              const href = appendTrackingParams(`${item.domain}${locale === "pt" ? "/pt" : ""}/links`, `brand_${key}`);
              return (
                <a
                  key={key}
                  href={href}
                  onClick={() => track("cta_click", { section: "brand_picker", ctaKey: `brand_${key}`, label: item.name, href })}
                  className={`rounded-2xl border border-white/12 bg-white/[0.08] p-3 shadow-lg shadow-black/20 transition-[transform,border-color,background-color] duration-150 ease-out active:scale-[0.98] hover:border-white/28 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${key === appKey ? `ring-1 ${item.ring}` : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${item.heroGradient}`} aria-hidden="true" />
                    <span className="text-sm font-black">{item.shortName}</span>
                  </div>
                  <p className="mt-2 text-xs leading-snug text-white/62">{text.brandLabels[key]}</p>
                </a>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle>{text.moreWays}</SectionTitle>
          {secondaryLinks.map((link) => (
            <BioButton key={link.key} link={link} brand={brand} onClick={handleBioClick} />
          ))}
        </section>

        <section className="space-y-3 pb-5">
          <SectionTitle>{text.latestLearning}</SectionTitle>
          <div className="rounded-[1.5rem] border border-white/12 bg-white/[0.07] p-4 shadow-xl shadow-black/20 backdrop-blur-lg">
            <div className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-red-200" aria-hidden="true" />
              <h2 className="text-base font-black">{text.videoTitle}</h2>
            </div>
            <div className="mt-3 space-y-2">
              {text.videoCards.map((title, index) => (
                <a
                  key={title}
                  href={appendTrackingParams(brand.youtubeUrl, `video_${index + 1}`)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track("cta_click", { section: "youtube_cards", ctaKey: `video_${index + 1}`, label: title, href: brand.youtubeUrl })}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3 transition-[transform,border-color,background-color] duration-150 ease-out active:scale-[0.98] hover:border-white/25 hover:bg-black/28"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-400/18 text-red-100">
                    <Youtube className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-bold leading-snug">{title}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-white/60" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/12 bg-white/[0.07] p-4 shadow-xl shadow-black/20 backdrop-blur-lg">
            <div className="flex items-center gap-2">
              <BookOpenText className="h-5 w-5 text-emerald-200" aria-hidden="true" />
              <h2 className="text-base font-black">{text.blogTitle}</h2>
            </div>
            <div className="mt-3 space-y-2">
              {blogPosts.map((post) => {
                const href = `${localizedPrefix}/blog/${post.slug}`;
                return (
                  <a
                    key={post.id}
                    href={appendTrackingParams(href, `blog_${post.slug}`)}
                    onClick={() => track("cta_click", { section: "blog_cards", ctaKey: `blog_${post.slug}`, label: post.title, href })}
                    className="block rounded-2xl border border-white/10 bg-black/20 px-3 py-3 transition-[transform,border-color,background-color] duration-150 ease-out active:scale-[0.98] hover:border-white/25 hover:bg-black/28"
                  >
                    <span className="block text-sm font-black leading-snug">{post.title}</span>
                    <span className="mt-1 block text-xs leading-snug text-white/60">{post.deck}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default BaiseBioLinks;

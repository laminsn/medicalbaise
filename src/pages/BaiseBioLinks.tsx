import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  BriefcaseBusiness,
  Gift,
  Globe2,
  Handshake,
  HeartPulse,
  Home,
  LogIn,
  Scale,
  ShieldCheck,
  Star,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BAISE_BLOG_POSTS } from "@/content/baiseBlogPosts";
import { getBaiseAppKey, getBaiseAppUrl } from "@/lib/providerCommunication";
import { supabase } from "@/integrations/supabase/client";
import contentLinks from "@/lib/content-links.json";
import platforms from "@/lib/platforms.json";
// @ts-expect-error Shared JavaScript modules intentionally ship without declarations.
import { attemptNative, resolveDeepLink } from "@/lib/deep-links.mjs";
// @ts-expect-error Shared JavaScript modules intentionally ship without declarations.
import { renderContentHub } from "@/lib/content-hub.mjs";

type AppKey = "casa" | "medical" | "legal";
type LocaleKey = "en" | "pt";
type BioEventType = "page_view" | "cta_click" | "language_change";

type BioRpcClient = {
  rpc: (fn: "track_bio_link_event", args: Record<string, unknown>) => Promise<{ data: string | null; error: unknown }>;
};

type AppLane = {
  key: AppKey;
  name: string;
  label: Record<LocaleKey, string>;
  description: Record<LocaleKey, string>;
  forProviders: Record<LocaleKey, string>;
  color: string;
  domain: string;
  icon: LucideIcon;
};

type SupportLink = {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  section: string;
};

type BaiseBioLinksProps = {
  defaultLocale?: LocaleKey;
};

const BAISE_BLACK = "#050505";
const PANEL_BLACK = "#111111";
const BORDER = "rgba(255,255,255,0.12)";
const contentDeepLinks = {
  resolve: (platform: string, entry: Record<string, unknown>, opts: Record<string, unknown>) =>
    resolveDeepLink(platform, entry, platforms, opts),
  attemptNative,
};

const appLanes: AppLane[] = [
  {
    key: "casa",
    name: "Casa Baise",
    label: {
      en: "Find or offer trusted local services",
      pt: "Encontre ou ofereça serviços locais confiáveis",
    },
    description: {
      en: "Home, business, repairs, cleaning, inspections, projects, and everyday trusted help.",
      pt: "Casa, negocios, reparos, limpeza, vistorias, projetos e ajuda confiavel no dia a dia.",
    },
    forProviders: {
      en: "Register to get discovered, manage requests, collect payments, and build proof.",
      pt: "Cadastre-se para ser encontrado, gerenciar pedidos, receber pagamentos e criar prova.",
    },
    color: "#1dbf73",
    domain: "https://www.casabaise.com",
    icon: Home,
  },
  {
    key: "medical",
    name: "Medical Baise",
    label: {
      en: "Find or offer trusted medical support",
      pt: "Encontre ou ofereça suporte medico confiavel",
    },
    description: {
      en: "Medical professionals, care navigation, appointment records, follow-ups, and secure history.",
      pt: "Profissionais medicos, orientação de cuidado, registros, acompanhamentos e histórico seguro.",
    },
    forProviders: {
      en: "Register to support patients with clearer communication, records, and follow-up workflows.",
      pt: "Cadastre-se para apoiar pacientes com comunicacao, registros e acompanhamentos claros.",
    },
    color: "#00b8d4",
    domain: "https://www.mdbaise.com",
    icon: HeartPulse,
  },
  {
    key: "legal",
    name: "Legal Baise",
    label: {
      en: "Find or offer trusted legal support",
      pt: "Encontre ou ofereça suporte jurídico confiavel",
    },
    description: {
      en: "Lawyers, documents, consultations, service records, client history, and organized next steps.",
      pt: "Advogados, documentos, consultas, registros de serviço, histórico e proximos passos organizados.",
    },
    forProviders: {
      en: "Register to receive qualified requests and keep consultations, invoices, and documents clean.",
      pt: "Cadastre-se para receber pedidos qualificados e organizar consultas, faturas e documentos.",
    },
    color: "#7c3aed",
    domain: "https://www.legalbaise.com",
    icon: Scale,
  },
];

const copy = {
  en: {
    languageLabel: "Language",
    eyebrow: "Baise social hub",
    title: "Choose the right Baise app and register where trust matters.",
    subtitle:
      "One link for Casa, Medical, and Legal Baise. Service users find trusted support. Service providers register to grow with better tools, records, and visibility.",
    trustLine: "Three apps. One Baise standard for trust, proof, payments, records, and support.",
    chooseApp: "Register in the right app",
    providers: "Resources for service providers",
    users: "Solutions for service users",
    latestLearning: "Learn before you choose",
    support: "More Baise links",
    register: "Register",
    providerResourceTitle: "Provider growth resources",
    providerResourceDescription: "Marketing, invoicing, reviews, campaigns, payments, and client operations.",
    userResourceTitle: "Service user guides",
    userResourceDescription: "How to choose, verify, pay, keep records, and avoid messy service experiences.",
    promotionTitle: "Current premium promotion",
    promotionDescription: "Give a month, get a month for eligible premium referrals.",
    portalTitle: "Sign in to your portal",
    portalDescription: "Messages, receipts, transaction history, documents, referrals, and service records.",
    partnerTitle: "Partner and influencer programs",
    partnerDescription: "Apply for approved campaigns with tracked links, codes, QR, rules, and payouts.",
    testimonialTitle: "Leave a testimonial",
    testimonialDescription: "Share optional, honest feedback without payment, credit, discount, or benefit.",
    referralTitle: "Referral rewards",
    referralDescription: "Share your link and track eligible premium referrals.",
    blogTitle: "Fresh practical guides",
    metaTitle: "Baise Links | Casa, Medical and Legal registration hub",
    metaDescription:
      "Register for Casa Baise, Medical Baise, or Legal Baise from one shared social bio hub with resources for service providers and solutions for service users.",
  },
  pt: {
    languageLabel: "Idioma",
    eyebrow: "Hub social Baise",
    title: "Escolha o app Baise certo e cadastre-se onde confianca importa.",
    subtitle:
      "Um link para Casa, Medical e Legal Baise. Quem precisa de serviços encontra suporte confiavel. Prestadores se cadastram para crescer com ferramentas, registros e visibilidade.",
    trustLine: "Tres apps. Um padrão Baise para confianca, prova, pagamentos, registros e suporte.",
    chooseApp: "Cadastre-se no app certo",
    providers: "Recursos para prestadores",
    users: "Soluções para quem precisa de serviços",
    latestLearning: "Aprenda antes de escolher",
    support: "Mais links Baise",
    register: "Cadastrar",
    providerResourceTitle: "Recursos de crescimento para prestadores",
    providerResourceDescription: "Marketing, faturas, avaliações, campanhas, pagamentos e operação de clientes.",
    userResourceTitle: "Guias para usuários de serviços",
    userResourceDescription: "Como escolher, verificar, pagar, guardar registros e evitar experiencias confusas.",
    promotionTitle: "Promocao premium atual",
    promotionDescription: "Give a month, get a month para indicações premium elegiveis.",
    portalTitle: "Entrar no portal",
    portalDescription: "Mensagens, recibos, histórico, documentos, indicações e registros de serviço.",
    partnerTitle: "Programas de parceiros e influenciadores",
    partnerDescription: "Inscreva-se em campanhas aprovadas com links, codigos, QR, regras e pagamentos.",
    testimonialTitle: "Enviar depoimento",
    testimonialDescription: "Compartilhe feedback opcional e honesto, sem pagamento, crédito, desconto ou benefício.",
    referralTitle: "Recompensas por indicação",
    referralDescription: "Compartilhe seu link e acompanhe indicações premium elegiveis.",
    blogTitle: "Guias praticos recentes",
    metaTitle: "Links Baise | Hub Casa, Medical e Legal",
    metaDescription:
      "Cadastre-se no Casa Baise, Medical Baise ou Legal Baise por um único hub social com recursos para prestadores e soluções para usuários.",
  },
} as const;

const supportedLocales: LocaleKey[] = ["pt", "en"];

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
  if (typeof window === "undefined") return href;
  const url = new URL(href, window.location.origin);
  const current = new URLSearchParams(window.location.search);
  url.searchParams.set("source", current.get("source") || current.get("utm_source") || "social_bio");
  url.searchParams.set("campaign", current.get("campaign") || current.get("utm_campaign") || "shared_baise_social_hub");
  url.searchParams.set("cta", ctaKey);

  if (!href.startsWith("http")) return `${url.pathname}${url.search}${url.hash}`;
  return url.toString();
};

const registerUrl = (lane: AppLane, locale: LocaleKey) =>
  `${lane.domain}${locale === "pt" ? "/pt" : ""}/auth?mode=signup&source=social_bio&intent=register&app=${lane.key}`;

const blogUrl = (audience: "provider" | "client", locale: LocaleKey) =>
  `${locale === "pt" ? "/pt" : ""}/blog?audience=${audience}&source=social_bio`;

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="px-1 text-xs font-black uppercase tracking-[0.18em] text-white/50">{children}</h2>
);

const BaiseMark = () => (
  <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-black p-[2px] shadow-2xl shadow-black/60">
    <div
      className="absolute inset-0 rounded-[2rem]"
      style={{
        background: "linear-gradient(135deg, #1dbf73 0%, #00b8d4 50%, #7c3aed 100%)",
      }}
      aria-hidden="true"
    />
    <div className="relative flex h-full w-full items-center justify-center rounded-[1.85rem] border border-white/10 bg-black">
      <img src="/baise-logo.svg" alt="Baise" className="h-14 w-14 object-contain" />
    </div>
    <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 bg-black px-3 py-1 text-[11px] font-semibold text-white shadow-lg">
      <Star className="h-3 w-3 fill-[#ffc107] text-[#ffc107]" aria-hidden="true" />
      4.8
    </div>
  </div>
);

const AppRegistrationCard = ({
  lane,
  locale,
  onClick,
}: {
  lane: AppLane;
  locale: LocaleKey;
  onClick: (payload: Record<string, unknown>) => void;
}) => {
  const Icon = lane.icon;
  const href = appendTrackingParams(registerUrl(lane, locale), `register_${lane.key}`);

  return (
    <a
      href={href}
      onClick={() =>
        onClick({
          section: "app_registration",
          ctaKey: `register_${lane.key}`,
          label: lane.name,
          href,
          app_lane: lane.key,
        })
      }
      className="group block rounded-2xl border bg-black p-[1px] shadow-xl shadow-black/35 outline-none transition-[transform,border-color,box-shadow] duration-150 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/70"
      style={{ borderColor: `${lane.color}66`, boxShadow: `0 18px 42px ${lane.color}18` }}
    >
      <span className="block rounded-[0.95rem] bg-[#0b0b0b] p-4">
        <span className="flex items-start gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-black"
            style={{ backgroundColor: lane.color }}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-black leading-tight text-white">{lane.name}</span>
            <span className="mt-1 block text-sm font-bold leading-snug" style={{ color: lane.color }}>
              {lane.label[locale]}
            </span>
            <span className="mt-2 block text-xs leading-5 text-white/62">{lane.description[locale]}</span>
          </span>
        </span>
        <span className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3">
          <span className="text-xs leading-5 text-white/68">{lane.forProviders[locale]}</span>
          <span
            className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-black text-black"
            style={{ backgroundColor: lane.color }}
          >
            {copy[locale].register}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </span>
      </span>
    </a>
  );
};

const SupportButton = ({ link, onClick }: { link: SupportLink; onClick: (link: SupportLink) => void }) => {
  const Icon = link.icon;
  const href = appendTrackingParams(link.href, link.key);
  const isExternal = href.startsWith("http");

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      onClick={() => onClick({ ...link, href })}
      className="group flex min-h-[74px] w-full items-center gap-3 rounded-2xl border border-white/12 bg-[#0b0b0b] px-4 py-3 shadow-lg shadow-black/25 outline-none transition-[transform,border-color,background-color] duration-150 ease-out active:scale-[0.98] hover:border-white/24 hover:bg-[#111111] focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-black"
        style={{ background: "linear-gradient(135deg, #1dbf73, #00b8d4, #7c3aed)" }}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black leading-tight text-white sm:text-base">{link.label}</span>
        <span className="mt-1 block text-xs leading-snug text-white/62">{link.description}</span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 text-white/62 transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden="true" />
    </a>
  );
};

const BaiseBioLinks = ({ defaultLocale = "en" }: BaiseBioLinksProps) => {
  const appKey = getBaiseAppKey();
  const appUrl = getBaiseAppUrl();
  const [locale, setLocale] = useState<LocaleKey>(defaultLocale);
  const [copied, setCopied] = useState(false);
  const [sessionId] = useState(getSessionId);
  const pageViewTracked = useRef(false);
  const contentHubRef = useRef<HTMLDivElement>(null);
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
        event_source: params.get("source") || params.get("utm_source") || "shared_social_bio",
        event_campaign: params.get("campaign") || params.get("utm_campaign") || "shared_baise_social_hub",
        event_path: window.location.pathname,
        event_referrer: document.referrer || null,
        event_metadata: {
          ...payload,
          session_id: sessionId,
          utm_medium: params.get("utm_medium"),
          shared_social_hub: true,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
        },
      };

      const analytics = (window as unknown as { analytics?: { track?: (event: string, data: Record<string, unknown>) => void } }).analytics;
      analytics?.track?.("baise_bio_link_event", body);
      if (eventType === "cta_click" && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/link-analytics",
          new Blob([JSON.stringify(body)], { type: "application/json" }),
        );
      }
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
    track("page_view", { section: "page", label: "Baise shared social hub" });
  }, [track]);

  useEffect(() => {
    const mount = contentHubRef.current;
    if (!mount) return;
    mount.replaceChildren();
    renderContentHub(mount, contentLinks["baise-group"], {
      DL: contentDeepLinks,
      tracking: { source: "bio-baise" },
      labels: locale === "pt"
        ? { latestKicker: "Último episódio", watch: "Assistir no YouTube", youtube: "YouTube", youtubeSub: "Assista e inscreva-se", listen: "Ouça", resources: "Recursos" }
        : { latestKicker: "Latest episode", watch: "Watch on YouTube", youtube: "YouTube", youtubeSub: "Watch & subscribe", listen: "Listen", resources: "Resources" },
      classMap: {
        section: "grid gap-3",
        kicker: "px-1 text-xs font-black uppercase tracking-[0.18em] text-white/50",
        card: "group flex min-h-[74px] w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border border-white/12 bg-[#0b0b0b] px-4 py-3 shadow-lg shadow-black/25 transition-[transform,border-color,background-color] duration-150 ease-out active:scale-[0.98] hover:border-white/24 hover:bg-[#111111]",
        latestCard: "group flex min-h-[84px] w-full items-stretch gap-3 overflow-hidden rounded-2xl border border-white/12 bg-[#0b0b0b] shadow-lg shadow-black/25 transition-[transform,border-color,background-color] duration-150 ease-out active:scale-[0.98] hover:border-white/24 hover:bg-[#111111]",
        primary: "group flex min-h-[74px] w-full items-center justify-between gap-3 rounded-2xl border border-white/12 bg-[#0b0b0b] px-4 py-3 shadow-lg shadow-black/25 transition-[transform,border-color,background-color] duration-150 ease-out active:scale-[0.98] hover:border-white/24 hover:bg-[#111111]",
        resourceCard: "group flex min-h-[74px] w-full items-center justify-between gap-3 rounded-2xl border border-white/12 bg-[#0b0b0b] px-4 py-3 shadow-lg shadow-black/25 transition-[transform,border-color,background-color] duration-150 ease-out active:scale-[0.98] hover:border-white/24 hover:bg-[#111111]",
        cardTitle: "block text-sm font-black leading-tight text-white sm:text-base",
        cardSub: "mt-1 block text-xs leading-snug text-white/62",
        listenChip: "rounded-full border border-white/12 bg-[#111111] px-3 py-2 text-xs font-black text-white",
      },
    });
    return () => mount.replaceChildren();
  }, [locale]);

  const audienceLinks = useMemo<SupportLink[]>(
    () => [
      {
        key: "provider_resources",
        label: text.providerResourceTitle,
        description: text.providerResourceDescription,
        href: blogUrl("provider", locale),
        icon: BriefcaseBusiness,
        section: "provider_resources",
      },
      {
        key: "service_user_resources",
        label: text.userResourceTitle,
        description: text.userResourceDescription,
        href: blogUrl("client", locale),
        icon: UsersRound,
        section: "service_user_resources",
      },
    ],
    [locale, text],
  );

  const supportLinks = useMemo<SupportLink[]>(
    () => [
      {
        key: "premium_promotion",
        label: text.promotionTitle,
        description: text.promotionDescription,
        href: `${localizedPrefix}/give-a-month-get-a-month`,
        icon: Gift,
        section: "promotion",
      },
      {
        key: "portal_signin",
        label: text.portalTitle,
        description: text.portalDescription,
        href: "/auth?mode=signin",
        icon: LogIn,
        section: "portal",
      },
      {
        key: "partner_programs",
        label: text.partnerTitle,
        description: text.partnerDescription,
        href: `${localizedPrefix}/influencer-partners`,
        icon: Handshake,
        section: "partner",
      },
      {
        key: "referral_rewards",
        label: text.referralTitle,
        description: text.referralDescription,
        href: `${localizedPrefix}/give-a-month-get-a-month`,
        icon: UserRoundCheck,
        section: "referral",
      },
      {
        key: "testimonial",
        label: text.testimonialTitle,
        description: text.testimonialDescription,
        href: `${localizedPrefix}/testimonial-request`,
        icon: BadgeCheck,
        section: "testimonial",
      },
    ],
    [localizedPrefix, text],
  );

  const blogPosts = useMemo(() => BAISE_BLOG_POSTS.filter((post) => post.niche === "cross-platform").slice(0, 3), []);

  const handleSupportClick = (link: SupportLink) => {
    track("cta_click", {
      section: link.section,
      ctaKey: link.key,
      label: link.label,
      href: link.href,
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
    <main className="min-h-screen px-4 py-5 text-white sm:px-6" style={{ backgroundColor: BAISE_BLACK }}>
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
        <meta name="theme-color" content={BAISE_BLACK} />
      </Helmet>

      <div className="mx-auto flex w-full max-w-[500px] flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <a
            href={appendTrackingParams("/", "logo_home")}
            onClick={() => track("cta_click", { section: "brand", ctaKey: "logo_home", label: "Baise", href: "/" })}
            className="flex min-w-0 items-center gap-2 rounded-full border border-white/12 bg-[#111111] px-3 py-2 shadow-lg shadow-black/35 transition-[transform,border-color] duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <img src="/baise-logo.svg" alt="Baise" className="h-7 w-7 shrink-0" />
            <span className="truncate text-sm font-black">Baise</span>
          </a>
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/12 bg-[#111111] p-1 text-xs font-bold" aria-label={text.languageLabel}>
            <Globe2 className="ml-1 h-3.5 w-3.5 text-white/65" aria-hidden="true" />
            {supportedLocales.map((language) => (
              <button
                type="button"
                key={language}
                aria-pressed={locale === language}
                onClick={() => handleLocaleChange(language)}
                className={`min-w-9 rounded-full px-2.5 py-1 text-center transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.97] ${
                  locale === language ? "bg-white !text-black" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {language.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <section className="rounded-[1.75rem] border p-5 shadow-2xl shadow-black/50" style={{ backgroundColor: PANEL_BLACK, borderColor: BORDER }}>
          <BaiseMark />
          <div className="mt-5 text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/50">{text.eyebrow}</p>
            <h1 className="mt-3 text-balance text-3xl font-black leading-[1.02] text-white sm:text-4xl">{text.title}</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/72">{text.subtitle}</p>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black px-4 py-3 text-center text-xs font-bold leading-5 text-white/72">
            <ShieldCheck className="mr-1 inline h-4 w-4 text-white/60" aria-hidden="true" />
            {text.trustLine}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2" aria-hidden="true">
            {appLanes.map((lane) => (
              <span key={lane.key} className="h-1.5 rounded-full" style={{ backgroundColor: lane.color }} />
            ))}
          </div>
        </section>

        <div
          ref={contentHubRef}
          id="content-hub"
          className="grid gap-3 empty:hidden [&_.ch-chips]:flex [&_.ch-chips]:flex-wrap [&_.ch-chips]:gap-2 [&_.ch-latest-copy]:grid [&_.ch-latest-copy]:flex-1 [&_.ch-latest-copy]:content-center [&_.ch-latest-copy]:gap-1 [&_.ch-latest-copy]:py-3 [&_.ch-latest-copy]:pr-4 [&_.ch-thumb]:w-28 [&_.ch-thumb]:object-cover"
        />

        <section className="space-y-3">
          <SectionTitle>{text.chooseApp}</SectionTitle>
          {appLanes.map((lane) => (
            <AppRegistrationCard
              key={lane.key}
              lane={lane}
              locale={locale}
              onClick={(payload) => track("cta_click", payload)}
            />
          ))}
        </section>

        <section className="space-y-3">
          <SectionTitle>{text.providers}</SectionTitle>
          {audienceLinks.slice(0, 1).map((link) => (
            <SupportButton key={link.key} link={link} onClick={handleSupportClick} />
          ))}
        </section>

        <section className="space-y-3">
          <SectionTitle>{text.users}</SectionTitle>
          {audienceLinks.slice(1).map((link) => (
            <SupportButton key={link.key} link={link} onClick={handleSupportClick} />
          ))}
        </section>

        <section className="space-y-3">
          <SectionTitle>{text.support}</SectionTitle>
          {supportLinks.map((link) => (
            <SupportButton key={link.key} link={link} onClick={handleSupportClick} />
          ))}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={typeof window === "undefined" ? appUrl : window.location.href}
              className="rounded-2xl border border-white/12 bg-[#111111] px-3 py-3 text-center text-sm font-black text-white"
            >
              {locale === "pt" ? "Abrir no navegador" : "Open in browser"}
            </a>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
              }}
              className="rounded-2xl border border-white/12 bg-[#111111] px-3 py-3 text-sm font-black text-white"
            >
              {copied ? (locale === "pt" ? "Link copiado" : "Link copied") : locale === "pt" ? "Copiar link" : "Copy link"}
            </button>
          </div>
        </section>

        <section className="space-y-3 pb-5">
          <SectionTitle>{text.latestLearning}</SectionTitle>
          <div className="rounded-[1.5rem] border border-white/12 bg-[#111111] p-4 shadow-xl shadow-black/35">
            <div className="flex items-center gap-2">
              <BookOpenText className="h-5 w-5 text-white/70" aria-hidden="true" />
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
                    className="block rounded-2xl border border-white/10 bg-black px-3 py-3 transition-[transform,border-color,background-color] duration-150 ease-out active:scale-[0.98] hover:border-white/25 hover:bg-[#0b0b0b]"
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

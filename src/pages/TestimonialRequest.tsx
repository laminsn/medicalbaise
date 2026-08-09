import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ExternalLink,
  Loader2,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { InfluencerCampaignShell } from '@/components/partner/InfluencerCampaignShell';
import { PageMetadata } from '@/components/seo/PageMetadata';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { generateSafeFileName, validateFileUpload } from '@/lib/security';
import { getBaiseAppKey, getBaiseAppUrl } from '@/lib/providerCommunication';
import { localizedPublicPath } from '@/lib/publicPageSeo';

type LocaleKey = 'en' | 'es' | 'pt';

type TestimonialRequestProps = {
  defaultLocale?: LocaleKey;
};

const brandName = {
  casa: 'Casa Baise',
  medical: 'MD Baise',
  legal: 'Legal Baise',
} as const;

const COPY = {
  en: {
    title: 'Share your experience',
    description: 'Share honest feedback after a completed Baise service. Reviews and testimonials are always optional and never incentivized.',
    badge: 'Client testimonial request',
    eyebrow: 'Your experience helps the next client choose with confidence.',
    headline: 'Tell us how your service went.',
    intro: 'After a completed service, you may share honest feedback. A public review is optional; a private video testimonial is reviewed before publication.',
    googleTitle: 'Google review',
    googleCredit: 'Optional public feedback',
    googleBody: 'If you choose to leave a public review, describe your genuine experience in your own words. No reward is offered.',
    googleButton: 'Open Google reviews',
    googlePending: 'Google review link coming soon',
    videoTitle: 'Video testimonial',
    videoCredit: 'Optional internal testimonial',
    videoBody: 'Upload one short testimonial video sharing what was helpful, professional, or worth recommending.',
    totalCredit: 'Feedback principles',
    totalCreditValue: 'Honest and optional',
    rulesTitle: 'Review integrity',
    rules: [
      'Share only your genuine service experience.',
      'Public reviews and internal testimonials are optional.',
      'No discount, credit, or payment is offered for a review.',
      'Submitted videos are reviewed before any publication.',
    ],
    uploadTitle: 'Upload your testimonial video',
    uploadHint: 'MP4, WebM, or MOV. Max 50MB.',
    titleLabel: 'Video title',
    titlePlaceholder: 'Example: Great service experience',
    descriptionLabel: 'What should people know?',
    descriptionPlaceholder: 'Share a few details about the provider, service quality, communication, or result.',
    uploadButton: 'Submit video for approval',
    uploading: 'Uploading...',
    signInTitle: 'Sign in to share feedback',
    signInBody: 'Video uploads are attached to your Baise account and reviewed before publication.',
    signInButton: 'Sign in to continue',
    missingProvider: 'Open this page from your completed-service email to attach the testimonial to the right provider.',
    approvedNote: 'Video testimonials remain private until reviewed and approved for publication.',
    alreadyClaimed: 'Already submitted',
    pendingReview: 'Pending approval',
    nextStep: 'Once submitted, you can continue using your Baise portal for receipts, invoices, messages, and service history.',
    portalCta: 'Open my portal',
  },
  es: {
    title: 'Comparte tu experiência',
    description: 'Comparte comentarios honestos después de un servicio Baise. Las reseñas y testimonios siempre son opcionales y nunca incentivados.',
    badge: 'Solicitud de testimonio',
    eyebrow: 'Tu experiência ayuda al próximo cliente a elegir con confianza.',
    headline: 'Cuéntanos cómo fue tu servicio.',
    intro: 'Después de un servicio, puedes compartir comentarios honestos. Una reseña pública es opcional y un video se revisa antes de publicarse.',
    googleTitle: 'Reseña de Google',
    googleCredit: 'Comentario público opcional',
    googleBody: 'Si decides dejar una reseña pública, describe tu experiência genuina con tus propias palabras. No se ofrece recompensa.',
    googleButton: 'Abrir reseñas de Google',
    googlePending: 'Link de Google disponible pronto',
    videoTitle: 'Vídeo testimonial',
    videoCredit: 'Testimonio interno opcional',
    videoBody: 'Sube un vídeo corto contando qué fue útil, profesional o digno de recomendar.',
    totalCredit: 'Principios de comentarios',
    totalCreditValue: 'Honesto y opcional',
    rulesTitle: 'Integridad de reseñas',
    rules: [
      'Comparte solo tu experiência genuina.',
      'Las reseñas públicas y testimonios internos son opcionales.',
      'No se ofrece descuento, crédito ni pago por una reseña.',
      'Los videos se revisan antes de cualquier publicación.',
    ],
    uploadTitle: 'Sube tu vídeo testimonial',
    uploadHint: 'MP4, WebM o MOV. Máximo 50MB.',
    titleLabel: 'Título del vídeo',
    titlePlaceholder: 'Ejemplo: Gran experiência de servicio',
    descriptionLabel: '¿Qué deberían saber?',
    descriptionPlaceholder: 'Comparte algunos detalles sobre el proveedor, calidad del servicio, comunicación o resultado.',
    uploadButton: 'Enviar vídeo para aprobación',
    uploading: 'Subiendo...',
    signInTitle: 'Inicia sesión para compartir comentarios',
    signInBody: 'Los videos se vinculan a tu cuenta Baise y se revisan antes de su publicación.',
    signInButton: 'Iniciar sesión',
    missingProvider: 'Abre esta página desde tu email de servicio completado para conectar el testimonio con el proveedor correcto.',
    approvedNote: 'Los videos permanecen privados hasta ser revisados y aprobados para publicación.',
    alreadyClaimed: 'Ya enviado',
    pendingReview: 'Pendiente de aprobación',
    nextStep: 'Después de enviar, puedes seguir usando tu portal Baise para recibos, facturas, mensajes e historial de servicio.',
    portalCta: 'Abrir mi portal',
  },
  pt: {
    title: 'Compartilhe sua experiência',
    description: 'Compartilhe um feedback honesto depois de um serviço Baise. Avaliações e depoimentos são sempre opcionais e nunca incentivados.',
    badge: 'Pedido de depoimento do cliente',
    eyebrow: 'Sua experiência ajuda o próximo cliente a escolher com confiança.',
    headline: 'Conte como foi o seu serviço.',
    intro: 'Depois de um serviço, você pode compartilhar um feedback honesto. Uma avaliação pública é opcional e o vídeo é analisado antes da publicação.',
    googleTitle: 'Avaliação no Google',
    googleCredit: 'Feedback público opcional',
    googleBody: 'Se optar por uma avaliação pública, descreva sua experiência real com suas próprias palavras. Nenhuma recompensa é oferecida.',
    googleButton: 'Abrir avaliações do Google',
    googlePending: 'Link do Google em breve',
    videoTitle: 'Vídeo depoimento',
    videoCredit: 'Depoimento interno opcional',
    videoBody: 'Envie um vídeo curto contando o que foi útil, profissional ou vale recomendar.',
    totalCredit: 'Princípios do feedback',
    totalCreditValue: 'Honesto e opcional',
    rulesTitle: 'Integridade das avaliações',
    rules: [
      'Compartilhe apenas sua experiência real.',
      'Avaliações públicas e depoimentos internos são opcionais.',
      'Nenhum desconto, crédito ou pagamento é oferecido por avaliação.',
      'Vídeos enviados são analisados antes de qualquer publicação.',
    ],
    uploadTitle: 'Envie seu vídeo depoimento',
    uploadHint: 'MP4, WebM ou MOV. Máximo 50MB.',
    titleLabel: 'Título do vídeo',
    titlePlaceholder: 'Exemplo: Ótima experiência de serviço',
    descriptionLabel: 'O que as pessoas devem saber?',
    descriptionPlaceholder: 'Compartilhe detalhes sobre o prestador, qualidade do serviço, comunicação ou resultado.',
    uploadButton: 'Enviar vídeo para aprovação',
    uploading: 'Enviando...',
    signInTitle: 'Entre para compartilhar seu feedback',
    signInBody: 'Os vídeos ficam ligados à sua conta Baise e são analisados antes da publicação.',
    signInButton: 'Entrar para continuar',
    missingProvider: 'Abra esta página pelo email de serviço concluído para conectar o depoimento ao prestador certo.',
    approvedNote: 'Vídeos permanecem privados até serem analisados e aprovados para publicação.',
    alreadyClaimed: 'Já enviado',
    pendingReview: 'Pendente de aprovação',
    nextStep: 'Depois do envio, você pode continuar usando o portal Baise para recibos, faturas, mensagens e histórico de serviços.',
    portalCta: 'Abrir meu portal',
  },
} as const;

const rewardStatusLabel = (status: string, copy: { alreadyClaimed: string; pendingReview: string }) => {
  if (status === 'approved' || status === 'credited') return copy.alreadyClaimed;
  return copy.pendingReview;
};

const normalizeLocale = (language: string): LocaleKey => {
  const normalized = language.toLowerCase();
  if (normalized.startsWith('pt')) return 'pt';
  if (normalized.startsWith('es')) return 'es';
  return 'en';
};

export default function TestimonialRequest({ defaultLocale }: TestimonialRequestProps) {
  const { i18n } = useTranslation();
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appKey = getBaiseAppKey();
  const brand = brandName[appKey];
  const locale = defaultLocale || normalizeLocale(i18n.resolvedLanguage || i18n.language || 'en');
  const copy = COPY[locale];

  const providerId = searchParams.get('providerId') || searchParams.get('provider_id') || '';
  const jobId = searchParams.get('jobId') || searchParams.get('job_id') || '';
  const providerName = searchParams.get('providerName') || searchParams.get('provider_name') || '';
  const googleReviewUrl =
    searchParams.get('googleReviewUrl') ||
    searchParams.get('google_review_url') ||
    String(import.meta.env.VITE_GOOGLE_REVIEW_URL || '');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const signInPath = `/auth?redirect=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`;
  const dashboardPath = user ? '/customer-dashboard' : '/auth';

  const hasProviderContext = Boolean(providerId);
  const canUploadVideo = Boolean(user && hasProviderContext);

  const proofStats = useMemo(() => [
    { label: copy.googleTitle, value: copy.googleCredit },
    { label: copy.videoTitle, value: copy.videoCredit },
    { label: copy.totalCredit, value: copy.totalCreditValue },
  ], [copy]);

  useEffect(() => {
    if (!defaultLocale) return;
    const current = i18n.resolvedLanguage || i18n.language || '';
    if (!current.toLowerCase().startsWith(defaultLocale)) {
      void i18n.changeLanguage(defaultLocale);
    }
  }, [defaultLocale, i18n]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFileUpload(file, {
      allowImages: false,
      allowVideos: true,
      maxSizeMB: 50,
    });

    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadVideo = async () => {
    if (!selectedFile || !canUploadVideo || !title.trim()) return;
    setIsUploading(true);

    try {
      const fileName = generateSafeFileName(user!.id, selectedFile.name);
      const { error: uploadError } = await supabase.storage
        .from('testimonials')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('testimonials')
        .getPublicUrl(fileName);

      const { error: testimonialError } = await supabase
        .from('video_testimonials')
        .insert({
          provider_id: providerId,
          customer_id: user!.id,
          job_id: jobId || null,
          video_url: publicUrl,
          title: title.trim(),
          description: description.trim() || undefined,
          is_approved: false,
        })
        .select('id')
        .single();

      if (testimonialError) throw testimonialError;

      clearSelectedFile();
      setTitle('');
      setDescription('');
      toast.success(copy.pendingReview);
    } catch (error: any) {
      toast.error(error.message || 'Unable to upload video testimonial');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <InfluencerCampaignShell brand={brand}>
      <PageMetadata
        page="testimonial"
        locale={locale}
        path={localizedPublicPath('/testimonial-request', locale)}
        basePath="/testimonial-request"
      />

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8 lg:pb-16 lg:pt-8">
        <div className="min-w-0 space-y-7 lg:py-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="rounded-md border-white/15 bg-white/10 text-white hover:bg-white/10">
              {copy.badge}
            </Badge>
            {providerName ? <span className="text-sm font-medium text-white/58">{providerName}</span> : null}
          </div>

          <div className="max-w-4xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
              {copy.eyebrow}
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              {copy.headline}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/68 sm:text-lg">
              {copy.intro}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {proofStats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-white/12 bg-white/[0.06] p-4">
                <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.08em] text-white/48">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <RewardCard
              icon={<Sparkles className="h-5 w-5" />}
              title={copy.googleTitle}
              credit={copy.googleCredit}
              body={copy.googleBody}
            >
              <div className="grid gap-2">
                <Button
                  asChild={Boolean(googleReviewUrl)}
                  disabled={!googleReviewUrl}
                  className="gap-2"
                  variant={googleReviewUrl ? 'default' : 'secondary'}
                >
                  {googleReviewUrl ? (
                    <a href={googleReviewUrl} target="_blank" rel="noreferrer">
                      {copy.googleButton}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span>{copy.googlePending}</span>
                  )}
                </Button>
              </div>
            </RewardCard>

            <RewardCard
              icon={<Video className="h-5 w-5" />}
              title={copy.videoTitle}
              credit={copy.videoCredit}
              body={copy.videoBody}
            >
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-white/15 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"
                disabled={!canUploadVideo}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {copy.uploadTitle}
              </Button>
            </RewardCard>
          </div>

          {!hasProviderContext ? (
            <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
              {copy.missingProvider}
            </div>
          ) : null}

          {!loading && !user ? (
            <div className="rounded-lg border border-white/12 bg-white/[0.05] p-5">
              <h2 className="text-xl font-semibold">{copy.signInTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">{copy.signInBody}</p>
              <Button asChild className="mt-4 gap-2">
                <Link to={signInPath}>
                  {copy.signInButton}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : null}

          {user ? (
            <div className="rounded-lg border border-white/12 bg-white/[0.05] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{copy.uploadTitle}</h2>
                  <p className="mt-1 text-sm text-white/58">{copy.uploadHint}</p>
                </div>
                <PlayCircle className="h-6 w-6 text-emerald-300" />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={handleFileSelect}
              />

              {previewUrl ? (
                <div className="relative mb-4 overflow-hidden rounded-lg border border-white/12 bg-black">
                  <video src={previewUrl} className="aspect-video w-full object-contain" controls />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-3 top-3 h-8 w-8"
                    onClick={clearSelectedFile}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!canUploadVideo}
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-4 flex min-h-44 w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/18 bg-white/[0.035] p-6 text-center transition hover:border-emerald-300/40 hover:bg-white/[0.055] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="mb-3 h-8 w-8 text-emerald-300" />
                  <span className="text-sm font-semibold">{copy.uploadTitle}</span>
                  <span className="mt-1 text-xs text-white/48">{copy.uploadHint}</span>
                </button>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="testimonial-title" className="text-white">{copy.titleLabel}</Label>
                  <Input
                    id="testimonial-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={copy.titlePlaceholder}
                    disabled={!canUploadVideo || isUploading}
                    className="border-white/12 bg-white text-[#101114]"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="testimonial-description" className="text-white">{copy.descriptionLabel}</Label>
                  <Textarea
                    id="testimonial-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={copy.descriptionPlaceholder}
                    disabled={!canUploadVideo || isUploading}
                    rows={4}
                    className="border-white/12 bg-white text-[#101114]"
                  />
                </div>
              </div>

              <Button
                type="button"
                className="mt-4 w-full gap-2"
                disabled={!selectedFile || !title.trim() || !canUploadVideo || isUploading}
                onClick={uploadVideo}
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isUploading ? copy.uploading : copy.uploadButton}
              </Button>
              <p className="mt-3 text-center text-xs text-white/48">{copy.approvedNote}</p>
            </div>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-white/14 bg-white p-5 text-[#101114] shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{copy.totalCredit}</p>
                <h2 className="mt-1 text-4xl font-semibold tracking-tight">{copy.totalCreditValue}</h2>
                <p className="mt-2 text-sm leading-6 text-black/58">{copy.approvedNote}</p>
              </div>
              <ShieldCheck className="h-7 w-7 text-emerald-700" />
            </div>

            <div className="rounded-lg bg-black/[0.04] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                {copy.rulesTitle}
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-black/58">
                {copy.rules.map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-700" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-5 text-sm leading-6 text-black/58">{copy.nextStep}</p>

            <Button asChild className="mt-4 h-11 w-full gap-2">
              <Link to={dashboardPath}>
                {copy.portalCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </aside>
      </section>
    </InfluencerCampaignShell>
  );
}

function RewardCard({
  icon,
  title,
  credit,
  body,
  claimedLabel,
  children,
}: {
  icon: JSX.Element;
  title: string;
  credit: string;
  body: string;
  claimedLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/12 bg-[#101114] p-5">
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex rounded-md bg-emerald-400/10 p-2 text-emerald-300 ring-1 ring-emerald-300/15">
          {icon}
        </span>
        {claimedLabel ? (
          <span className="rounded-md bg-emerald-300/10 px-2 py-1 text-xs font-semibold text-emerald-200">
            {claimedLabel}
          </span>
        ) : null}
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-emerald-300">{credit}</p>
      <p className="mt-2 min-h-16 text-sm leading-6 text-white/58">{body}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

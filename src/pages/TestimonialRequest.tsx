import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Gift,
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
import { useDisplayCurrency } from '@/contexts/DisplayCurrencyContext';
import { formatDisplayPrice } from '@/lib/currency';
import {
  TESTIMONIAL_GOOGLE_CREDIT_BRL,
  TESTIMONIAL_TOTAL_CREDIT_BRL,
  TESTIMONIAL_VIDEO_CREDIT_BRL,
  fillDisplayAmount,
} from '@/lib/constants/displayAmounts';

type LocaleKey = 'en' | 'es' | 'pt';
type RewardType = 'google_review' | 'video_testimonial';

type TestimonialRequestProps = {
  defaultLocale?: LocaleKey;
};

type RewardRecord = {
  id: string;
  reward_type: RewardType;
  status: string;
  amount_brl: number;
};

const brandName = {
  casa: 'Casa Baise',
  medical: 'Medical Baise',
  legal: 'Legal Baise',
} as const;

const COPY = {
  en: {
    title: 'Share your experience',
    description: 'Submit a Google review or video testimonial after a completed Baise service and earn up to {{amount}} in future service credit once approved.',
    badge: 'Client testimonial request',
    eyebrow: 'Your experience helps the next client choose with confidence.',
    headline: 'Tell us how your service went.',
    intro: 'After a completed service, you can help another client choose a trusted provider and earn future service credit after Baise approval.',
    googleTitle: 'Google review',
    googleCredit: '{{amount}} future service credit',
    googleBody: 'Leave one Google review for your completed service. After approval, the credit is added for future Baise services.',
    googleButton: 'Open Google reviews',
    googlePending: 'Google review link coming soon',
    googleConfirm: 'I posted my Google review',
    videoTitle: 'Video testimonial',
    videoCredit: '{{amount}} future service credit',
    videoBody: 'Upload one short testimonial video sharing what was helpful, professional, or worth recommending.',
    totalCredit: 'Total available credit',
    totalCreditValue: '{{amount}}',
    rulesTitle: 'Simple credit rules',
    rules: [
      'One Google review credit per client.',
      'One video testimonial credit per client.',
      'Credits are approved after review and apply to future services.',
      'Maximum testimonial credit is {{amount}} per client.',
    ],
    uploadTitle: 'Upload your testimonial video',
    uploadHint: 'MP4, WebM, or MOV. Max 50MB.',
    titleLabel: 'Video title',
    titlePlaceholder: 'Example: Great service experience',
    descriptionLabel: 'What should people know?',
    descriptionPlaceholder: 'Share a few details about the provider, service quality, communication, or result.',
    uploadButton: 'Submit video for approval',
    uploading: 'Uploading...',
    signInTitle: 'Sign in to claim testimonial credit',
    signInBody: 'Credits and video uploads are attached to your Baise account so we can approve them only once per client.',
    signInButton: 'Sign in to continue',
    missingProvider: 'Open this page from your completed-service email to attach the testimonial to the right provider.',
    approvedNote: 'Submitted credits stay pending until Baise approves the review or video.',
    alreadyClaimed: 'Already submitted',
    pendingReview: 'Pending approval',
    nextStep: 'Once submitted, you can continue using your Baise portal for receipts, invoices, messages, and service history.',
    portalCta: 'Open my portal',
  },
  es: {
    title: 'Comparte tu experiencia',
    description: 'Envía una reseña de Google o un vídeo testimonial después de un servicio completado en Baise y gana hasta {{amount}} en crédito para servicios futuros una vez aprobado.',
    badge: 'Solicitud de testimonio',
    eyebrow: 'Tu experiencia ayuda al próximo cliente a elegir con confianza.',
    headline: 'Cuéntanos cómo fue tu servicio.',
    intro: 'Después de un servicio completado, puedes ayudar a otro cliente a elegir un proveedor confiable y ganar crédito futuro después de la aprobación de Baise.',
    googleTitle: 'Reseña de Google',
    googleCredit: '{{amount}} de crédito para servicios futuros',
    googleBody: 'Deja una reseña de Google por tu servicio completado. Después de la aprobación, el crédito se agrega para futuros servicios Baise.',
    googleButton: 'Abrir reseñas de Google',
    googlePending: 'Link de Google disponible pronto',
    googleConfirm: 'Ya publiqué mi reseña',
    videoTitle: 'Vídeo testimonial',
    videoCredit: '{{amount}} de crédito para servicios futuros',
    videoBody: 'Sube un vídeo corto contando qué fue útil, profesional o digno de recomendar.',
    totalCredit: 'Crédito total disponible',
    totalCreditValue: '{{amount}}',
    rulesTitle: 'Reglas simples del crédito',
    rules: [
      'Un crédito por reseña de Google por cliente.',
      'Un crédito por vídeo testimonial por cliente.',
      'Los créditos se aprueban después de revisión y aplican a servicios futuros.',
      'El crédito máximo por testimonios es {{amount}} por cliente.',
    ],
    uploadTitle: 'Sube tu vídeo testimonial',
    uploadHint: 'MP4, WebM o MOV. Máximo 50MB.',
    titleLabel: 'Título del vídeo',
    titlePlaceholder: 'Ejemplo: Gran experiencia de servicio',
    descriptionLabel: '¿Qué deberían saber?',
    descriptionPlaceholder: 'Comparte algunos detalles sobre el proveedor, calidad del servicio, comunicación o resultado.',
    uploadButton: 'Enviar vídeo para aprobación',
    uploading: 'Subiendo...',
    signInTitle: 'Inicia sesión para reclamar crédito',
    signInBody: 'Los créditos y vídeos se adjuntan a tu cuenta Baise para aprobarlos solo una vez por cliente.',
    signInButton: 'Iniciar sesión',
    missingProvider: 'Abre esta página desde tu email de servicio completado para conectar el testimonio con el proveedor correcto.',
    approvedNote: 'Los créditos enviados quedan pendientes hasta que Baise apruebe la reseña o el vídeo.',
    alreadyClaimed: 'Ya enviado',
    pendingReview: 'Pendiente de aprobación',
    nextStep: 'Después de enviar, puedes seguir usando tu portal Baise para recibos, facturas, mensajes e historial de servicio.',
    portalCta: 'Abrir mi portal',
  },
  pt: {
    title: 'Compartilhe sua experiência',
    description: 'Envie uma avaliação no Google ou um vídeo depoimento depois de um serviço concluído na Baise e ganhe até {{amount}} em crédito para serviços futuros após aprovação.',
    badge: 'Pedido de depoimento do cliente',
    eyebrow: 'Sua experiência ajuda o próximo cliente a escolher com confiança.',
    headline: 'Conte como foi o seu serviço.',
    intro: 'Depois de um serviço concluído, você pode ajudar outro cliente a escolher um prestador confiável e ganhar crédito futuro após a aprovação da Baise.',
    googleTitle: 'Avaliação no Google',
    googleCredit: '{{amount}} de crédito para serviços futuros',
    googleBody: 'Deixe uma avaliação no Google sobre o serviço concluído. Depois da aprovação, o crédito é adicionado para futuros serviços Baise.',
    googleButton: 'Abrir avaliações do Google',
    googlePending: 'Link do Google em breve',
    googleConfirm: 'Publiquei minha avaliação',
    videoTitle: 'Vídeo depoimento',
    videoCredit: '{{amount}} de crédito para serviços futuros',
    videoBody: 'Envie um vídeo curto contando o que foi útil, profissional ou vale recomendar.',
    totalCredit: 'Crédito total disponível',
    totalCreditValue: '{{amount}}',
    rulesTitle: 'Regras simples do crédito',
    rules: [
      'Um crédito por avaliação no Google por cliente.',
      'Um crédito por vídeo depoimento por cliente.',
      'Os créditos são aprovados após análise e valem para serviços futuros.',
      'O crédito máximo por depoimentos é {{amount}} por cliente.',
    ],
    uploadTitle: 'Envie seu vídeo depoimento',
    uploadHint: 'MP4, WebM ou MOV. Máximo 50MB.',
    titleLabel: 'Título do vídeo',
    titlePlaceholder: 'Exemplo: Ótima experiência de serviço',
    descriptionLabel: 'O que as pessoas devem saber?',
    descriptionPlaceholder: 'Compartilhe detalhes sobre o prestador, qualidade do serviço, comunicação ou resultado.',
    uploadButton: 'Enviar vídeo para aprovação',
    uploading: 'Enviando...',
    signInTitle: 'Entre para solicitar o crédito',
    signInBody: 'Créditos e vídeos ficam ligados à sua conta Baise para que possamos aprovar apenas uma vez por cliente.',
    signInButton: 'Entrar para continuar',
    missingProvider: 'Abra esta página pelo email de serviço concluído para conectar o depoimento ao prestador certo.',
    approvedNote: 'Créditos enviados ficam pendentes até a Baise aprovar a avaliação ou o vídeo.',
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
  const { currency, rates } = useDisplayCurrency();
  const { user, profile, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appKey = getBaiseAppKey();
  const brand = brandName[appKey];
  const locale = defaultLocale || normalizeLocale(i18n.resolvedLanguage || i18n.language || 'en');
  const googleAmount = formatDisplayPrice(TESTIMONIAL_GOOGLE_CREDIT_BRL, { currency, rates });
  const videoAmount = formatDisplayPrice(TESTIMONIAL_VIDEO_CREDIT_BRL, { currency, rates });
  const totalAmount = formatDisplayPrice(TESTIMONIAL_TOTAL_CREDIT_BRL, { currency, rates });
  const copy = useMemo(() => {
    const rawCopy = COPY[locale];
    return {
      ...rawCopy,
      description: fillDisplayAmount(rawCopy.description, totalAmount),
      googleCredit: fillDisplayAmount(rawCopy.googleCredit, googleAmount),
      videoCredit: fillDisplayAmount(rawCopy.videoCredit, videoAmount),
      totalCreditValue: fillDisplayAmount(rawCopy.totalCreditValue, totalAmount),
      rules: rawCopy.rules.map((rule) => fillDisplayAmount(rule, totalAmount)),
    };
  }, [googleAmount, locale, totalAmount, videoAmount]);

  const providerId = searchParams.get('providerId') || searchParams.get('provider_id') || '';
  const jobId = searchParams.get('jobId') || searchParams.get('job_id') || '';
  const activeJobId = searchParams.get('activeJobId') || searchParams.get('active_job_id') || '';
  const providerName = searchParams.get('providerName') || searchParams.get('provider_name') || '';
  const googleReviewUrl =
    searchParams.get('googleReviewUrl') ||
    searchParams.get('google_review_url') ||
    String(import.meta.env.VITE_GOOGLE_REVIEW_URL || '');

  const [rewards, setRewards] = useState<RewardRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isClaimingGoogle, setIsClaimingGoogle] = useState(false);

  const googleReward = rewards.find((reward) => reward.reward_type === 'google_review');
  const videoReward = rewards.find((reward) => reward.reward_type === 'video_testimonial');
  const signInPath = `/auth?redirect=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`;
  const dashboardPath = user ? '/customer-dashboard' : '/auth';

  const hasProviderContext = Boolean(providerId);
  const canUploadVideo = Boolean(user && hasProviderContext && !videoReward);
  const canClaimGoogle = Boolean(user && hasProviderContext && !googleReward);

  const proofStats = useMemo(() => [
    { label: copy.googleTitle, value: googleAmount },
    { label: copy.videoTitle, value: videoAmount },
    { label: copy.totalCredit, value: copy.totalCreditValue },
  ], [copy, googleAmount, videoAmount]);

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

  useEffect(() => {
    if (!user) {
      setRewards([]);
      return;
    }
    void fetchRewards();
  }, [user?.id, appKey]);

  const fetchRewards = async () => {
    if (!user) return;
    const db = supabase as any;
    const { data, error } = await db
      .from('client_testimonial_rewards')
      .select('id, reward_type, status, amount_brl')
      .eq('customer_id', user.id)
      .eq('app_key', appKey)
      .in('reward_type', ['google_review', 'video_testimonial']);

    if (error) {
      return;
    }

    setRewards((data || []) as RewardRecord[]);
  };

  const recordReward = async (rewardType: RewardType, amountBrl: number, metadata: Record<string, unknown> = {}) => {
    if (!user || !providerId) throw new Error('Missing testimonial request context');
    const db = supabase as any;
    const { data, error } = await db
      .from('client_testimonial_rewards')
      .insert({
        app_key: appKey,
        customer_id: user.id,
        provider_id: providerId,
        job_id: jobId || null,
        active_job_id: activeJobId || null,
        reward_type: rewardType,
        amount_brl: amountBrl,
        status: 'pending_review',
        referral_code: profile?.referral_code || null,
        client_id: profile?.client_id || null,
        metadata: {
          ...metadata,
          referral_code: profile?.referral_code || null,
          client_id: profile?.client_id || null,
        },
      })
      .select('id, reward_type, status, amount_brl')
      .single();

    if (error) {
      if (error.code === '23505') {
        await fetchRewards();
        throw new Error(copy.alreadyClaimed);
      }
      throw error;
    }

    setRewards((current) => [...current.filter((reward) => reward.reward_type !== rewardType), data as RewardRecord]);

    if (profile?.referral_code) {
      await db.rpc('track_referral_event', {
        target_code: profile.referral_code,
        target_event_type: rewardType === 'google_review' ? 'testimonial_google' : 'testimonial_video',
        target_app_key: appKey,
        event_metadata: {
          reward_id: data?.id || null,
          provider_id: providerId,
          job_id: jobId || null,
          active_job_id: activeJobId || null,
          source: 'testimonial_request_page',
        },
      }).catch(() => null);
    }
  };

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

  const claimGoogleReview = async () => {
    if (!canClaimGoogle) return;
    setIsClaimingGoogle(true);
    try {
      await recordReward('google_review', TESTIMONIAL_GOOGLE_CREDIT_BRL, {
        google_review_url: googleReviewUrl || null,
        provider_name: providerName || null,
        claimed_from: 'testimonial_request_page',
      });
      toast.success(copy.pendingReview);
    } catch (error: any) {
      toast.error(error.message || 'Unable to record Google review');
    } finally {
      setIsClaimingGoogle(false);
    }
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

      const { data: testimonial, error: testimonialError } = await supabase
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

      await recordReward('video_testimonial', TESTIMONIAL_VIDEO_CREDIT_BRL, {
        video_testimonial_id: testimonial?.id || null,
        provider_name: providerName || null,
        file_name: fileName,
      });

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
              claimedLabel={googleReward ? rewardStatusLabel(googleReward.status, copy) : undefined}
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
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 border-white/15 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"
                  disabled={!canClaimGoogle || isClaimingGoogle}
                  onClick={claimGoogleReview}
                >
                  {isClaimingGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {googleReward ? copy.alreadyClaimed : copy.googleConfirm}
                </Button>
              </div>
            </RewardCard>

            <RewardCard
              icon={<Video className="h-5 w-5" />}
              title={copy.videoTitle}
              credit={copy.videoCredit}
              body={copy.videoBody}
              claimedLabel={videoReward ? rewardStatusLabel(videoReward.status, copy) : undefined}
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
              <Gift className="h-7 w-7 text-amber-500" />
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

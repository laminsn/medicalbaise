import { useState } from 'react';
import { formatPrice } from '@/lib/currency';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useFavorites } from '@/hooks/useFavorites';
import {
  Star,
  MapPin,
  Clock,
  Award,
  CheckCircle2,
  MessageCircle,
  Calendar,
  Heart,
  Share2,
  ChevronLeft,
  Languages as LanguagesIcon,
  ThumbsUp,
  Crown,
  BadgeCheck,
  Phone,
  Video,
  Send,
  GraduationCap,
  Hospital,
  CreditCard,
  Stethoscope,
  AlertCircle,
  Loader2,
  Users,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { VideoTestimonialList } from '@/components/testimonials/VideoTestimonialList';
import { UploadTestimonialDialog } from '@/components/testimonials/UploadTestimonialDialog';
import { useStartConversation } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useTrackProfileView } from '@/hooks/useProfileViews';
import { toast } from 'sonner';
import { MEDICAL_CATEGORIES } from '@/lib/constants/medical';
import { isPortuguese } from '@/lib/i18n-utils';

// Rating distribution computed from reviews
const computeRatingDistribution = (reviewsList: any[]) => {
  const counts = [0, 0, 0, 0, 0];
  reviewsList.forEach((r: any) => {
    const rating = r.overall_rating;
    if (rating >= 1 && rating <= 5) counts[rating - 1]++;
  });
  const total = reviewsList.length || 1;
  return [5, 4, 3, 2, 1].map(stars => ({
    stars,
    percentage: Math.round((counts[stars - 1] / total) * 100),
  }));
};

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isPt = isPortuguese(i18n);
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');
  const { user } = useAuth();
  const { startConversation } = useStartConversation();
  const { isFavorited, toggleFavorite } = useFavorites();
  
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);

  useTrackProfileView(id, 'doctor_profile');

  const { data: doctorData, isLoading, error } = useQuery({
    queryKey: ['doctor-profile', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('providers')
        .select('*, profiles!inner(first_name, last_name, avatar_url, email)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['doctor-reviews', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles!reviews_customer_id_fkey(first_name, last_name, avatar_url)')
        .eq('provider_id', id!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: credentials = [] } = useQuery({
    queryKey: ['doctor-credentials', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('provider_credentials').select('*').eq('provider_id', id!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['doctor-services', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('provider_services').select('*, service_categories(name_pt, name_en)').eq('provider_id', id!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: faqs = [] } = useQuery({
    queryKey: ['doctor-faqs', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('provider_faqs').select('*').eq('provider_id', id!).order('order_index');
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const doctor = doctorData ? {
    ...doctorData,
    name: doctorData.business_name || `${(doctorData as any).profiles?.first_name || ''} ${(doctorData as any).profiles?.last_name || ''}`.trim(),
    avatar_url: (doctorData as any).profiles?.avatar_url || '',
    specialty_name: '',
    specialty_name_en: '',
    tagline: doctorData.tagline || '',
    tagline_en: '',
    bio: doctorData.bio || '',
    bio_en: '',
    medical_school: '',
    medical_school_en: '',
    residency: '',
    residency_en: '',
    fellowship: '',
    fellowship_en: '',
    total_patients: 0,
    patient_satisfaction: 0,
    appointment_punctuality: 0,
    successful_treatments: 0,
    telehealth_available: (doctorData as any).teleconsultation_available || false,
    // Normalize array fields that may be null
    hospital_affiliations: (doctorData as any).hospital_affiliations ?? [],
    insurance_accepted: (doctorData as any).insurance_accepted ?? (doctorData as any).accepted_insurance ?? [],
    accepted_insurance: (doctorData as any).accepted_insurance ?? (doctorData as any).insurance_accepted ?? [],
    consultation_types: (doctorData as any).consultation_types ?? [],
    languages: (doctorData as any).languages ?? [],
  } : null;

  const specialtyName = doctor?.specialty_name || '';
  const tagline = doctor?.tagline || '';
  const bio = doctor?.bio || '';
  // Pull education info from provider_credentials if available, fall back to provider fields
  const educationCred = (credentials as any[]).find((c) => c.credential_type === 'education');
  const residencyCred = (credentials as any[]).find((c) => c.credential_type === 'residency');
  const subSpecialtyCred = (credentials as any[]).find((c) => c.credential_type === 'certification' && !c.document_url);
  const medicalSchool = educationCred?.institution || doctor?.medical_school || '';
  const graduationYear = educationCred?.year || '';
  const residency = residencyCred?.title || doctor?.residency || '';
  const fellowship = doctor?.fellowship || '';
  const subSpecialty = subSpecialtyCred?.title || '';

  // Derive specialty display name from category_id
  const categoryId = (doctor as any)?.category_id || '';
  const specialtyCategory = MEDICAL_CATEGORIES.find((c) => c.id === categoryId);
  const specialtyDisplayName = specialtyCategory
    ? (isPt ? specialtyCategory.name_pt : specialtyCategory.name_en)
    : specialtyName;

  const ratingDistribution = computeRatingDistribution(reviews as any[]);

  const canMessage = doctor?.subscription_tier === 'elite' || doctor?.subscription_tier === 'enterprise';

  const handleMessageDoctor = async () => {
    if (!user) {
      toast.error(t('auth.loginRequired'));
      navigate('/auth?redirect=/doctor/' + id);
      return;
    }

    if (!canMessage) {
      toast.error(t('messages.eliteRequired'));
      return;
    }

    try {
      setIsStartingConversation(true);
      const conversationId = await startConversation(id || doctor.id);
      if (conversationId) {
        navigate(`/chat/${conversationId}`);
      }
    } catch {
      toast.error(t('messages.startError'));
    } finally {
      setIsStartingConversation(false);
    }
  };

  const handleBookAppointment = () => {
    if (!user) {
      toast.error(t('auth.loginRequired'));
      navigate('/auth?redirect=/doctor/' + id);
      return;
    }
    navigate(`/book-appointment/${id}`);
  };

  const handleRequestTeleconsultation = () => {
    if (!user) {
      toast.error(t('auth.loginRequired'));
      navigate('/auth?redirect=/doctor/' + id);
      return;
    }

    if (!doctor.telehealth_available) {
      toast.error(t('doctorProfile.telehealthNotAvailable'));
      return;
    }
    
    navigate(`/book-appointment/${id}?type=teleconsultation`);
  };

  const handleToggleFavorite = () => {
    if (!user) {
      toast.error(t('auth.loginRequired'));
      navigate('/auth');
      return;
    }
    toggleFavorite(id || doctor.id, doctor.business_name);
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Dr. ${doctor.business_name} - ${specialtyName}`,
          text: tagline,
          url: url,
        });
        toast.success(t('common.shared'));
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success(t('common.linkCopied'));
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'elite':
        return (
          <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 border-0">
            <Crown className="h-3 w-3 mr-1" /> Elite
          </Badge>
        );
      case 'enterprise':
        return (
          <Badge className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 border-0">
            <Building2 className="h-3 w-3 mr-1" /> Enterprise
          </Badge>
        );
      default:
        return <Badge variant="secondary">Pro</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">{t('doctorProfile.loading')}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="px-4 py-8">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t('doctorProfile.errorLoading')}</AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <Button onClick={() => navigate('/browse')} variant="outline">
              {t('common.backToBrowse')}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!doctor) {
    return (
      <AppLayout>
        <div className="px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('doctorProfile.notFound', 'Doctor not found')}</h1>
          <Button onClick={() => navigate('/browse')} variant="outline">{t('common.backToBrowse')}</Button>
        </div>
      </AppLayout>
    );
  }

  if (isEs) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Card className="border-dashed">
            <CardContent className="py-10 text-center space-y-3">
              <h2 className="text-xl font-semibold">Perfil en traducción</h2>
              <p className="text-muted-foreground">
                Esta página de perfil médico aún se está adaptando completamente al español.
                Puedes ver la versión completa en inglés mientras finalizamos la traducción.
              </p>
              <Button onClick={() => i18n.changeLanguage('en')}>
                Ver versión completa en inglés
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dr. {doctor.business_name} - {specialtyName} | MDBaise</title>
        <meta name="description" content={tagline} />
      </Helmet>
      
      <AppLayout>
        <div className="pb-24">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary/10 to-blue-500/10 px-4 py-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('common.back')}
            </Button>
            
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                <AvatarImage src={doctor.avatar_url} alt={`Dr. ${doctor.business_name}`} />
                <AvatarFallback>{doctor.business_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl font-bold truncate">Dr. {doctor.business_name}</h1>
                  {doctor.is_verified && (
                    <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" aria-label={t('doctorProfile.verified')} />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{tagline}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {getTierBadge(doctor.subscription_tier)}
                  <Badge variant="outline" className="text-xs">
                    <Stethoscope className="h-3 w-3 mr-1" />
                    {specialtyDisplayName || specialtyName}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {doctor.city}, {doctor.state}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="bg-background/80 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold">{doctor.avg_rating}</span>
                </div>
                <p className="text-xs text-muted-foreground">{doctor.total_reviews} {t('doctorProfile.reviews')}</p>
              </div>
              <div className="bg-background/80 rounded-lg p-2 text-center">
                <p className="font-bold">{doctor.total_patients}</p>
                <p className="text-xs text-muted-foreground">{t('doctorProfile.patients')}</p>
              </div>
              <div className="bg-background/80 rounded-lg p-2 text-center">
                <p className="font-bold">{doctor.years_experience}</p>
                <p className="text-xs text-muted-foreground">{t('doctorProfile.yearsExp')}</p>
              </div>
              <div className="bg-background/80 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <span className="font-bold">&lt;{doctor.response_time_hours}h</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('doctorProfile.response')}</p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              {doctor.is_licensed && (
                <Badge variant="outline" className="bg-background/80 text-xs">
                  <ShieldCheck className="h-3 w-3 mr-1 text-green-600" />
                  {doctor.crm_number}
                </Badge>
              )}
              {doctor.is_board_certified && (
                <Badge variant="outline" className="bg-background/80 text-xs">
                  <Award className="h-3 w-3 mr-1 text-green-600" />
                  {t('doctorProfile.boardCertified')}
                </Badge>
              )}
              {doctor.telehealth_available && (
                <Badge variant="outline" className="bg-background/80 text-xs">
                  <Video className="h-3 w-3 mr-1 text-blue-600" />
                  {t('doctorProfile.telemedicine')}
                </Badge>
              )}
              {doctor.accepts_new_patients && (
                <Badge variant="outline" className="bg-background/80 text-xs border-green-600 text-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t('doctorProfile.acceptingNewPatients')}
                </Badge>
              )}
              {doctor.is_verified && (
                <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-xs border-green-600 text-green-700 dark:text-green-400">
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  {isPt ? 'Credenciais Verificadas' : 'Verified Credentials'}
                </Badge>
              )}
              {doctor.is_background_checked && (
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-xs border-blue-600 text-blue-700 dark:text-blue-400">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  {isPt ? 'Antecedentes Verificados' : 'Background Checked'}
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button className="w-full" onClick={handleBookAppointment} disabled={!doctor.accepts_new_patients}>
                <Calendar className="h-4 w-4 mr-2" />
                {t('doctorProfile.bookAppointment')}
              </Button>
              <Button variant="outline" onClick={handleRequestTeleconsultation} disabled={!doctor.telehealth_available}>
                <Video className="h-4 w-4 mr-2" />
                {t('doctorProfile.teleconsultation')}
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="secondary" className="flex-1 relative" onClick={handleMessageDoctor} disabled={isStartingConversation}>
                {isStartingConversation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t('doctorProfile.messageDoctor')}
                  </>
                )}
                {!canMessage && (
                  <Badge className="absolute -top-2 -right-2 bg-amber-500 text-[10px] px-1 pointer-events-none">
                    <Crown className="h-2.5 w-2.5 mr-0.5" />
                    Elite+
                  </Badge>
                )}
              </Button>
              <Button variant="outline" size="icon" onClick={handleToggleFavorite}>
                <Heart className={`h-4 w-4 ${isFavorited(id || doctor.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs Content */}
          <Tabs defaultValue="about" className="px-4 mt-4">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="about" className="text-xs">{t('doctorProfile.about')}</TabsTrigger>
              <TabsTrigger value="procedures" className="text-xs">{t('doctorProfile.procedures')}</TabsTrigger>
              <TabsTrigger value="credentials" className="text-xs">{t('doctorProfile.credentials')}</TabsTrigger>
              <TabsTrigger value="videos" className="text-xs">
                <Video className="h-3 w-3 mr-1" />
                {t('doctorProfile.videos')}
              </TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs">{t('doctorProfile.reviewsTab')}</TabsTrigger>
            </TabsList>

            {/* About Tab */}
            <TabsContent value="about" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('doctorProfile.aboutDoctor')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-3">
                    {/* CRM / Medical License */}
                    {(doctor as any).crm_number && (
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{isPt ? 'CRM / Registro Médico' : 'CRM / Medical License'}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{(doctor as any).crm_number}</p>
                            <Badge variant="outline" className="border-green-600 text-green-600 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {isPt ? 'Verificado' : 'Verified'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Specialty + Sub-specialty */}
                    {(specialtyDisplayName || specialtyName) && (
                      <div className="flex items-start gap-3">
                        <Stethoscope className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{isPt ? 'Especialidade' : 'Specialty'}</p>
                          <p className="text-sm font-medium">
                            {specialtyDisplayName || specialtyName}
                            {subSpecialty && (
                              <span className="text-muted-foreground font-normal"> — {subSpecialty}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Medical School */}
                    {medicalSchool && (
                      <div className="flex items-start gap-3">
                        <GraduationCap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{t('doctorProfile.medicalSchool')}</p>
                          <p className="text-sm font-medium">
                            {medicalSchool}
                            {graduationYear && <span className="text-muted-foreground font-normal"> ({graduationYear})</span>}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Residency */}
                    {residency && (
                      <div className="flex items-start gap-3">
                        <Hospital className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{t('doctorProfile.residency')}</p>
                          <p className="text-sm font-medium">{residency}</p>
                        </div>
                      </div>
                    )}

                    {fellowship && (
                      <div className="flex items-start gap-3">
                        <Award className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{t('doctorProfile.fellowship')}</p>
                          <p className="text-sm font-medium">{fellowship}</p>
                        </div>
                      </div>
                    )}

                    {doctor.languages && doctor.languages.length > 0 && (
                      <div className="flex items-start gap-3">
                        <LanguagesIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{t('doctorProfile.languages')}</p>
                          <p className="text-sm font-medium">{doctor.languages.join(', ')}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{t('doctorProfile.experience')}</p>
                        <p className="text-sm font-medium">{t('doctorProfile.yearsOfExperience', { years: doctor.years_experience })}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hospital Affiliations */}
              {doctor.hospital_affiliations.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Hospital className="h-4 w-4 text-primary" />
                      {t('doctorProfile.hospitalAffiliations')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {doctor.hospital_affiliations.map((hospital: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>{hospital}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Consultation Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {isPt ? 'Informações de Consulta' : 'Consultation Info'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(doctor as any).consultation_fee != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {isPt ? 'Valor da consulta' : 'Consultation fee'}
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {formatPrice((doctor as any).consultation_fee)}
                      </span>
                    </div>
                  )}
                  {(doctor as any).consultation_duration_minutes && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {isPt ? 'Duração' : 'Duration'}
                      </span>
                      <span className="text-sm font-medium">
                        {(doctor as any).consultation_duration_minutes}{isPt ? ' minutos' : '-minute consultation'}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {doctor.telehealth_available && (
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0">
                        <Video className="h-3 w-3 mr-1" />
                        {isPt ? 'Teleconsulta Disponível' : 'Video Consultation Available'}
                      </Badge>
                    )}
                    {(doctor as any).accepts_new_patients ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {isPt ? 'Aceitando Novos Pacientes' : 'Accepting New Patients'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {isPt ? 'Não aceitando novos pacientes' : 'Not Accepting New Patients'}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Insurance Accepted */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    {t('doctorProfile.insuranceAccepted')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {doctor.insurance_accepted.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {doctor.insurance_accepted.map((insurance: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">{insurance}</Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {isPt ? 'Particular (sem plano)' : 'Particular (out-of-pocket)'}
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">{t('doctorProfile.insuranceNote')}</p>
                </CardContent>
              </Card>

              {/* Consultation Types */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Video className="h-4 w-4 text-primary" />
                    {t('doctorProfile.consultationTypes')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {doctor.consultation_types.includes('in-person') && (
                      <div className="flex items-center gap-2 text-sm">
                        <Hospital className="h-4 w-4 text-primary" />
                        <span>{t('doctorProfile.inPersonConsultation')}</span>
                      </div>
                    )}
                    {(doctor.consultation_types.includes('teleconsultation') || doctor.telehealth_available) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Video className="h-4 w-4 text-primary" />
                        <span>{t('doctorProfile.videoConsultation')}</span>
                      </div>
                    )}
                    {doctor.consultation_types.includes('phone') && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-primary" />
                        <span>{t('doctorProfile.phoneConsultation')}</span>
                      </div>
                    )}
                    {doctor.consultation_types.length === 0 && !doctor.telehealth_available && (
                      <p className="text-sm text-muted-foreground">{isPt ? 'Consulta presencial' : 'In-person consultation'}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('doctorProfile.performanceMetrics')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('doctorProfile.patientSatisfaction')}</span>
                      <span className="font-medium">{doctor.patient_satisfaction}%</span>
                    </div>
                    <Progress value={doctor.patient_satisfaction} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('doctorProfile.appointmentPunctuality')}</span>
                      <span className="font-medium">{doctor.appointment_punctuality}%</span>
                    </div>
                    <Progress value={doctor.appointment_punctuality} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('doctorProfile.treatmentSuccess')}</span>
                      <span className="font-medium">{doctor.successful_treatments}%</span>
                    </div>
                    <Progress value={doctor.successful_treatments} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('doctorProfile.faq')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border-b last:border-0 pb-3 last:pb-0">
                      <p className="font-medium text-sm">
                        {isPt ? faq.question : faq.question_en}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isPt ? faq.answer : faq.answer_en}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Procedures Tab */}
            <TabsContent value="procedures" className="space-y-3 mt-4">
              {services.map((procedure) => (
                <Card key={procedure.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-base">
                          {isPt ? procedure.name : procedure.name_en}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isPt ? procedure.description : procedure.description_en}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span>{procedure.duration}</span>
                          </div>
                          {procedure.preparation && (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 flex-shrink-0" />
                              <span>{procedure.preparation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary text-lg whitespace-nowrap">
                          {formatPrice(procedure.consultation_fee)}
                        </p>
                        <Button size="sm" className="mt-2 w-full min-w-[100px]" onClick={handleBookAppointment}>
                          <Calendar className="h-3 w-3 mr-1" />
                          {t('doctorProfile.book')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Credentials Tab */}
            <TabsContent value="credentials" className="space-y-3 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('doctorProfile.educationTraining')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {credentials.map((cred) => (
                    <div key={cred.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {cred.type === 'education' && <GraduationCap className="h-5 w-5 text-primary" />}
                        {cred.type === 'residency' && <Hospital className="h-5 w-5 text-primary" />}
                        {cred.type === 'fellowship' && <Award className="h-5 w-5 text-primary" />}
                        {cred.type === 'certification' && <BadgeCheck className="h-5 w-5 text-primary" />}
                        {cred.type === 'membership' && <Users className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">
                          {isPt ? cred.title : cred.title_en}
                        </h4>
                        <p className="text-sm text-muted-foreground">{cred.institution}</p>
                        <p className="text-xs text-muted-foreground mt-1">{cred.year}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Medical License */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    {t('doctorProfile.medicalLicense')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{doctor.crm_number}</p>
                        <p className="text-xs text-muted-foreground">{t('doctorProfile.verifiedActive')}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-green-600 text-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {t('doctorProfile.verified')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Insurance Accepted */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {t('doctorProfile.insuranceAccepted')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {doctor.insurance_accepted.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {doctor.insurance_accepted.map((insurance: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-border text-sm">
                          <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                          <span className="truncate">{insurance}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-border text-sm w-fit">
                      <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                      <span>{isPt ? 'Particular (sem plano)' : 'Particular (out-of-pocket)'}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">{t('doctorProfile.alsoAcceptsSelfPay')}</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Video Testimonials Tab */}
            <TabsContent value="videos" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{t('videoTestimonials.title')}</h3>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        if (!user) {
                          toast.error(t('auth.loginRequired'));
                          navigate('/auth');
                          return;
                        }
                        setIsTestimonialDialogOpen(true);
                      }}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      {t('videoTestimonials.leaveTestimonial')}
                    </Button>
                  </div>
                  <VideoTestimonialList providerId={id || doctor.id} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary">{doctor.avg_rating}</p>
                      <div className="flex gap-0.5 justify-center my-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-4 w-4 ${
                              star <= Math.floor(doctor.avg_rating) 
                                ? 'text-amber-500 fill-amber-500' 
                                : 'text-muted-foreground'
                            }`} 
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {doctor.total_reviews} {t('doctorProfile.reviews')}
                      </p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {ratingDistribution.map((item) => (
                        <div key={item.stars} className="flex items-center gap-2">
                          <span className="text-xs w-3">{item.stars}</span>
                          <Progress value={item.percentage} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-10 text-right">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={review.avatar} alt={review.customer_name} />
                        <AvatarFallback>{review.customer_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{review.customer_name}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`h-3 w-3 ${
                                      star <= review.rating 
                                        ? 'text-amber-500 fill-amber-500' 
                                        : 'text-muted-foreground'
                                    }`} 
                                  />
                                ))}
                              </div>
                              {review.verified && (
                                <Badge variant="outline" className="text-xs h-5">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {t('doctorProfile.verifiedPatient')}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{review.date}</span>
                        </div>
                        
                        <p className="text-sm mt-2 leading-relaxed">{review.comment}</p>
                        
                        {(review.quality_rating || review.professionalism_rating || review.punctuality_rating) && (
                          <div className="flex gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
                            {review.quality_rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-current" />
                                <span>{t('doctorProfile.quality')}: {review.quality_rating}/5</span>
                              </div>
                            )}
                            {review.professionalism_rating && (
                              <div className="flex items-center gap-1">
                                <BadgeCheck className="h-3 w-3" />
                                <span>{t('doctorProfile.professionalism')}: {review.professionalism_rating}/5</span>
                              </div>
                            )}
                            {review.punctuality_rating && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{t('doctorProfile.punctuality')}: {review.punctuality_rating}/5</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {review.provider_response && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {t('doctorProfile.doctorResponse')}
                            </p>
                            <p className="text-sm text-muted-foreground">{review.provider_response}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3">
                          <Button variant="ghost" size="sm" className="h-8 text-xs">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {t('doctorProfile.helpful')} ({review.helpful_count})
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <UploadTestimonialDialog
          open={isTestimonialDialogOpen}
          onOpenChange={setIsTestimonialDialogOpen}
          providerId={doctor.id}
          providerName={`Dr. ${doctor.business_name}`}
        />
      </AppLayout>
    </>
  );
}

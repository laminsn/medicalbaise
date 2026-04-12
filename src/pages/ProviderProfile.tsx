import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { QuoteRequestForm } from '@/components/quote/QuoteRequestForm';
import { ProviderPixelTracker, trackConversion } from '@/components/tracking/ProviderPixelTracker';
import { supabase } from '@/integrations/supabase/client';
import { useFollowerStats } from '@/hooks/useFollowerStats';
import {
  Star,
  MapPin,
  Clock,
  Shield,
  Award,
  CheckCircle2,
  MessageCircle,
  Calendar,
  Heart,
  Share2,
  Play,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Languages,
  ThumbsUp,
  Zap,
  Crown,
  BadgeCheck,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Video,
  Repeat,
  Send,
} from 'lucide-react';
import { VideoTestimonialList } from '@/components/testimonials/VideoTestimonialList';
import { UploadTestimonialDialog } from '@/components/testimonials/UploadTestimonialDialog';
import { CreateScheduledServiceDialog } from '@/components/scheduling/CreateScheduledServiceDialog';
import { ProviderFeedTab } from '@/components/provider/ProviderFeedTab';
import { useStartConversation } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useTrackProfileView } from '@/hooks/useProfileViews';
import { toast } from 'sonner';

// Mock provider data - replace with real data from Supabase
const mockProvider = {
  id: '1',
  business_name: 'Clean Pro SP',
  tagline: 'Limpeza profissional com qualidade garantida',
  bio: 'Com mais de 10 anos de experiência em limpeza residencial e comercial, a Clean Pro SP oferece serviços de alta qualidade com produtos ecológicos. Nossa equipe é treinada e certificada para atender às suas necessidades com profissionalismo e eficiência.',
  avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200',
  years_experience: 10,
  total_jobs: 347,
  total_reviews: 128,
  avg_rating: 4.9,
  response_time_hours: 1,
  is_verified: true,
  is_background_checked: true,
  is_insured: true,
  is_licensed: true,
  subscription_tier: 'elite',
  address: 'São Paulo, SP',
  service_radius_km: 25,
  languages: ['Português', 'English'],
  business_type: 'company',
  completion_rate: 98,
  on_time_rate: 96,
  repeat_customer_rate: 67,
};

const providerServices = [
  { id: '1', name: 'Limpeza Residencial', hourly_rate: 80, description: 'Limpeza completa de casas e apartamentos' },
  { id: '2', name: 'Limpeza Comercial', hourly_rate: 100, description: 'Escritórios e espaços comerciais' },
  { id: '3', name: 'Limpeza Pós-Obra', fixed_price: 500, description: 'Limpeza pesada após reformas' },
  { id: '4', name: 'Limpeza de Vidros', hourly_rate: 60, description: 'Janelas e superfícies de vidro' },
];

const providerReviews = [
  {
    id: '1',
    customer_name: 'Maria S.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    rating: 5,
    date: '2 semanas atrás',
    comment: 'Excelente serviço! A equipe foi super profissional e pontual. Minha casa ficou impecável. Recomendo muito!',
    quality_rating: 5,
    professionalism_rating: 5,
    punctuality_rating: 5,
    verified: true,
    helpful_count: 47,
    provider_response: 'Obrigado Maria! Foi um prazer atender você. Estamos sempre à disposição!',
  },
  {
    id: '2',
    customer_name: 'João P.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    rating: 5,
    date: '1 mês atrás',
    comment: 'Contratei para limpeza pós-obra e superou minhas expectativas. Muito cuidadosos com os detalhes.',
    quality_rating: 5,
    professionalism_rating: 5,
    punctuality_rating: 4,
    verified: true,
    helpful_count: 23,
  },
  {
    id: '3',
    customer_name: 'Ana L.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    rating: 4,
    date: '2 meses atrás',
    comment: 'Bom serviço, preço justo. Voltaria a contratar.',
    quality_rating: 4,
    professionalism_rating: 5,
    punctuality_rating: 4,
    verified: true,
    helpful_count: 12,
  },
];

const providerPortfolio = [
  { id: '1', url: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400', caption: 'Sala de estar - Antes e depois' },
  { id: '2', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400', caption: 'Banheiro renovado' },
  { id: '3', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', caption: 'Cozinha limpa' },
  { id: '4', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', caption: 'Escritório comercial' },
  { id: '5', url: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400', caption: 'Apartamento completo' },
  { id: '6', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400', caption: 'Casa de luxo' },
];

const providerFaqs = [
  { question: 'Vocês fornecem os materiais de limpeza?', answer: 'Sim, utilizamos produtos profissionais e ecológicos. Caso prefira, podemos usar os seus materiais.' },
  { question: 'Qual é a política de cancelamento?', answer: 'Cancelamentos com mais de 24h de antecedência são gratuitos. Menos de 24h, cobramos 50% do valor.' },
  { question: 'Atendem aos finais de semana?', answer: 'Sim, atendemos sábados das 9h às 16h. Domingos e feriados sob consulta.' },
];

const ratingDistribution = [
  { stars: 5, percentage: 89 },
  { stars: 4, percentage: 8 },
  { stars: 3, percentage: 2 },
  { stars: 2, percentage: 1 },
  { stars: 1, percentage: 0 },
];

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { startConversation } = useStartConversation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
  const [isSchedulingDialogOpen, setIsSchedulingDialogOpen] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [pixelData, setPixelData] = useState<{ meta_pixel_id?: string; google_analytics_id?: string } | null>(null);
  const { followersCount, followingCount } = useFollowerStats(id);

  const { data: providerData, isLoading: isLoadingProvider } = useQuery({
    queryKey: ['provider-profile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('providers')
        .select('*, profiles!inner(first_name, last_name, avatar_url)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: providerServices = [] } = useQuery({
    queryKey: ['provider-services', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('provider_services').select('*, service_categories(name_pt, name_en)').eq('provider_id', id!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: providerReviews = [] } = useQuery({
    queryKey: ['provider-reviews', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('reviews').select('*, profiles!reviews_customer_id_fkey(first_name, last_name, avatar_url)').eq('provider_id', id!).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: providerPortfolio = [] } = useQuery({
    queryKey: ['provider-portfolio', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('portfolio_items').select('*').eq('provider_id', id!).order('order_index');
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: providerFaqs = [] } = useQuery({
    queryKey: ['provider-faqs', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('provider_faqs').select('*').eq('provider_id', id!).order('order_index');
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const provider = providerData ? {
    ...providerData,
    name: providerData.business_name || `${(providerData as any).profiles?.first_name || ''} ${(providerData as any).profiles?.last_name || ''}`.trim(),
    avatar_url: (providerData as any).profiles?.avatar_url || '',
  } : null;

  // Track profile view when component mounts
  useTrackProfileView(id, 'profile_page');

  // Fetch pixel tracking data for enterprise providers
  useEffect(() => {
    const fetchPixelData = async () => {
      if (!id) return;

      const { data } = await supabase
        .from('providers')
        .select('meta_pixel_id, google_analytics_id, subscription_tier')
        .eq('id', id)
        .single();

      if (data?.subscription_tier === 'enterprise') {
        setPixelData({
          meta_pixel_id: data.meta_pixel_id || undefined,
          google_analytics_id: data.google_analytics_id || undefined,
        });
      }
    };

    fetchPixelData();
  }, [id]);

  // Track pixel view event after pixels are initialized
  useEffect(() => {
    if (pixelData && id) {
      // Small delay to ensure pixels are loaded
      const timer = setTimeout(() => {
        trackConversion.profileView(id, provider.business_name);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pixelData, id, provider.business_name]);

  // Check if user has Elite+ tier for messaging (mock implementation)
  const canMessage = true; // TODO: Replace with actual tier check from provider subscription

  const handleMessageProvider = async () => {
    if (!user) {
      toast.error(t('common.loginRequired'));
      navigate('/auth');
      return;
    }

    if (!canMessage) {
      toast.error(t('messages.eliteRequired'));
      return;
    }

    // Track message click conversion
    trackConversion.messageClick(id || provider.id, provider.business_name);

    try {
      setIsStartingConversation(true);
      // Use the provider's id from the URL params or mock data
      const providerId = id || provider.id;
      const conversationId = await startConversation(providerId);
      if (conversationId) {
        navigate(`/chat/${conversationId}`);
      }
    } catch (error) {
      toast.error(t('messages.startError'));
    } finally {
      setIsStartingConversation(false);
    }
  };

  const handleOpenQuoteModal = () => {
    // Track quote request conversion
    trackConversion.quoteRequest(id || provider.id, provider.business_name);
    setIsQuoteModalOpen(true);
  };

  const handleOpenSchedulingDialog = () => {
    // Track booking initiation conversion
    trackConversion.bookingInitiated(id || provider.id, provider.business_name);
    setIsSchedulingDialogOpen(true);
  };

  const handleToggleFavorite = () => {
    if (!isFavorite) {
      // Track add to favorites conversion
      trackConversion.addToFavorites(id || provider.id, provider.business_name);
    }
    setIsFavorite(!isFavorite);
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'elite':
        return <Badge className="bg-amber-500 hover:bg-amber-600"><Crown className="h-3 w-3 mr-1" /> Elite</Badge>;
      case 'enterprise':
        return <Badge className="bg-purple-600 hover:bg-purple-700"><Zap className="h-3 w-3 mr-1" /> Enterprise</Badge>;
      default:
        return <Badge variant="secondary">Pro</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>{provider.business_name} - Brasil Base</title>
        <meta name="description" content={provider.tagline} />
      </Helmet>
      
      {/* Enterprise pixel tracking */}
      {pixelData && id && (
        <ProviderPixelTracker
          metaPixelId={pixelData.meta_pixel_id}
          googleAnalyticsId={pixelData.google_analytics_id}
          providerId={id}
        />
      )}
      
      <AppLayout>
        <div className="pb-24">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary/10 to-emerald-500/10 px-4 py-6">
            {/* Back Button */}
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
                <AvatarImage src={provider.avatar_url} />
                <AvatarFallback>{provider.business_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold">{provider.business_name}</h1>
                  {provider.is_verified && (
                    <BadgeCheck className="h-5 w-5 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{provider.tagline}</p>
                <div className="flex items-center gap-2">
                  {getTierBadge(provider.subscription_tier)}
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {provider.address}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-5 gap-2 mt-4">
              <div className="bg-background/80 rounded-lg p-2 text-center">
                <p className="font-bold">{followersCount}</p>
                <p className="text-xs text-muted-foreground">{t('providerProfile.followers', 'Followers')}</p>
              </div>
              <div className="bg-background/80 rounded-lg p-2 text-center">
                <p className="font-bold">{followingCount}</p>
                <p className="text-xs text-muted-foreground">{t('providerProfile.following', 'Following')}</p>
              </div>
              <div className="bg-background/80 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold">{provider.avg_rating}</span>
                </div>
                <p className="text-xs text-muted-foreground">{provider.total_reviews} {t('providerProfile.reviews')}</p>
              </div>
              <div className="bg-background/80 rounded-lg p-2 text-center">
                <p className="font-bold">{provider.total_jobs}</p>
                <p className="text-xs text-muted-foreground">{t('providerProfile.jobs')}</p>
              </div>
              <div className="bg-background/80 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <span className="font-bold">&lt;{provider.response_time_hours}h</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('providerProfile.response')}</p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              {provider.is_background_checked && (
                <Badge variant="outline" className="bg-background/80 text-xs">
                  <Shield className="h-3 w-3 mr-1 text-green-600" />
                  {t('providerProfile.backgroundChecked')}
                </Badge>
              )}
              {provider.is_insured && (
                <Badge variant="outline" className="bg-background/80 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                  {t('providerProfile.activeInsurance')}
                </Badge>
              )}
              {provider.is_licensed && (
                <Badge variant="outline" className="bg-background/80 text-xs">
                  <Award className="h-3 w-3 mr-1 text-green-600" />
                  {t('providerProfile.licensed')}
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <Button className="flex-1" onClick={handleOpenQuoteModal}>
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('providerProfile.requestQuote')}
              </Button>
              <Button variant="outline" onClick={handleOpenSchedulingDialog}>
                <Repeat className="h-4 w-4 mr-1" />
                {t('scheduling.scheduleService')}
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              <Button 
                variant="secondary" 
                className="flex-1 relative"
                onClick={handleMessageProvider}
                disabled={isStartingConversation}
              >
                <Send className="h-4 w-4 mr-2" />
                {t('providerProfile.messageProvider')}
                {!canMessage && (
                  <Badge className="absolute -top-2 -right-2 bg-amber-500 text-[10px] px-1">
                    <Crown className="h-2.5 w-2.5 mr-0.5" />
                    Elite+
                  </Badge>
                )}
              </Button>
              <Button variant="outline" size="icon" onClick={handleToggleFavorite}>
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs Content */}
          <Tabs defaultValue="about" className="px-4 mt-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="about" className="text-xs">{t('providerProfile.about')}</TabsTrigger>
              <TabsTrigger value="feed" className="text-xs">{t('providerProfile.feed', 'Feed')}</TabsTrigger>
              <TabsTrigger value="services" className="text-xs">{t('providerProfile.services')}</TabsTrigger>
              <TabsTrigger value="portfolio" className="text-xs">{t('providerProfile.portfolio')}</TabsTrigger>
              <TabsTrigger value="videos" className="text-xs">
                <Video className="h-3 w-3 mr-1" />
                {t('videoTestimonials.title')}
              </TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs">{t('providerProfile.reviewsTab')}</TabsTrigger>
            </TabsList>

            {/* Feed Tab */}
            <TabsContent value="feed" className="mt-4">
              <ProviderFeedTab providerId={id || ''} />
            </TabsContent>

            {/* About Tab */}
            <TabsContent value="about" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('providerProfile.aboutUs')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{provider.bio}</p>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{provider.business_type === 'company' ? t('providerProfile.company') : t('providerProfile.selfEmployed')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{t('providerProfile.radiusKm', { km: provider.service_radius_km })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-muted-foreground" />
                      <span>{provider.languages.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{t('providerProfile.years', { years: provider.years_experience })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('providerProfile.performanceMetrics')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('providerProfile.completionRate')}</span>
                      <span className="font-medium">{provider.completion_rate}%</span>
                    </div>
                    <Progress value={provider.completion_rate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('providerProfile.punctuality')}</span>
                      <span className="font-medium">{provider.on_time_rate}%</span>
                    </div>
                    <Progress value={provider.on_time_rate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('providerProfile.repeatCustomers')}</span>
                      <span className="font-medium">{provider.repeat_customer_rate}%</span>
                    </div>
                    <Progress value={provider.repeat_customer_rate} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Warranty & Guarantees */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    {t('providerProfile.warrantyGuarantees', 'Warranty & Guarantees')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm">{t('providerProfile.serviceWarranty', 'Service Warranty')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {t('providerProfile.mockWarranty', '1-year warranty on all installations. Free repairs for any defects in workmanship.')}
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-500" />
                      <span className="font-medium text-sm">{t('providerProfile.satisfactionGuarantee', 'Satisfaction Guarantee')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {t('providerProfile.mockGuarantee', '100% satisfaction guaranteed. If you\'re not happy with our work, we\'ll redo it for free.')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('providerProfile.faq')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {providerFaqs.map((faq, index) => (
                    <div key={index} className="border-b last:border-0 pb-3 last:pb-0">
                      <p className="font-medium text-sm">{faq.question}</p>
                      <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-3 mt-4">
              {providerServices.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                      <div className="text-right">
                        {service.hourly_rate ? (
                          <p className="font-bold text-primary">R${service.hourly_rate}/h</p>
                        ) : (
                          <p className="font-bold text-primary">R${service.fixed_price}</p>
                        )}
                        <Button size="sm" variant="outline" className="mt-2">
                          {t('providerProfile.request')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="mt-4">
              <div className="grid grid-cols-2 gap-2">
                {providerPortfolio.map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden">
                    <img 
                      src={item.url} 
                      alt={item.caption}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <p className="absolute bottom-2 left-2 right-2 text-white text-xs">
                      {item.caption}
                    </p>
                  </div>
                ))}
              </div>
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
                      onClick={() => setIsTestimonialDialogOpen(true)}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      {t('videoTestimonials.leaveTestimonial')}
                    </Button>
                  </div>
                  <VideoTestimonialList providerId={id || '1'} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-4 mt-4">
              {/* Rating Summary */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary">{provider.avg_rating}</p>
                      <div className="flex gap-0.5 justify-center my-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-4 w-4 ${star <= provider.avg_rating ? 'text-amber-500 fill-amber-500' : 'text-muted'}`} 
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{provider.total_reviews} {t('providerProfile.reviews')}</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {ratingDistribution.map((item) => (
                        <div key={item.stars} className="flex items-center gap-2">
                          <span className="text-xs w-3">{item.stars}</span>
                          <Progress value={item.percentage} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-8">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Reviews */}
              {providerReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.avatar} />
                        <AvatarFallback>{review.customer_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{review.customer_name}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`h-3 w-3 ${star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-muted'}`} 
                                  />
                                ))}
                              </div>
                              {review.verified && (
                                <Badge variant="outline" className="text-xs h-5">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {t('providerProfile.verified')}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{review.date}</span>
                        </div>
                        <p className="text-sm mt-2">{review.comment}</p>
                        
                        {review.provider_response && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs font-medium text-primary mb-1">{t('providerProfile.providerResponse')}</p>
                            <p className="text-sm text-muted-foreground">{review.provider_response}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3">
                          <Button variant="ghost" size="sm" className="h-8 text-xs">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {t('providerProfile.helpful')} ({review.helpful_count})
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

        {/* Quote Request Modal */}
        <QuoteRequestForm
          isOpen={isQuoteModalOpen}
          onClose={() => setIsQuoteModalOpen(false)}
          providerId={provider.id}
          providerName={provider.business_name}
        />

        {/* Upload Testimonial Dialog */}
        <UploadTestimonialDialog
          open={isTestimonialDialogOpen}
          onOpenChange={setIsTestimonialDialogOpen}
          providerId={provider.id}
          providerName={provider.business_name}
        />

        {/* Schedule Recurring Service Dialog */}
        <CreateScheduledServiceDialog
          open={isSchedulingDialogOpen}
          onOpenChange={setIsSchedulingDialogOpen}
          providerId={provider.id}
          providerName={provider.business_name}
        />
      </AppLayout>
    </>
  );
}

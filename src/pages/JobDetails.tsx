import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Zap,
  Star,
  Users,
  Calendar,
  Shield,
  FileText,
  Send,
  Lock,
  Crown,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

interface JobDetails {
  id: string;
  title: string;
  description: string;
  location_address: string | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_disclosed: boolean | null;
  urgency: string | null;
  is_featured: boolean | null;
  is_urgent: boolean | null;
  created_at: string | null;
  category_id: string | null;
  max_bids: number | null;
  customer_id: string;
  status: string | null;
  preferred_start_date: string | null;
  preferred_end_date: string | null;
  license_required: boolean | null;
  insurance_required: boolean | null;
  materials_included: string | null;
}

interface Bid {
  id: string;
  provider_id: string;
  quoted_price: number;
  proposal_text: string;
  submitted_at: string | null;
  status: string | null;
  provider?: {
    id: string;
    business_name: string;
    avg_rating: number | null;
    total_reviews: number | null;
    user_id: string;
  };
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<any>(null);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  
  const dateLocale = i18n.language === 'pt' ? ptBR : enUS;

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      
      setLoading(true);
      
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('jobs_posted')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (jobError) {
        console.error('Error fetching job:', jobError);
        toast.error(t('jobs.errorLoadingJob'));
        navigate('/jobs');
        return;
      }

      if (!jobData) {
        toast.error(t('jobs.jobNotFound'));
        navigate('/jobs');
        return;
      }

      setJob(jobData);

      // Fetch customer profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('user_id', jobData.customer_id)
        .maybeSingle();
      
      setCustomerProfile(profileData);

      // Fetch bids with provider info
      const { data: bidsData } = await supabase
        .from('bids')
        .select(`
          id,
          provider_id,
          quoted_price,
          proposal_text,
          submitted_at,
          status
        `)
        .eq('job_id', id)
        .order('submitted_at', { ascending: false });

      if (bidsData && bidsData.length > 0) {
        // Fetch provider details for each bid
        const providerIds = bidsData.map(b => b.provider_id);
        const { data: providersData } = await supabase
          .from('providers')
          .select('id, business_name, avg_rating, total_reviews, user_id')
          .in('id', providerIds);

        const bidsWithProviders = bidsData.map(bid => ({
          ...bid,
          provider: providersData?.find(p => p.id === bid.provider_id)
        }));

        setBids(bidsWithProviders);
      }

      setLoading(false);
    };

    const fetchProvider = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setProvider(data);
    };

    fetchJob();
    fetchProvider();
  }, [id, user, navigate, t]);

  const canBid = provider && provider.subscription_tier !== 'free';
  const isOwner = user && job?.customer_id === user.id;
  const hasAlreadyBid = bids.some(b => b.provider?.user_id === user?.id);

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '';
    const cat = SERVICE_CATEGORIES.find(c => c.id === categoryId);
    return i18n.language === 'pt' ? cat?.name_pt : cat?.name_en || categoryId;
  };

  const formatBudget = (min: number | null, max: number | null, disclosed: boolean | null) => {
    if (!disclosed) return t('jobs.budgetToDiscuss');
    if (!min && !max) return t('jobs.budgetToDiscuss');
    if (min && max) return `R$${min.toLocaleString()} - R$${max.toLocaleString()}`;
    if (min) return `R$${min.toLocaleString()}+`;
    if (max) return t('jobs.upTo') + ` R$${max.toLocaleString()}`;
    return t('jobs.budgetToDiscuss');
  };

  const getUrgencyLabel = (urgency: string | null) => {
    switch (urgency) {
      case 'emergency': return t('urgency.emergency');
      case 'asap': return t('urgency.asap');
      case 'flexible': return t('urgency.flexible');
      case 'scheduled': return t('urgency.scheduled');
      default: return t('urgency.flexible');
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'accepting_bids':
        return <Badge className="bg-blue-500">{t('jobs.acceptingBids')}</Badge>;
      case 'bid_accepted':
        return <Badge className="bg-amber-500">{t('jobs.bidAccepted')}</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-600">{t('jobs.inProgress')}</Badge>;
      case 'completed':
        return <Badge className="bg-green-600">{t('jobs.completed')}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t('jobs.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    // Verify the current user is the job owner before accepting
    if (!user || !job || job.customer_id !== user.id) {
      toast.error(t('jobs.errorAcceptingBid'));
      return;
    }

    const { error } = await supabase
      .from('bids')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', bidId)
      .eq('job_id', id); // Scope bid to this job

    if (error) {
      toast.error(t('jobs.errorAcceptingBid'));
      return;
    }

    // Update job status — scoped to the current user's jobs
    await supabase
      .from('jobs_posted')
      .update({ status: 'bid_accepted' })
      .eq('id', id)
      .eq('customer_id', user.id);

    toast.success(t('jobs.bidAcceptedSuccess'));
    
    // Refresh data
    window.location.reload();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">{t('common.loading')}...</div>
        </div>
      </AppLayout>
    );
  }

  if (!job) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('jobs.jobNotFound')}</h2>
          <Button onClick={() => navigate('/jobs')}>{t('jobs.backToJobs')}</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{job.title} - Brasil Base</title>
        <meta name="description" content={job.description.substring(0, 160)} />
      </Helmet>
      <AppLayout>
        <div className="px-4 py-6 pb-24">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {job.is_featured && (
                  <Badge className="bg-amber-500 text-xs">
                    <Star className="w-3 h-3 mr-1" /> {t('jobs.featured')}
                  </Badge>
                )}
                {(job.is_urgent || job.urgency === 'emergency') && (
                  <Badge variant="destructive" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" /> {t('jobs.urgent')}
                  </Badge>
                )}
                {getStatusBadge(job.status)}
              </div>
              <h1 className="text-xl font-bold">{job.title}</h1>
            </div>
          </div>

          {/* Main Info Card */}
          <Card className="mb-4">
            <CardContent className="p-4 space-y-4">
              <p className="text-muted-foreground">{job.description}</p>
              
              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-muted-foreground">{t('jobs.budget')}</p>
                    <p className="font-medium">{formatBudget(job.budget_min, job.budget_max, job.budget_disclosed)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-muted-foreground">{t('jobs.urgency')}</p>
                    <p className="font-medium">{getUrgencyLabel(job.urgency)}</p>
                  </div>
                </div>

                {job.location_address && (
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-muted-foreground">{t('jobs.location')}</p>
                      <p className="font-medium">{job.location_address}</p>
                    </div>
                  </div>
                )}

                {job.category_id && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-muted-foreground">{t('jobs.category')}</p>
                      <p className="font-medium">{getCategoryName(job.category_id)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-muted-foreground">{t('jobs.proposals')}</p>
                    <p className="font-medium">{bids.length}/{job.max_bids || 5}</p>
                  </div>
                </div>

                {job.preferred_start_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-muted-foreground">{t('jobs.preferredStart')}</p>
                      <p className="font-medium">{format(new Date(job.preferred_start_date), 'PP', { locale: dateLocale })}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Requirements */}
              {(job.license_required || job.insurance_required) && (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    {job.license_required && (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" /> {t('jobs.licenseRequired')}
                      </Badge>
                    )}
                    {job.insurance_required && (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" /> {t('jobs.insuranceRequired')}
                      </Badge>
                    )}
                  </div>
                </>
              )}

              <div className="text-xs text-muted-foreground">
                {t('jobs.published')} {job.created_at && formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: dateLocale })}
              </div>
            </CardContent>
          </Card>

          {/* Customer Info (for providers) */}
          {!isOwner && customerProfile && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={customerProfile.avatar_url} />
                    <AvatarFallback>
                      {customerProfile.first_name?.charAt(0) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">
                      {customerProfile.first_name} {customerProfile.last_name?.charAt(0)}.
                    </p>
                    <p className="text-sm text-muted-foreground">{t('jobs.client')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bid CTA for Providers */}
          {!isOwner && provider && job.status === 'accepting_bids' && (
            <Card className="mb-4">
              <CardContent className="p-4">
                {hasAlreadyBid ? (
                  <div className="text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="font-medium">{t('jobs.alreadySubmittedBid')}</p>
                    <p className="text-sm text-muted-foreground">{t('jobs.waitingForResponse')}</p>
                  </div>
                ) : canBid ? (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate(`/job/${id}/bid`)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {t('jobs.sendProposal')}
                  </Button>
                ) : (
                  <div className="text-center">
                    <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="font-medium mb-2">{t('jobs.upgradeToSendProposals')}</p>
                    <Button onClick={() => navigate('/pricing')}>
                      <Crown className="w-4 h-4 mr-2" />
                      {t('jobs.upgrade')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bids Section (for job owner) */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('jobs.receivedProposals')} ({bids.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {bids.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('jobs.noProposalsYet')}</p>
                  </div>
                ) : (
                  bids.map((bid) => (
                    <Card key={bid.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {bid.provider?.business_name?.charAt(0) || 'P'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{bid.provider?.business_name}</p>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="w-3 h-3 text-yellow-500" />
                                {bid.provider?.avg_rating?.toFixed(1) || '5.0'}
                                <span>({bid.provider?.total_reviews || 0})</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary text-lg">
                              R${bid.quoted_price.toLocaleString()}
                            </p>
                            {bid.status === 'accepted' && (
                              <Badge className="bg-green-500">{t('jobs.accepted')}</Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                          {bid.proposal_text}
                        </p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <span>
                            {bid.submitted_at && formatDistanceToNow(new Date(bid.submitted_at), { addSuffix: true, locale: dateLocale })}
                          </span>
                        </div>

                        {job.status === 'accepting_bids' && bid.status !== 'accepted' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => navigate(`/provider/${bid.provider_id}`)}
                            >
                              {t('jobs.viewProfile')}
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleAcceptBid(bid.id)}
                            >
                              {t('jobs.acceptProposal')}
                            </Button>
                          </div>
                        )}

                        {bid.status === 'accepted' && (
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => navigate(`/messages`)}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            {t('jobs.messageProvider')}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </AppLayout>
    </>
  );
}

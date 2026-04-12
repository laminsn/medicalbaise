import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/currency';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Briefcase,
  DollarSign,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/lib/i18n-utils';

interface Job {
  id: string;
  title: string;
  status: string | null;
  created_at: string | null;
  budget_min: number | null;
  budget_max: number | null;
  max_bids: number | null;
  bid_count?: number;
  accepted_provider?: string;
  final_price?: number;
}

export default function MyJobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('active');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const dateLocale = getDateFnsLocale(i18n);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user) return;

      setLoading(true);

      // Fetch user's jobs
      const { data: jobsData, error } = await supabase
        .from('jobs_posted')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        setLoading(false);
        return;
      }

      if (jobsData && jobsData.length > 0) {
        // Fetch bid counts
        const jobIds = jobsData.map(j => j.id);
        const { data: bidsData } = await supabase
          .from('bids')
          .select('job_id, status, provider_id')
          .in('job_id', jobIds);

        // Fetch accepted providers
        const acceptedBids = bidsData?.filter(b => b.status === 'accepted') || [];
        const providerIds = acceptedBids.map(b => b.provider_id);
        
        const providersMap: Record<string, string> = {};
        if (providerIds.length > 0) {
          const { data: providersData } = await supabase
            .from('providers')
            .select('id, business_name')
            .in('id', providerIds);
          
          providersData?.forEach(p => {
            providersMap[p.id] = p.business_name;
          });
        }

        const bidCounts: Record<string, number> = {};
        const acceptedProviders: Record<string, string> = {};
        
        bidsData?.forEach(bid => {
          bidCounts[bid.job_id] = (bidCounts[bid.job_id] || 0) + 1;
          if (bid.status === 'accepted' && providersMap[bid.provider_id]) {
            acceptedProviders[bid.job_id] = providersMap[bid.provider_id];
          }
        });

        const jobsWithData = jobsData.map(job => ({
          ...job,
          bid_count: bidCounts[job.id] || 0,
          accepted_provider: acceptedProviders[job.id],
        }));

        setJobs(jobsWithData);
      } else {
        setJobs([]);
      }

      setLoading(false);
    };

    fetchJobs();
  }, [user]);

  if (!user) {
    return (
      <>
        <Helmet>
          <title>{t('jobs.myJobs')} - Brasil Base</title>
        </Helmet>
        <AppLayout>
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Briefcase className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('jobs.myJobs')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('jobs.loginToViewJobs')}
            </p>
            <Button onClick={() => navigate('/auth')}>{t('auth.signIn')}</Button>
          </div>
        </AppLayout>
      </>
    );
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'accepting_bids':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"><Clock className="w-3 h-3 mr-1" /> {t('jobs.receivingProposals')}</Badge>;
      case 'bid_accepted':
        return <Badge className="bg-amber-500"><Users className="w-3 h-3 mr-1" /> {t('jobs.proposalAccepted')}</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-600"><Clock className="w-3 h-3 mr-1" /> {t('jobs.inProgress')}</Badge>;
      case 'completed':
        return <Badge className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> {t('jobs.completed')}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> {t('jobs.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeJobs = jobs.filter(j => ['accepting_bids', 'bid_accepted', 'in_progress'].includes(j.status || ''));
  const completedJobs = jobs.filter(j => ['completed', 'cancelled'].includes(j.status || ''));

  return (
    <>
      <Helmet>
        <title>{t('jobs.myJobs')} - Brasil Base</title>
      </Helmet>
      <AppLayout>
        <div className="px-4 py-6 pb-24">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{t('jobs.myJobs')}</h1>
              <p className="text-muted-foreground">{t('jobs.manageJobs')}</p>
            </div>
            <Button onClick={() => navigate('/post-job')}>
              <Plus className="w-4 h-4 mr-1" /> {t('common.new')}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-muted-foreground">{t('common.loading')}...</div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="active">
                  {t('jobs.active')} ({activeJobs.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  {t('jobs.history')} ({completedJobs.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-4">
                {activeJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">{t('jobs.noActiveJobs')}</p>
                    <Button onClick={() => navigate('/post-job')}>
                      <Plus className="w-4 h-4 mr-1" /> {t('jobs.publishJob')}
                    </Button>
                  </div>
                ) : (
                  activeJobs.map((job) => (
                    <Card 
                      key={job.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/job/${job.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            {getStatusBadge(job.status)}
                            <h3 className="font-semibold mt-2">{job.title}</h3>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">
                          {t('jobs.published')} {job.created_at && formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: dateLocale })}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              {job.bid_count || 0}/{job.max_bids || 5} {t('jobs.proposals')}
                            </span>
                            {(job.budget_min || job.budget_max) && (
                              <span className="flex items-center gap-1 text-primary font-medium">
                                <DollarSign className="w-4 h-4" />
                                {formatPrice(job.budget_min || 0)} - {formatPrice(job.budget_max || 0)}
                              </span>
                            )}
                          </div>
                          {(job.bid_count || 0) > 0 && job.status === 'accepting_bids' && (
                            <Button size="sm" variant="outline">
                              {t('jobs.viewProposals')}
                            </Button>
                          )}
                        </div>

                        {job.status === 'bid_accepted' && job.accepted_provider && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {job.accepted_provider.charAt(0)}
                                </span>
                              </div>
                              <span className="font-medium text-sm">{job.accepted_provider}</span>
                            </div>
                            <Button size="sm" variant="ghost" onClick={(e) => {
                              e.stopPropagation();
                              navigate('/messages');
                            }}>
                              <MessageCircle className="w-4 h-4 mr-1" /> {t('jobs.chat')}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {completedJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('jobs.noCompletedJobs')}</p>
                  </div>
                ) : (
                  completedJobs.map((job) => (
                    <Card 
                      key={job.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/job/${job.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            {getStatusBadge(job.status)}
                            <h3 className="font-semibold mt-2">{job.title}</h3>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {job.created_at && formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: dateLocale })}
                          </span>
                          {job.final_price && (
                            <span className="font-medium text-primary">
                              {formatPrice(job.final_price)}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </AppLayout>
    </>
  );
}

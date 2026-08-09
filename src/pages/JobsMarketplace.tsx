import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { useTranslation } from 'react-i18next';
import {
  Search,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Zap,
  Star,
  Users,
  ChevronRight,
  Lock,
  Crown,
  ArrowLeft,
  RefreshCw,
  Target,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale, getLocalizedCategoryName } from '@/lib/i18n-utils';
import { formatPrice } from '@/lib/currency';

interface Job {
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
  status: string | null;
  bid_count?: number;
}

interface ProviderSummary {
  id: string;
  subscription_tier: string | null;
  bids_remaining_this_month: number | null;
}

type OpportunityFilter = 'all' | 'matches' | 'today' | 'low_bids' | 'urgent';

export default function JobsMarketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [opportunityFilter, setOpportunityFilter] = useState<OpportunityFilter>('all');
  const [provider, setProvider] = useState<ProviderSummary | null>(null);
  const [providerCategoryIds, setProviderCategoryIds] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const dateLocale = getDateFnsLocale(i18n);

  const fetchJobs = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setLoadError(null);

    const { data: jobsData, error } = await supabase
      .from('jobs_marketplace_public')
      .select('*')
      .eq('status', 'accepting_bids')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      setLoadError(t('jobs.loadError', 'We could not load client opportunities. Please try again.'));
      setLoading(false);
      return;
    }

    if (jobsData && jobsData.length > 0) {
      const jobIds = jobsData.map((job) => job.id);
      const { data: bidsData } = await supabase
        .from('bids')
        .select('job_id')
        .in('job_id', jobIds);

      const bidCounts: Record<string, number> = {};
      bidsData?.forEach((bid) => {
        bidCounts[bid.job_id] = (bidCounts[bid.job_id] || 0) + 1;
      });

      setJobs(jobsData.map((job) => ({
        ...job,
        bid_count: bidCounts[job.id] || 0,
      })));
    } else {
      setJobs([]);
    }

    setLoading(false);
  }, [t]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (!user) {
      setProvider(null);
      setProviderCategoryIds([]);
      return;
    }

    const fetchProvider = async () => {
      const { data } = await supabase
        .from('providers')
        .select('id, subscription_tier, bids_remaining_this_month')
        .eq('user_id', user.id)
        .maybeSingle();

      setProvider(data);
      if (!data?.id) {
        setProviderCategoryIds([]);
        return;
      }

      const { data: services } = await supabase
        .from('provider_services')
        .select('category_id')
        .eq('provider_id', data.id);

      setProviderCategoryIds([
        ...new Set(
          (services || [])
            .map((service) => service.category_id)
            .filter((categoryId): categoryId is string => Boolean(categoryId)),
        ),
      ]);
    };

    void fetchProvider();
  }, [user]);

  useEffect(() => {
    const channel = supabase
      .channel('jobs-marketplace-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs_posted' },
        () => void fetchJobs(false),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchJobs]);

  const canBid = provider && provider.subscription_tier !== 'free';
  const bidsRemaining = provider?.bids_remaining_this_month;

  const getUrgencyBadge = (urgency: string | null, isUrgent: boolean | null) => {
    if (isUrgent || urgency === 'emergency') {
      return <Badge variant="destructive" className="text-xs"><Zap className="w-3 h-3 mr-1" /> {t('jobs.urgent')}</Badge>;
    }
    return null;
  };

  const getCategoryName = useCallback((categoryId: string | null) => {
    if (!categoryId) return '';
    const cat = SERVICE_CATEGORIES.find(c => c.id === categoryId);
    return cat ? getLocalizedCategoryName(cat, i18n, t) : categoryId;
  }, [i18n, t]);

  const formatBudget = (min: number | null, max: number | null, disclosed: boolean | null) => {
    if (!disclosed) return t('jobs.budgetToDiscuss');
    if (!min && !max) return t('jobs.budgetToDiscuss');
    if (min && max) return `${formatPrice(min)} - ${formatPrice(max)}`;
    if (min) return `${formatPrice(min)}+`;
    if (max) return formatPrice(max);
    return t('jobs.budgetToDiscuss');
  };

  const filteredJobs = useMemo(() => jobs.filter((job) => {
    if (searchQuery) {
      const query = searchQuery.trim().toLocaleLowerCase();
      const searchable = [
        job.title,
        job.description,
        getCategoryName(job.category_id),
        job.location_address,
      ].filter(Boolean).join(' ').toLocaleLowerCase();
      if (!searchable.includes(query)) return false;
    }

    if (selectedCategory !== 'all' && job.category_id !== selectedCategory) return false;

    const createdAt = new Date(job.created_at || 0).getTime();
    const isToday = Date.now() - createdAt <= 24 * 60 * 60 * 1000;
    const isLowCompetition = (job.bid_count || 0) <= 1;
    const isUrgent = Boolean(job.is_urgent || job.urgency === 'emergency');
    const isServiceMatch = providerCategoryIds.length === 0
      || Boolean(job.category_id && providerCategoryIds.includes(job.category_id));

    if (opportunityFilter === 'matches' && !isServiceMatch) return false;
    if (opportunityFilter === 'today' && !isToday) return false;
    if (opportunityFilter === 'low_bids' && !isLowCompetition) return false;
    if (opportunityFilter === 'urgent' && !isUrgent) return false;

    return true;
  }), [
    jobs,
    opportunityFilter,
    providerCategoryIds,
    searchQuery,
    selectedCategory,
    getCategoryName,
  ]);

  // Sort jobs
  const sortedJobs = useMemo(() => [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'budget_high':
        return (b.budget_max || 0) - (a.budget_max || 0);
      case 'urgent':
        if (a.is_urgent && !b.is_urgent) return -1;
        if (!a.is_urgent && b.is_urgent) return 1;
        return 0;
      case 'few_bids':
        return (a.bid_count || 0) - (b.bid_count || 0);
      default:
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
  }), [filteredJobs, sortBy]);

  const opportunityStats = useMemo(() => {
    const now = Date.now();
    const matched = jobs.filter((job) => (
      providerCategoryIds.length === 0
      || Boolean(job.category_id && providerCategoryIds.includes(job.category_id))
    )).length;
    const newToday = jobs.filter((job) => (
      now - new Date(job.created_at || 0).getTime() <= 24 * 60 * 60 * 1000
    )).length;
    const lowCompetition = jobs.filter((job) => (job.bid_count || 0) <= 1).length;
    const pipelineValue = jobs.reduce((total, job) => {
      if (!job.budget_disclosed) return total;
      return total + (job.budget_max || job.budget_min || 0);
    }, 0);

    return { matched, newToday, lowCompetition, pipelineValue };
  }, [jobs, providerCategoryIds]);

  if (!user) {
    return (
      <>
        <Helmet>
          <title>{t('jobs.jobMarketplace')} - MD Baise</title>
        </Helmet>
        <AppLayout>
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Briefcase className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('jobs.jobMarketplace')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('jobs.loginToViewJobs')}
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full max-w-xs">
              {t('auth.signIn')}
            </Button>
          </div>
        </AppLayout>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('jobs.jobMarketplace')} - MD Baise</title>
        <meta name="description" content={t('jobs.findOpportunities')} />
      </Helmet>
      <AppLayout>
        <div className="mx-auto max-w-6xl px-4 py-6 pb-24">
          {/* Header */}
          <section className="relative mb-6 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-emerald-500/10 p-5 shadow-sm sm:p-7">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
            <div className="relative flex items-start gap-3">
              <Button variant="secondary" size="icon" onClick={() => navigate(-1)} className="mt-0.5 rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  <Target className="h-4 w-4" />
                  {t('jobs.clientOpportunityCenter', 'Client Opportunity Center')}
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {t('jobs.findNextClient', 'Find your next client')}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {t('jobs.findOpportunities')}
                </p>
              </div>
            </div>

            <div className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: t('jobs.bestMatches', 'Best matches'), value: opportunityStats.matched, icon: Target },
                { label: t('jobs.newToday', 'New today'), value: opportunityStats.newToday, icon: Zap },
                { label: t('jobs.lowCompetition', 'Low competition'), value: opportunityStats.lowCompetition, icon: Users },
                { label: t('jobs.pipelineValue', 'Open value'), value: formatPrice(opportunityStats.pipelineValue), icon: TrendingUp },
              ].map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-border/70 bg-background/85 p-3 backdrop-blur">
                  <metric.icon className="mb-2 h-4 w-4 text-primary" />
                  <div className="truncate text-xl font-bold tabular-nums">{metric.value}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{metric.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Tier Warning */}
          {provider && !canBid && (
            <Card className="mb-4 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      {t('jobs.freePlanNoProposals')}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {t('jobs.upgradeToProDescription')}
                    </p>
                    <Button size="sm" className="mt-2" onClick={() => navigate('/pricing')}>
                      <Crown className="w-4 h-4 mr-1" /> {t('jobs.makeUpgrade')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bids Remaining */}
          {canBid && provider?.subscription_tier === 'pro' && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="font-medium">{t('jobs.proposalsRemainingThisMonth')}</span>
                  </div>
                  <Badge variant="secondary">{bidsRemaining ?? 20} / 20</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search & Filter */}
          <div className="space-y-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('jobs.searchJobs')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t('jobs.category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('categories.allCategories')}</SelectItem>
                  {SERVICE_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {getLocalizedCategoryName(cat, i18n, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t('jobs.newest')}</SelectItem>
                  <SelectItem value="budget_high">{t('jobs.highestBudget')}</SelectItem>
                  <SelectItem value="urgent">{t('jobs.urgentFirst')}</SelectItem>
                  <SelectItem value="few_bids">{t('jobs.fewestBids')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" aria-label={t('jobs.quickFilters', 'Quick opportunity filters')}>
              {([
                ['all', t('common.all', 'All')],
                ['matches', t('jobs.bestMatches', 'Best matches')],
                ['today', t('jobs.newToday', 'New today')],
                ['low_bids', t('jobs.lowCompetition', 'Low competition')],
                ['urgent', t('jobs.urgent', 'Urgent')],
              ] as Array<[OpportunityFilter, string]>).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={opportunityFilter === value ? 'default' : 'outline'}
                  onClick={() => setOpportunityFilter(value)}
                  className="shrink-0 rounded-full active:scale-[0.97]"
                  aria-pressed={opportunityFilter === value}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-pulse text-muted-foreground">{t('common.loading')}...</div>
            </div>
          )}

          {!loading && loadError && (
            <Card className="border-destructive/30">
              <CardContent className="flex flex-col items-center p-8 text-center">
                <RefreshCw className="mb-3 h-8 w-8 text-destructive" />
                <p className="max-w-md text-sm text-muted-foreground">{loadError}</p>
                <Button className="mt-4" onClick={() => void fetchJobs()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('common.retry', 'Try again')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Jobs List */}
          {!loading && !loadError && (
            <div className="space-y-4">
              {sortedJobs.map((job) => (
                <Card 
                  key={job.id} 
                  className={`cursor-pointer transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md active:scale-[0.995] ${job.is_featured ? 'border-primary/50 bg-primary/5' : ''}`}
                  onClick={() => navigate(`/job/${job.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') navigate(`/job/${job.id}`);
                  }}
                  role="link"
                  tabIndex={0}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {job.is_featured && (
                            <Badge className="bg-amber-500 text-xs">
                              <Star className="w-3 h-3 mr-1" /> {t('jobs.featured')}
                            </Badge>
                          )}
                          {getUrgencyBadge(job.urgency, job.is_urgent)}
                          {(job.bid_count || 0) === 0 && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                              🆕 {t('jobs.beFirst')}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold line-clamp-1">{job.title}</h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                      {/* Address hidden for privacy - only shown to job participants */}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {job.created_at && formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: dateLocale })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-sm font-medium text-primary">
                          <DollarSign className="w-4 h-4" />
                          {formatBudget(job.budget_min, job.budget_max, job.budget_disclosed)}
                        </span>
                        {job.category_id && (
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryName(job.category_id)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {job.bid_count || 0}/{job.max_bids || 5} {t('jobs.proposals')}
                      </div>
                    </div>

                    {canBid && (
                      <Button 
                        className="w-full mt-3" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/job/${job.id}/bid`);
                        }}
                      >
                        {t('jobs.sendProposal')}
                      </Button>
                    )}
                    {!canBid && provider && (
                      <Button 
                        className="w-full mt-3" 
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/pricing');
                        }}
                      >
                        <Lock className="w-4 h-4 mr-1" /> {t('jobs.upgradeToSend')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}

              {sortedJobs.length === 0 && (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('jobs.noJobsFound')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
}

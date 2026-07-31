import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MonthlyData {
  month: string;
  jobs: number;
  revenue: number;
}

interface ServiceBreakdown {
  name: string;
  value: number;
  color: string;
}

interface AnalyticsData {
  totalJobs: number;
  totalRevenue: number;
  avgRating: number;
  totalReviews: number;
  profileViews: number;
  monthlyData: MonthlyData[];
  serviceBreakdown: ServiceBreakdown[];
  responseRate: number;
  completionRate: number;
  repeatCustomers: number;
  avgCompletionDays: number;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function useProviderAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setAnalytics(null);
      setProviderId(null);
      setError(null);
      setLoading(false);
      return;
    }

    async function fetchProviderAndAnalytics() {
      setLoading(true);
      setError(null);
      
      try {
        // Get provider ID for current user
        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('id, avg_rating, total_reviews, total_jobs')
          .eq('user_id', user.id)
          .maybeSingle();

        if (providerError) throw providerError;
        if (!provider) {
          setAnalytics(null);
          setLoading(false);
          return;
        }

        setProviderId(provider.id);

        // Fetch all data in parallel
        const [
          activeJobsResult,
          reviewsResult,
          servicesResult,
          conversationsResult,
          profileViewsResult,
          messagesResult,
        ] = await Promise.all([
          // Get completed active jobs for revenue and job counts
          supabase
            .from('active_jobs')
            .select('id, agreed_price, job_status, created_at, actual_completion_date, start_date, customer_id')
            .eq('provider_id', user.id),
          
          // Get reviews for rating breakdown
          supabase
            .from('reviews')
            .select('overall_rating, created_at')
            .eq('provider_id', provider.id),
          
          // Get provider services with categories
          supabase
            .from('provider_services')
            .select('id, category_id, service_categories(name_en)')
            .eq('provider_id', provider.id),
          
          // Get conversations
          supabase
            .from('conversations')
            .select('id, customer_id, provider_id')
            .eq('provider_id', provider.id),
          
          // Get profile views count
          supabase
            .from('profile_views')
            .select('id, viewed_at')
            .eq('provider_id', provider.id),

          supabase
            .from('messages')
            .select('conversation_id, sender_id, created_at, conversations!inner(provider_id)')
            .eq('conversations.provider_id', provider.id)
            .order('created_at', { ascending: true })
        ]);

        const failedResult = [
          activeJobsResult,
          reviewsResult,
          servicesResult,
          conversationsResult,
          profileViewsResult,
          messagesResult,
        ].find((result) => result.error);
        if (failedResult?.error) throw failedResult.error;

        const activeJobs = activeJobsResult.data || [];
        const reviews = reviewsResult.data || [];
        const services = servicesResult.data || [];
        const conversations = conversationsResult.data || [];
        const profileViews = profileViewsResult.data || [];
        const messages = messagesResult.data || [];

        // Calculate total jobs and revenue
        const completedJobs = activeJobs.filter(j => j.job_status === 'completed');
        const totalRevenue = completedJobs.reduce((sum, job) => sum + (Number(job.agreed_price) || 0), 0);

        // Calculate monthly data for the last 6 months
        const monthlyData = calculateMonthlyData(activeJobs);

        // Calculate service breakdown
        const serviceBreakdown = calculateServiceBreakdown(services);

        // Calculate repeat customers
        const customerJobCounts = activeJobs.reduce<Record<string, number>>((counts, job) => {
          if (job.customer_id) {
            counts[job.customer_id] = (counts[job.customer_id] || 0) + 1;
          }
          return counts;
        }, {});
        const customerCounts = Object.values(customerJobCounts);
        const repeatCustomerRate = customerCounts.length > 0
          ? Math.round((customerCounts.filter((count) => count > 1).length / customerCounts.length) * 100)
          : 0;

        // Calculate completion rate
        const totalStartedJobs = activeJobs.filter(j => j.start_date).length;
        const completionRate = totalStartedJobs > 0 
          ? Math.round((completedJobs.length / totalStartedJobs) * 100) 
          : 0;

        // Calculate average completion time
        const jobsWithDates = completedJobs.filter(j => j.start_date && j.actual_completion_date);
        let avgCompletionDays = 0;
        if (jobsWithDates.length > 0) {
          const totalDays = jobsWithDates.reduce((sum, job) => {
            const start = new Date(job.start_date!);
            const end = new Date(job.actual_completion_date!);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0);
          avgCompletionDays = Math.round((totalDays / jobsWithDates.length) * 10) / 10;
        }

        const messagesByConversation = messages.reduce<Record<string, typeof messages>>((groups, message) => {
          (groups[message.conversation_id] ||= []).push(message);
          return groups;
        }, {});
        const conversationsWithInbound = conversations.filter((conversation) =>
          (messagesByConversation[conversation.id] || []).some((message) => message.sender_id !== user.id)
        );
        const respondedConversations = conversationsWithInbound.filter((conversation) => {
          const thread = messagesByConversation[conversation.id] || [];
          const firstInboundIndex = thread.findIndex((message) => message.sender_id !== user.id);
          return firstInboundIndex >= 0
            && thread.slice(firstInboundIndex + 1).some((message) => message.sender_id === user.id);
        });
        const responseRate = conversationsWithInbound.length > 0
          ? Math.round((respondedConversations.length / conversationsWithInbound.length) * 100)
          : 0;

        // Calculate average rating from reviews or use provider's stored value
        const avgRating = reviews.length > 0
          ? Math.round((reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length) * 10) / 10
          : provider.avg_rating || 0;

        setAnalytics({
          totalJobs: provider.total_jobs || completedJobs.length,
          totalRevenue,
          avgRating,
          totalReviews: provider.total_reviews || reviews.length,
          profileViews: profileViews.length,
          monthlyData,
          serviceBreakdown,
          responseRate,
          completionRate,
          repeatCustomers: repeatCustomerRate,
          avgCompletionDays,
        });
      } catch {
        setAnalytics(null);
        setError('Analytics are temporarily unavailable. Please try again.');

      } finally {
        setLoading(false);
      }
    }

    fetchProviderAndAnalytics();
  }, [user]);

  return { analytics, loading, providerId, error };
}

function calculateMonthlyData(jobs: any[]): MonthlyData[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const last6Months: MonthlyData[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = months[date.getMonth()];
    
    const monthJobs = jobs.filter(job => {
      const jobDate = new Date(job.created_at);
      return jobDate.getMonth() === date.getMonth() && 
             jobDate.getFullYear() === date.getFullYear();
    });

    const completedMonthJobs = monthJobs.filter(j => j.job_status === 'completed');
    const monthRevenue = completedMonthJobs.reduce((sum, job) => sum + (Number(job.agreed_price) || 0), 0);

    last6Months.push({
      month: monthKey,
      jobs: completedMonthJobs.length,
      revenue: monthRevenue,
    });
  }

  return last6Months;
}

function calculateServiceBreakdown(services: any[]): ServiceBreakdown[] {
  if (services.length === 0) {
    return [{ name: 'No services', value: 100, color: CHART_COLORS[0] }];
  }

  const categoryCount: Record<string, number> = {};
  
  services.forEach(service => {
    const categoryName = service.service_categories?.name_en || 'Other';
    categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
  });

  const total = services.length;
  const breakdown = Object.entries(categoryCount)
    .map(([name, count], index) => ({
      name,
      value: Math.round((count / total) * 100),
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return breakdown;
}

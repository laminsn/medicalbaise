import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDateFnsLocale, isPortuguese, isSpanish } from '@/lib/i18n-utils';
import { formatPrice } from '@/lib/currency';

export function RecentJobs() {
  const { t, i18n } = useTranslation();
  const isPt = isPortuguese(i18n);
  const dateLocale = getDateFnsLocale(i18n);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['recent-jobs-medical'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs_posted')
        .select(`
          id,
          title,
          budget_min,
          budget_max,
          urgency,
          created_at,
          location_address,
          category:service_categories(name_en, name_pt),
          bids(count)
        `)
        .eq('status', 'accepting_bids')
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading || jobs.length === 0) return null;

  return (
    <section className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">{t('jobs.recentJobs')}</h2>
        <Link to="/jobs" className="text-sm text-primary font-medium">
          {t('common.viewAll')}
        </Link>
      </div>

      <div className="space-y-3">
        {jobs.map((job: any) => {
          const categoryName = isPt
            ? job.category?.name_pt
            : job.category?.name_en;
          const bidsCount = job.bids?.[0]?.count ?? 0;

          return (
            <Link
              key={job.id}
              to={`/job/${job.id}`}
              className="block bg-card rounded-xl gradient-border p-4 card-interactive"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {job.urgency === 'asap' && (
                      <Badge variant="destructive" className="text-xs px-2 py-0">
                        <Flame className="w-3 h-3 mr-1" />
                        {t('jobs.urgent')}
                      </Badge>
                    )}
                    {categoryName && (
                      <Badge variant="secondary" className="text-xs px-2 py-0">
                        {categoryName}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium text-foreground line-clamp-2">
                    {job.title}
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {job.location_address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{job.location_address}</span>
                  </div>
                )}
                {(job.budget_min || job.budget_max) && (
                  <div className="flex items-center gap-1">
                    <Banknote className="w-3.5 h-3.5" />
                    <span>
                      {job.budget_min && job.budget_max
                        ? `${formatPrice(job.budget_min)} - ${formatPrice(job.budget_max)}`
                        : job.budget_min
                        ? `${formatPrice(job.budget_min)}+`
                        : formatPrice(job.budget_max)}
                    </span>
                  </div>
                )}
                {job.created_at && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: dateLocale })}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {bidsCount} {bidsCount === 1 ? t('jobs.proposal') : t('jobs.proposals')}
                </span>
                <span className="text-xs font-medium text-primary">
                  {t('jobs.viewDetails')} →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
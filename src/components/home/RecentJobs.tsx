import { Link } from 'react-router-dom';
import { Clock, MapPin, Banknote, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { getDateFnsLocale, isPortuguese, isSpanish } from '@/lib/i18n-utils';

// Mock data for recent jobs
const RECENT_JOBS = [
  {
    id: '1',
    title_en: 'Kitchen leak repair',
    title_pt: 'Reparo de vazamento na cozinha',
    title_es: 'Reparación de fuga en la cocina',
    category_en: 'Plumbing',
    category_pt: 'Encanamento',
    category_es: 'Plomería',
    location: 'Pinheiros, SP',
    budget_min: 150,
    budget_max: 300,
    urgency: 'asap',
    bids_count: 3,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    title_en: 'Split air conditioner installation',
    title_pt: 'Instalação de ar condicionado split',
    title_es: 'Instalación de aire acondicionado split',
    category_en: 'Air Conditioning',
    category_pt: 'Ar Condicionado',
    category_es: 'Aire acondicionado',
    location: 'Moema, SP',
    budget_min: 400,
    budget_max: 600,
    urgency: 'flexible',
    bids_count: 5,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: '3',
    title_en: 'Full apartment painting (2 bedrooms)',
    title_pt: 'Pintura completa de apartamento 2 quartos',
    title_es: 'Pintura completa de apartamento (2 habitaciones)',
    category_en: 'Painting',
    category_pt: 'Pintura',
    category_es: 'Pintura',
    location: 'Vila Madalena, SP',
    budget_min: 2000,
    budget_max: 3500,
    urgency: 'scheduled',
    bids_count: 8,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

export function RecentJobs() {
  const { t, i18n } = useTranslation();
  const isPt = isPortuguese(i18n);
  const isEs = isSpanish(i18n);
  const dateLocale = getDateFnsLocale(i18n);

  return (
    <section className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">{t('jobs.recentJobs')}</h2>
        <Link to="/jobs" className="text-sm text-primary font-medium">
          {t('common.viewAll')}
        </Link>
      </div>

      <div className="space-y-3">
        {RECENT_JOBS.map((job) => (
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
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    {isPt ? job.category_pt : isEs ? job.category_es : job.category_en}
                  </Badge>
                </div>
                <h3 className="font-medium text-foreground line-clamp-2">
                  {isPt ? job.title_pt : isEs ? job.title_es : job.title_en}
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5" />
                <span>R${job.budget_min} - R${job.budget_max}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {formatDistanceToNow(job.created_at, { addSuffix: true, locale: dateLocale })}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {job.bids_count} {job.bids_count === 1 ? t('jobs.proposal') : t('jobs.proposals')}
              </span>
              <span className="text-xs font-medium text-primary">
                {t('jobs.viewDetails')} →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
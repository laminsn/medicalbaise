import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MEDICAL_CATEGORIES } from '@/lib/constants';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Search, Filter, Star, MapPin, Clock, Shield,
  ChevronLeft, Users, Briefcase, Award, Loader2
} from 'lucide-react';
import { getLocalizedCategoryDescription, getLocalizedCategoryName } from '@/lib/i18n-utils';

export default function CategoryDetail() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t, i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [backgroundCheckedOnly, setBackgroundCheckedOnly] = useState(false);

  const category = MEDICAL_CATEGORIES.find(cat => cat.id === categoryId);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['category-providers', categoryId],
    queryFn: async () => {
      const { data: services, error: svcError } = await supabase
        .from('provider_services')
        .select('provider_id, service_categories!inner(id)')
        .eq('service_categories.id', categoryId!);
      if (svcError) throw svcError;
      const providerIds = [...new Set((services || []).map((s: any) => s.provider_id))];
      if (providerIds.length === 0) return [];
      const { data, error } = await supabase
        .from('providers')
        .select('id, business_name, avg_rating, total_reviews, is_verified, is_background_checked, response_time_hours, profiles!inner(first_name, last_name, avatar_url)')
        .in('id', providerIds);
      if (error) throw error;
      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.business_name || `${p.profiles?.first_name || ''} ${p.profiles?.last_name || ''}`.trim() || 'Provider',
        rating: Number(p.avg_rating) || 0,
        reviews: p.total_reviews || 0,
        hourlyRate: 0,
        responseTime: p.response_time_hours || 24,
        verified: p.is_verified || false,
        backgroundChecked: p.is_background_checked || false,
      }));
    },
    enabled: !!categoryId,
  });

  const filteredProviders = useMemo(() => {
    return providers.filter((provider: any) => {
      if (searchQuery && !provider.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (provider.rating < minRating) return false;
      if (verifiedOnly && !provider.verified) return false;
      if (backgroundCheckedOnly && !provider.backgroundChecked) return false;
      return true;
    });
  }, [providers, searchQuery, minRating, verifiedOnly, backgroundCheckedOnly]);

  if (!category) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {t('categories.notFound', 'Category not found')}
          </h1>
          <Link to="/categories" className="text-primary hover:underline">
            {t('categories.backToCategories', 'Back to categories')}
          </Link>
        </div>
      </AppLayout>
    );
  }

  const Icon = category.icon;
  const categoryName = getLocalizedCategoryName(category, i18n, t);
  const description = getLocalizedCategoryDescription(category, i18n, t);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">{t('nav.home')}</Link>
          <span>/</span>
          <Link to="/categories" className="hover:text-primary transition-colors">
            {t('categories.allCategories', 'Categories')}
          </Link>
          <span>/</span>
          <span className="text-foreground">{categoryName}</span>
        </div>

        {/* Category Header */}
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card gradient-border p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <Icon className="w-10 h-10" style={{ color: category.color }} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-3">{categoryName}</h1>
              <p className="text-muted-foreground max-w-2xl">{description}</p>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{providers.length} {t('providers.title', 'Providers')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="w-4 h-4" />
                <span>150+ {t('providers.jobsCompleted')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('providers.searchProviders')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {t('common.filters', 'Filters')}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{t('common.filters', 'Filters')}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Price Range */}
                <div>
                  <Label className="mb-3 block">
                    {t('filters.priceRange', 'Price range')}: R${priceRange[0]} - R${priceRange[1]}
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={200}
                    step={10}
                  />
                </div>

                {/* Minimum Rating */}
                <div>
                  <Label className="mb-3 block">
                    {t('providers.minRating')}: {minRating > 0 ? minRating : t('common.all')}
                  </Label>
                  <div className="flex gap-2">
                    {[0, 4, 4.5, 4.8].map((rating) => (
                      <Button
                        key={rating}
                        variant={minRating === rating ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMinRating(rating)}
                        className="flex items-center gap-1"
                      >
                        {rating === 0 ? t('common.all') : (
                          <>
                            <Star className="w-3 h-3 fill-current" />
                            {rating}+
                          </>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Verified Only */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('providers.verifiedOnly')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('providers.verifiedProviders', 'Show only verified professionals')}
                    </p>
                  </div>
                  <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
                </div>

                {/* Background Checked */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('provider.backgroundCheckRequired', 'Background checked')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('providers.verifiedProviders', 'Professionals with verified credentials')}
                    </p>
                  </div>
                  <Switch checked={backgroundCheckedOnly} onCheckedChange={setBackgroundCheckedOnly} />
                </div>

                {/* Clear Filters */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setPriceRange([0, 200]);
                    setMinRating(0);
                    setVerifiedOnly(false);
                    setBackgroundCheckedOnly(false);
                  }}
                >
                  {t('common.clearFilters', 'Clear filters')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {isLoading ? '...' : filteredProviders.length} {t('providers.providersFound')}
        </p>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Provider List */}
        <div className="grid gap-4">
          {filteredProviders.map((provider: any) => (
            <Link
              key={provider.id}
              to={`/provider/${provider.id}`}
              className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 via-card to-card gradient-border hover:from-primary/10 transition-all"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-muted-foreground">
                  {provider.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{provider.name}</h3>
                  {provider.verified && (
                    <Badge variant="secondary" className="text-xs">
                      <Award className="w-3 h-3 mr-1" />
                      {t('providers.verified')}
                    </Badge>
                  )}
                  {provider.backgroundChecked && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      {t('providers.verified', 'Verified')}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {provider.rating} ({provider.reviews})
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {isPt ? 'Responde em' : isEs ? 'Responde en' : 'Responds in'} {provider.responseTime}h
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">R${provider.hourlyRate}/h</p>
                <p className="text-xs text-muted-foreground">{t('providers.startingAt')}</p>
              </div>
            </Link>
          ))}
        </div>

        {filteredProviders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {isPt ? 'Nenhum profissional encontrado com os filtros selecionados' : isEs ? 'No se encontraron profesionales con tus filtros' : 'No providers found matching your criteria'}
            </p>
            <Button 
              variant="link" 
              onClick={() => {
                setSearchQuery('');
                setPriceRange([0, 200]);
                setMinRating(0);
                setVerifiedOnly(false);
                setBackgroundCheckedOnly(false);
              }}
            >
              {t('common.clearFilters', 'Clear filters')}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
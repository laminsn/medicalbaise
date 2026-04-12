import { Link } from 'react-router-dom';
import { Star, Heart, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '@/hooks/useFavorites';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function FeaturedProviders() {
  const { t } = useTranslation();
  const { toggleFavorite, isFavorited } = useFavorites();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['featured-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('providers')
        .select('id, business_name, avg_rating, total_reviews, subscription_tier, profiles!inner(first_name, last_name, avatar_url)')
        .order('avg_rating', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []).map((p: any) => ({
        id: p.id,
        business_name: p.business_name || `${p.profiles?.first_name || ''} ${p.profiles?.last_name || ''}`.trim() || 'Provider',
        avatar_url: p.profiles?.avatar_url || '',
        avg_rating: Number(p.avg_rating) || 0,
        total_reviews: p.total_reviews || 0,
        is_pro: p.subscription_tier !== 'free',
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">{t('providers.title')}</h2>
        <Link to="/browse" className="text-sm text-primary font-medium hover:underline">
          {t('common.viewAll')}
        </Link>
      </div>

      {providers.length === 0 && !isLoading && (
        <div className="text-center py-12 rounded-lg bg-card gradient-border">
          <p className="text-muted-foreground">
            {t('providers.noFeatured', 'No featured providers yet')}
          </p>
          <Link to="/browse" className="text-sm text-primary font-medium hover:underline mt-2 inline-block">
            {t('nav.explore')}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {providers.map((provider: any) => (
          <Link
            key={provider.id}
            to={`/provider/${provider.id}`}
            className="group bg-card rounded-lg overflow-hidden gradient-border hover:shadow-lg transition-all duration-300"
          >
            {/* Provider Header */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/20 via-card to-card flex items-center justify-center">
              <button 
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  toggleFavorite(provider.id, provider.business_name);
                }}
              >
                <Heart className={`w-4 h-4 transition-colors ${isFavorited(provider.id) ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
              </button>
              {provider.is_pro && (
                <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded">
                  {t('providers.pro')}
                </span>
              )}
            </div>

            {/* Provider Info */}
            <div className="p-3">
              {/* Provider avatar and name */}
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={provider.avatar_url} alt={provider.business_name} />
                  <AvatarFallback className="text-xs">{provider.business_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground truncate">
                  {provider.business_name}
                </span>
                {provider.is_pro && (
                  <span className="text-xs text-primary font-medium">PRO</span>
                )}
              </div>

              {/* Service description */}
              <p className="text-sm text-foreground line-clamp-2 mb-2 min-h-[40px]">
                {t('providers.professionalService')}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span className="text-sm font-bold text-foreground">{provider.avg_rating}</span>
                <span className="text-sm text-muted-foreground">({provider.total_reviews})</span>
              </div>

              {/* View Profile */}
              <div className="pt-2 border-t border-border">
                <span className="text-sm text-primary font-medium">
                  {t('common.viewProfile', 'View Profile')}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
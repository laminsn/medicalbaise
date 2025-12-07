import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Star, Trash2, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface FavoriteProvider {
  id: string;
  provider_id: string;
  created_at: string;
  providers: {
    id: string;
    business_name: string;
    tagline: string | null;
    avg_rating: number | null;
    total_reviews: number | null;
    is_verified: boolean | null;
    subscription_tier: string | null;
  };
}

export default function Favorites() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          provider_id,
          created_at,
          providers (
            id,
            business_name,
            tagline,
            avg_rating,
            total_reviews,
            is_verified,
            subscription_tier
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites((data as unknown as FavoriteProvider[]) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string, providerName: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(favorites.filter(f => f.id !== favoriteId));
      toast({
        title: t('favorites.removed'),
        description: t('favorites.removedDescription', { name: providerName }),
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: t('common.error'),
        description: t('favorites.removeError'),
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <Heart className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('favorites.title')}</h1>
          <p className="text-muted-foreground mb-6">{t('favorites.loginRequired')}</p>
          <Link to="/auth">
            <Button>{t('auth.signIn')}</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Heart className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{t('favorites.title')}</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl gradient-border p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">{t('favorites.empty')}</h2>
            <p className="text-muted-foreground mb-6 max-w-md">{t('favorites.emptyDescription')}</p>
            <Link to="/browse">
              <Button>{t('favorites.browseProviders')}</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="bg-card rounded-xl gradient-border p-4 card-interactive"
              >
                <div className="flex items-start gap-4">
                  <Link to={`/provider/${favorite.provider_id}`}>
                    <Avatar className="w-16 h-16">
                      <AvatarImage src="" alt={favorite.providers.business_name} />
                      <AvatarFallback className="text-lg bg-primary/10 text-primary">
                        {favorite.providers.business_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link 
                        to={`/provider/${favorite.provider_id}`}
                        className="text-lg font-semibold text-foreground hover:text-primary transition-colors truncate"
                      >
                        {favorite.providers.business_name}
                      </Link>
                      {favorite.providers.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          {t('providers.verified')}
                        </Badge>
                      )}
                      {favorite.providers.subscription_tier === 'pro' && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          {t('providers.pro')}
                        </Badge>
                      )}
                    </div>

                    {favorite.providers.tagline && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {favorite.providers.tagline}
                      </p>
                    )}

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span className="text-sm font-medium text-foreground">
                          {favorite.providers.avg_rating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({favorite.providers.total_reviews || 0})
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFavorite(favorite.id, favorite.providers.business_name)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '@/hooks/useFavorites';

// Mock data for featured providers with service images
const FEATURED_PROVIDERS = [
  {
    id: '1',
    business_name: 'Maria Silva',
    category_key: 'categories.cleaning',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    service_image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
    avg_rating: 4.9,
    total_reviews: 128,
    starting_price: 80,
    is_pro: true,
    level_key: 'providers.level2',
  },
  {
    id: '2',
    business_name: 'Carlos Santos',
    category_key: 'categories.electrical',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    service_image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
    avg_rating: 4.8,
    total_reviews: 95,
    starting_price: 120,
    is_pro: true,
    level_key: 'providers.level2',
  },
  {
    id: '3',
    business_name: 'Ana Costa',
    category_key: 'categories.painting',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    service_image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400',
    avg_rating: 5.0,
    total_reviews: 73,
    starting_price: 150,
    is_pro: false,
    level_key: 'providers.topRated',
  },
  {
    id: '4',
    business_name: 'Pedro Lima',
    category_key: 'categories.plumbing',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    service_image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
    avg_rating: 4.7,
    total_reviews: 156,
    starting_price: 100,
    is_pro: true,
    level_key: 'providers.level1',
  },
  {
    id: '5',
    business_name: 'Lucia Ferreira',
    category_key: 'categories.landscaping',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    service_image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400',
    avg_rating: 4.9,
    total_reviews: 89,
    starting_price: 200,
    is_pro: true,
    level_key: 'providers.level2',
  },
];

export function FeaturedProviders() {
  const { t } = useTranslation();
  const { toggleFavorite, isFavorited } = useFavorites();

  return (
    <section className="px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">{t('providers.title')}</h2>
        <Link to="/browse" className="text-sm text-primary font-medium hover:underline">
          {t('common.viewAll')}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {FEATURED_PROVIDERS.map((provider) => (
          <Link
            key={provider.id}
            to={`/provider/${provider.id}`}
            className="group bg-card rounded-lg overflow-hidden gradient-border hover:shadow-lg transition-all duration-300"
          >
            {/* Service Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={provider.service_image}
                alt={t(provider.category_key)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
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
                <span className="text-xs text-muted-foreground">
                  {t(provider.level_key)}
                </span>
              </div>

              {/* Service description */}
              <p className="text-sm text-foreground line-clamp-2 mb-2 min-h-[40px]">
                {t('providers.professionalService')} {t(provider.category_key).toLowerCase()}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span className="text-sm font-bold text-foreground">{provider.avg_rating}</span>
                <span className="text-sm text-muted-foreground">({provider.total_reviews})</span>
              </div>

              {/* Price */}
              <div className="pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {t('providers.from')}
                </span>
                <span className="text-base font-bold text-foreground ml-1">
                  R${provider.starting_price}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
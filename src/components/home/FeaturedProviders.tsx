import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '@/hooks/useFavorites';

// Mock data for featured medical providers
const FEATURED_PROVIDERS = [
  {
    id: '1',
    business_name: 'Dr. Maria Silva',
    category_key: 'categories.cardiology',
    avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200',
    service_image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400',
    avg_rating: 4.9,
    total_reviews: 128,
    starting_price: 250,
    is_pro: true,
    level_key: 'providers.level2',
  },
  {
    id: '2',
    business_name: 'Dr. Carlos Santos',
    category_key: 'categories.dermatology',
    avatar_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200',
    service_image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400',
    avg_rating: 4.8,
    total_reviews: 95,
    starting_price: 200,
    is_pro: true,
    level_key: 'providers.level2',
  },
  {
    id: '3',
    business_name: 'Dra. Ana Costa',
    category_key: 'categories.pediatrics',
    avatar_url: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200',
    service_image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400',
    avg_rating: 5.0,
    total_reviews: 73,
    starting_price: 180,
    is_pro: false,
    level_key: 'providers.topRated',
  },
  {
    id: '4',
    business_name: 'Dr. Pedro Lima',
    category_key: 'categories.orthopedics',
    avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200',
    service_image: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=400',
    avg_rating: 4.7,
    total_reviews: 156,
    starting_price: 300,
    is_pro: true,
    level_key: 'providers.level1',
  },
  {
    id: '5',
    business_name: 'Dra. Lucia Ferreira',
    category_key: 'categories.neurology',
    avatar_url: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=200',
    service_image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400',
    avg_rating: 4.9,
    total_reviews: 89,
    starting_price: 350,
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
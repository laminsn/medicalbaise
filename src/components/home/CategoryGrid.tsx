import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SERVICE_CATEGORIES } from '@/lib/constants';

// Top 10 most popular categories for homepage display
const POPULAR_CATEGORY_IDS = [
  'cleaning', 'plumbing', 'electrical', 'painting', 'handyman',
  'landscaping', 'hvac', 'carpentry', 'moving', 'appliance'
];

export function CategoryGrid() {
  const { t, i18n } = useTranslation();

  const popularCategories = SERVICE_CATEGORIES.filter(cat => 
    POPULAR_CATEGORY_IDS.includes(cat.id)
  );

  return (
    <section className="px-4 py-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {t('categories.title')}
          </h2>
          <Link to="/categories" className="text-sm text-primary font-medium hover:underline">
            {t('common.viewAll')}
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {popularCategories.map((category) => {
            const Icon = category.icon;
            const name = i18n.language === 'pt' ? category.name_pt : category.name_en;
            return (
              <Link
                key={category.id}
                to={`/categories/${category.id}`}
                className="group relative flex flex-col items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-primary/10 via-card to-card gradient-border hover:from-primary/20 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div 
                  className="relative w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: category.color }} />
                </div>
                <span className="relative text-sm font-medium text-center text-foreground line-clamp-2">
                  {name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

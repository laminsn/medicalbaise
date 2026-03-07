import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MEDICAL_CATEGORIES, POPULAR_SPECIALTIES } from '@/lib/constants';
import { Stethoscope } from 'lucide-react';
import { getLocalizedCategoryDescription, getLocalizedCategoryName } from '@/lib/i18n-utils';

export function CategoryGrid() {
  const { t, i18n } = useTranslation();

  // Preserve order and filter properly
  const popularCategories = POPULAR_SPECIALTIES
    .map(id => MEDICAL_CATEGORIES.find(cat => cat.id === id))
    .filter((cat): cat is NonNullable<typeof cat> => cat !== undefined);

  // Empty state handling
  if (popularCategories.length === 0) {
    return (
      <section className="px-4 py-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Stethoscope className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              {t('categories.noSpecialties')}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {t('categories.title')}
          </h2>
          <Link 
            to="/categories" 
            className="text-sm text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            {t('common.viewAll')}
          </Link>
        </div>
        
        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {popularCategories.map((category) => {
            const Icon = category.icon;
            const name = getLocalizedCategoryName(category, i18n, t);
            const description = getLocalizedCategoryDescription(category, i18n, t);
            
            return (
              <Link
                key={category.id}
                to={`/categories/${category.id}`}
                className="group relative flex flex-col items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-primary/10 via-card to-card border border-border hover:border-primary/50 hover:from-primary/20 transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label={`${t('categories.browse')} ${name}`}
                title={description}
              >
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Icon */}
                <div 
                  className="relative w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <Icon 
                    className="w-6 h-6" 
                    style={{ color: category.color }}
                    aria-hidden="true"
                  />
                </div>
                
                {/* Category name */}
                <span className="relative text-sm font-medium text-center text-foreground line-clamp-2 min-h-[2.5rem] flex items-center">
                  {name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Show count */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            {t('categories.showingCount', { 
              count: popularCategories.length,
              total: MEDICAL_CATEGORIES.length 
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
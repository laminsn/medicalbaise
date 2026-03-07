import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MEDICAL_CATEGORIES } from '@/lib/constants';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChevronRight } from 'lucide-react';

export default function Categories() {
  const { t, i18n } = useTranslation();

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('categories.allCategories', 'All Service Categories')}
          </h1>
          <p className="text-muted-foreground">
            {t(
              'categories.allCategoriesDescription',
              i18n.language === 'pt'
                ? 'Explore todas as especialidades disponíveis e encontre o profissional ideal para você.'
                : 'Browse all available specialties and find the right professional for your needs.',
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MEDICAL_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const name = i18n.language === 'pt' ? category.name_pt : category.name_en;
            const description = i18n.language === 'pt' ? category.description_pt : category.description_en;
            return (
              <Link
                key={category.id}
                to={`/categories/${category.id}`}
                className="group relative flex items-center gap-4 p-6 rounded-xl bg-gradient-to-br from-primary/5 via-card to-card gradient-border hover:from-primary/15 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div 
                  className="relative w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <Icon className="w-7 h-7" style={{ color: category.color }} />
                </div>
                <div className="relative flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-lg mb-1 truncate">
                    {name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
                <ChevronRight className="relative w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
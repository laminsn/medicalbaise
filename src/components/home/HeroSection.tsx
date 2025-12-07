import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const popularServices = [
    { key: 'cleaning', en: 'Cleaning', pt: 'Limpeza' },
    { key: 'plumbing', en: 'Plumber', pt: 'Encanador' },
    { key: 'electrical', en: 'Electrician', pt: 'Eletricista' },
    { key: 'painting', en: 'Painter', pt: 'Pintor' },
    { key: 'landscaping', en: 'Landscaper', pt: 'Jardineiro' },
  ];

  return (
    <section className="relative px-4 py-16 md:py-24 bg-gradient-to-r from-primary/20 via-background to-background">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          {t('hero.title')}
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          {t('hero.subtitle')}
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-6">
          <div className="flex bg-card rounded-lg overflow-hidden border border-border shadow-lg">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('hero.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 pr-4 border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>
            <Button 
              type="submit"
              size="lg"
              className="h-14 px-8 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {t('common.search')}
            </Button>
          </div>
        </form>

        {/* Popular searches */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('common.popular')}:
          </span>
          {popularServices.map((service) => (
            <Button
              key={service.key}
              variant="outline"
              size="sm"
              className="rounded-full border-border hover:border-primary hover:text-primary bg-card/50"
              onClick={() => navigate(`/browse?q=${encodeURIComponent(service.key)}`)}
            >
              {i18n.language === 'pt' ? service.pt : service.en}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MEDICAL_CATEGORIES, POPULAR_SPECIALTIES } from '@/lib/constants';
import { getLocalizedCategoryName } from '@/lib/i18n-utils';
import { toast } from 'sonner';

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // ✅ Enhanced search with validation
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedQuery = searchQuery.trim();
    
    // ✅ Validation
    if (!trimmedQuery) {
      toast.error(t('hero.enterSearchTerm'));
      return;
    }

    if (trimmedQuery.length < 2) {
      toast.error(t('hero.searchTooShort'));
      return;
    }

    if (trimmedQuery.length > 100) {
      toast.error(t('hero.searchTooLong'));
      return;
    }

    // ✅ Loading state
    setIsSearching(true);

    // ✅ Navigate with proper syntax
    navigate(`/browse?q=${encodeURIComponent(trimmedQuery)}`);
    
    // Reset loading state after navigation starts
    setTimeout(() => setIsSearching(false), 500);
  };

  // ✅ Handle specialty click
  const handleSpecialtyClick = (specialtyId: string) => {
    setIsSearching(true);
    navigate(`/browse?category=${specialtyId}`);
    setTimeout(() => setIsSearching(false), 500);
  };

  return (
    <section 
      className="relative px-4 py-16 md:py-24 bg-gradient-to-r from-primary/20 via-background to-background"
      role="search"
      aria-label={t('hero.findDoctors')}
    >
      <div className="max-w-3xl mx-auto text-center">
        {/* Heading */}
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          {t('hero.title')}
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('hero.subtitle')}
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-6">
          <div className="flex bg-card rounded-lg overflow-hidden border border-border shadow-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
            <div className="flex-1 relative">
              <Search 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" 
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder={t('hero.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 pr-4 border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                disabled={isSearching}
                aria-label={t('hero.searchDoctors')}
                maxLength={100}
              />
            </div>
            <Button 
              type="submit"
              size="lg"
              className="h-14 px-8 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('common.searching')}
                </>
              ) : (
                t('common.search')
              )}
            </Button>
          </div>
        </form>

        <div className="flex justify-center mb-4">
          <Link to="/browse">
            <Button variant="outline" size="lg" className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold px-8">
              {t('hero.bookAppointment', 'Book Appointment')}
            </Button>
          </Link>
        </div>

        {/* Popular Specialties */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('common.popular')}:
          </span>
          {POPULAR_SPECIALTIES.map((specialtyId) => {
            const specialty = MEDICAL_CATEGORIES.find(cat => cat.id === specialtyId);
            if (!specialty) return null;

            return (
              <Button
                key={specialty.id}
                variant="outline"
                size="sm"
                className="rounded-full border-border hover:border-primary hover:text-primary bg-card/50 transition-colors"
                onClick={() => handleSpecialtyClick(specialty.id)}
                disabled={isSearching}
              >
                {getLocalizedCategoryName(specialty, i18n, t)}
              </Button>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>{t('hero.licensedDoctors')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>{t('hero.verifiedReviews')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span>{t('hero.secureBooking')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

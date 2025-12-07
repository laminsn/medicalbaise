import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, MapPin, Stethoscope, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name_en: string;
  name_pt: string;
  icon: string;
}

interface FeedFiltersProps {
  selectedSpecialty: string | null;
  selectedLocation: string | null;
  onSpecialtyChange: (specialty: string | null) => void;
  onLocationChange: (location: string | null) => void;
}

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function FeedFilters({
  selectedSpecialty,
  selectedLocation,
  onSpecialtyChange,
  onLocationChange,
}: FeedFiltersProps) {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = [selectedSpecialty, selectedLocation].filter(Boolean).length;

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('service_categories')
        .select('id, name_en, name_pt, icon')
        .order('order_index');
      
      if (data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  const getCategoryName = (category: Category) => {
    return i18n.language === 'pt' ? category.name_pt : category.name_en;
  };

  const getSelectedSpecialtyName = () => {
    const category = categories.find(c => c.id === selectedSpecialty);
    return category ? getCategoryName(category) : null;
  };

  const clearFilters = () => {
    onSpecialtyChange(null);
    onLocationChange(null);
  };

  return (
    <div className="border-b border-border">
      {/* Quick Filter Pills */}
      <ScrollArea className="w-full">
        <div className="flex items-center gap-2 px-4 py-3">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 shrink-0">
                <Filter className="h-4 w-4" />
                {t('feed.filters', 'Filters')}
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  {t('feed.filterContent', 'Filter Content')}
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      {t('feed.clearAll', 'Clear All')}
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Specialty Filter */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    {t('feed.medicalSpecialty', 'Medical Specialty')}
                  </Label>
                  <Select
                    value={selectedSpecialty || 'all'}
                    onValueChange={(value) => onSpecialtyChange(value === 'all' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('feed.allSpecialties', 'All Specialties')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('feed.allSpecialties', 'All Specialties')}</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {getCategoryName(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Filter */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <MapPin className="h-5 w-5 text-primary" />
                    {t('feed.location', 'Location')}
                  </Label>
                  <Select
                    value={selectedLocation || 'all'}
                    onValueChange={(value) => onLocationChange(value === 'all' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('feed.allLocations', 'All Locations')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('feed.allLocations', 'All Locations')}</SelectItem>
                      {BRAZILIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => setIsOpen(false)}
                >
                  {t('feed.applyFilters', 'Apply Filters')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Active Filter Chips */}
          {selectedSpecialty && (
            <Badge 
              variant="secondary" 
              className="gap-1 cursor-pointer hover:bg-destructive/10"
              onClick={() => onSpecialtyChange(null)}
            >
              <Stethoscope className="h-3 w-3" />
              {getSelectedSpecialtyName()}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}

          {selectedLocation && (
            <Badge 
              variant="secondary" 
              className="gap-1 cursor-pointer hover:bg-destructive/10"
              onClick={() => onLocationChange(null)}
            >
              <MapPin className="h-3 w-3" />
              {selectedLocation}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}

          {/* Quick Specialty Pills */}
          {!selectedSpecialty && categories.slice(0, 5).map((category) => (
            <Button
              key={category.id}
              variant="outline"
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => onSpecialtyChange(category.id)}
            >
              {getCategoryName(category)}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

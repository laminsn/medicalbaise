import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Star, MapPin, CheckCircle, ShieldCheck, Calendar, Briefcase, Siren } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// Mock providers data
const MOCK_PROVIDERS = [
  {
    id: '1',
    business_name: 'Clean Pro SP',
    category_en: 'Cleaning',
    category_pt: 'Limpeza',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    avg_rating: 4.9,
    total_reviews: 128,
    total_jobs: 347,
    city: 'São Paulo',
    state: 'SP',
    hourly_rate: 80,
    is_verified: true,
    is_background_checked: true,
    is_emergency_available: false,
    subscription_tier: 'elite',
    response_time_en: '< 1 hour',
    response_time_pt: '< 1 hora',
    availability: ['weekdays', 'weekends'],
    contract_types: ['single', 'recurring', 'extended'],
    distance_km: 5,
  },
  {
    id: '2',
    business_name: 'Elétrica Silva',
    category_en: 'Electrical',
    category_pt: 'Elétrica',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    avg_rating: 4.8,
    total_reviews: 95,
    total_jobs: 234,
    city: 'São Paulo',
    state: 'SP',
    hourly_rate: 120,
    is_verified: true,
    is_background_checked: true,
    is_emergency_available: true,
    subscription_tier: 'pro',
    response_time_en: '< 3 hours',
    response_time_pt: '< 3 horas',
    availability: ['weekdays'],
    contract_types: ['single', 'recurring'],
    distance_km: 12,
  },
  {
    id: '3',
    business_name: 'Pintura Rápida',
    category_en: 'Painting',
    category_pt: 'Pintura',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    avg_rating: 4.7,
    total_reviews: 73,
    total_jobs: 189,
    city: 'Rio de Janeiro',
    state: 'RJ',
    hourly_rate: 90,
    is_verified: true,
    is_background_checked: false,
    is_emergency_available: false,
    subscription_tier: 'elite',
    response_time_en: 'Same day',
    response_time_pt: 'Mesmo dia',
    availability: ['weekdays', 'weekends', 'evenings'],
    contract_types: ['single', 'extended'],
    distance_km: 8,
  },
  {
    id: '4',
    business_name: 'Jardim Verde',
    category_en: 'Landscaping',
    category_pt: 'Jardinagem',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    avg_rating: 4.6,
    total_reviews: 56,
    total_jobs: 145,
    city: 'São Paulo',
    state: 'SP',
    hourly_rate: 70,
    is_verified: true,
    is_background_checked: true,
    is_emergency_available: true,
    subscription_tier: 'pro',
    response_time_en: '< 1 hour',
    response_time_pt: '< 1 hora',
    availability: ['weekdays', 'weekends'],
    contract_types: ['recurring', 'extended'],
    distance_km: 3,
  },
];

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function Browse() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [maxDistance, setMaxDistance] = useState([100]);
  const [backgroundCheckOnly, setBackgroundCheckOnly] = useState(false);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [selectedContractTypes, setSelectedContractTypes] = useState<string[]>([]);
  const { t, i18n } = useTranslation();

  const filteredProviders = MOCK_PROVIDERS.filter((provider) => {
    const category = i18n.language === 'pt' ? provider.category_pt : provider.category_en;
    
    // Category filter
    if (selectedCategory && category.toLowerCase() !== selectedCategory.toLowerCase()) {
      const cat = SERVICE_CATEGORIES.find(c => c.id === selectedCategory);
      const catName = i18n.language === 'pt' ? cat?.name_pt : cat?.name_en;
      if (cat && category !== catName) return false;
    }
    
    // Search query filter
    if (searchQuery && !provider.business_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !category.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Rating filter
    if (minRating > 0 && provider.avg_rating < minRating) return false;
    
    // Verified filter
    if (verifiedOnly && !provider.is_verified) return false;
    
    // Price filter
    if (provider.hourly_rate < priceRange[0] || provider.hourly_rate > priceRange[1]) return false;
    
    // State filter
    if (selectedState && provider.state !== selectedState) return false;
    
    // City filter
    if (cityQuery && !provider.city.toLowerCase().includes(cityQuery.toLowerCase())) return false;
    
    // Distance filter
    if (maxDistance[0] < 100 && provider.distance_km > maxDistance[0]) return false;
    
    // Background check filter
    if (backgroundCheckOnly && !provider.is_background_checked) return false;
    
    // Emergency services filter
    if (emergencyOnly && !provider.is_emergency_available) return false;
    
    // Availability filter
    if (selectedAvailability.length > 0) {
      const hasMatchingAvailability = selectedAvailability.some(av => 
        provider.availability.includes(av)
      );
      if (!hasMatchingAvailability) return false;
    }
    
    // Contract type filter
    if (selectedContractTypes.length > 0) {
      const hasMatchingContract = selectedContractTypes.some(ct => 
        provider.contract_types.includes(ct)
      );
      if (!hasMatchingContract) return false;
    }
    
    return true;
  });

  const clearFilters = () => {
    setSelectedCategory('');
    setPriceRange([0, 500]);
    setMinRating(0);
    setVerifiedOnly(false);
    setSelectedState('');
    setCityQuery('');
    setMaxDistance([100]);
    setBackgroundCheckOnly(false);
    setEmergencyOnly(false);
    setSelectedAvailability([]);
    setSelectedContractTypes([]);
  };

  const toggleAvailability = (value: string) => {
    setSelectedAvailability(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const toggleContractType = (value: string) => {
    setSelectedContractTypes(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  return (
    <AppLayout>
      <div className="px-4 py-4">
        {/* Search and filters */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('browse.searchProviders')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl">
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>{t('browse.filters')}</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(85vh-120px)] mt-4 pr-4">
                <div className="space-y-6">
                  {/* Location - State */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {t('browse.location')}
                    </Label>
                    <Select value={selectedState || "all"} onValueChange={(v) => setSelectedState(v === "all" ? "" : v)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={t('browse.selectState')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('browse.allStates')}</SelectItem>
                        {BRAZILIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={t('browse.cityPlaceholder')}
                      value={cityQuery}
                      onChange={(e) => setCityQuery(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  {/* Distance */}
                  <div>
                    <Label className="text-sm font-medium">{t('browse.distance')}</Label>
                    <p className="text-xs text-muted-foreground mb-2">{t('browse.distanceDescription')}</p>
                    <Slider
                      value={maxDistance}
                      onValueChange={setMaxDistance}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>0 {t('browse.km')}</span>
                      <span>{maxDistance[0] === 100 ? t('browse.anyDistance') : `${maxDistance[0]} ${t('browse.km')}`}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      {t('browse.ratings')}
                    </Label>
                    <div className="flex gap-2 mt-3">
                      {[0, 3, 3.5, 4, 4.5].map((rating) => (
                        <Button
                          key={rating}
                          variant={minRating === rating ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setMinRating(rating)}
                          className="flex-1"
                        >
                          {rating === 0 ? t('common.all') : `${rating}+`}
                          {rating > 0 && <Star className="w-3 h-3 ml-1 fill-current" />}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Services / Category */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {t('browse.servicesProvided')}
                    </Label>
                    <Select value={selectedCategory || "all"} onValueChange={(v) => setSelectedCategory(v === "all" ? "" : v)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={t('postJob.selectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        {SERVICE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {i18n.language === 'pt' ? cat.name_pt : cat.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Background Check */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <div>
                        <Label className="text-sm font-medium">{t('browse.backgroundCheck')}</Label>
                        <p className="text-xs text-muted-foreground">{t('browse.backgroundCheckDescription')}</p>
                      </div>
                    </div>
                    <Switch checked={backgroundCheckOnly} onCheckedChange={setBackgroundCheckOnly} />
                  </div>

                  {/* Emergency Services */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Siren className="w-4 h-4 text-destructive" />
                      <div>
                        <Label className="text-sm font-medium">{t('browse.emergencyServices')}</Label>
                        <p className="text-xs text-muted-foreground">{t('browse.emergencyServicesDescription')}</p>
                      </div>
                    </div>
                    <Switch checked={emergencyOnly} onCheckedChange={setEmergencyOnly} />
                  </div>

                  {/* Price range */}
                  <div>
                    <Label className="text-sm font-medium">{t('browse.averagePricing')}</Label>
                    <div className="mt-3">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={500}
                        step={10}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>R${priceRange[0]}</span>
                        <span>R${priceRange[1]}+</span>
                      </div>
                    </div>
                  </div>

                  {/* Availability */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {t('browse.availability')}
                    </Label>
                    <div className="space-y-3 mt-3">
                      {[
                        { id: 'weekdays', label: t('browse.weekdays') },
                        { id: 'weekends', label: t('browse.weekends') },
                        { id: 'evenings', label: t('browse.evenings') },
                      ].map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`availability-${option.id}`}
                            checked={selectedAvailability.includes(option.id)}
                            onCheckedChange={() => toggleAvailability(option.id)}
                          />
                          <label
                            htmlFor={`availability-${option.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contract Type */}
                  <div>
                    <Label className="text-sm font-medium">{t('browse.contractType')}</Label>
                    <div className="space-y-3 mt-3">
                      {[
                        { id: 'single', label: t('browse.singleGig'), desc: t('browse.singleGigDesc') },
                        { id: 'recurring', label: t('browse.recurring'), desc: t('browse.recurringDesc') },
                        { id: 'extended', label: t('browse.extended'), desc: t('browse.extendedDesc') },
                      ].map((option) => (
                        <div key={option.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`contract-${option.id}`}
                            checked={selectedContractTypes.includes(option.id)}
                            onCheckedChange={() => toggleContractType(option.id)}
                            className="mt-0.5"
                          />
                          <div>
                            <label
                              htmlFor={`contract-${option.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {option.label}
                            </label>
                            <p className="text-xs text-muted-foreground">{option.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verified only */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">{t('browse.verifiedOnly')}</Label>
                      <p className="text-xs text-muted-foreground">{t('browse.verifiedDescription')}</p>
                    </div>
                    <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
                  </div>
                </div>
              </ScrollArea>

              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Button variant="outline" className="flex-1" onClick={clearFilters}>
                  {t('browse.clearFilters')}
                </Button>
                <Button className="flex-1" onClick={() => {}}>
                  {t('browse.applyFilters')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            size="sm"
            className="flex-shrink-0 rounded-full"
            onClick={() => setSelectedCategory('')}
          >
            {t('common.all')}
          </Button>
          {SERVICE_CATEGORIES.slice(0, 8).map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              className="flex-shrink-0 rounded-full"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {i18n.language === 'pt' ? cat.name_pt : cat.name_en}
            </Button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredProviders.length} {t('browse.providersFound')}
        </p>

        {/* Provider list */}
        <div className="space-y-3">
          {filteredProviders.map((provider) => {
            const category = i18n.language === 'pt' ? provider.category_pt : provider.category_en;
            const responseTime = i18n.language === 'pt' ? provider.response_time_pt : provider.response_time_en;
            
            return (
              <div
                key={provider.id}
                className="bg-card rounded-xl border border-border p-4 card-interactive"
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={provider.avatar_url}
                      alt={provider.business_name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    {provider.is_verified && (
                      <CheckCircle className="absolute -bottom-1 -right-1 w-5 h-5 text-primary fill-card" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-semibold text-foreground truncate">
                          {provider.business_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{category}</p>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {provider.is_emergency_available && (
                          <Badge variant="destructive" className="text-xs">
                            <Siren className="w-3 h-3 mr-1" />
                            {t('browse.emergency')}
                          </Badge>
                        )}
                        {provider.is_background_checked && (
                          <Badge variant="secondary" className="text-xs">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            {t('browse.backgroundChecked')}
                          </Badge>
                        )}
                        {provider.subscription_tier === 'elite' && (
                          <Badge className="bg-secondary/10 text-secondary text-xs">
                            ⭐ Elite
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-sm mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span className="font-medium">{provider.avg_rating}</span>
                        <span className="text-muted-foreground">({provider.total_reviews})</span>
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{provider.total_jobs} {t('browse.jobs')}</span>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{provider.city}, {provider.state}</span>
                        <span className="mx-1">•</span>
                        <span>{responseTime}</span>
                      </div>
                      <span className="font-semibold text-primary">
                        R${provider.hourly_rate}{t('providers.hourlyRate')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

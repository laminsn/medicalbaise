import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Search, Filter, Star, MapPin, Clock, Shield, 
  ChevronLeft, Users, Briefcase, Award
} from 'lucide-react';

// Category descriptions for SEO and user context
const CATEGORY_DESCRIPTIONS: Record<string, { en: string; pt: string; features: string[] }> = {
  cleaning: {
    en: 'Professional cleaning services for homes, offices, and commercial spaces. From deep cleaning to regular maintenance, find trusted cleaners in your area.',
    pt: 'Serviços profissionais de limpeza para casas, escritórios e espaços comerciais. De limpeza profunda a manutenção regular, encontre profissionais de confiança na sua região.',
    features: ['Deep Cleaning', 'Regular Maintenance', 'Move-in/Move-out', 'Commercial Cleaning']
  },
  plumbing: {
    en: 'Expert plumbing services for repairs, installations, and maintenance. Licensed plumbers ready to handle any water system issue.',
    pt: 'Serviços especializados de encanamento para reparos, instalações e manutenção. Encanadores licenciados prontos para resolver qualquer problema hidráulico.',
    features: ['Leak Repairs', 'Pipe Installation', 'Drain Cleaning', 'Water Heater Service']
  },
  electrical: {
    en: 'Certified electricians for safe and reliable electrical work. From wiring to panel upgrades, trust the experts.',
    pt: 'Eletricistas certificados para trabalhos elétricos seguros e confiáveis. De fiação a upgrades de painéis, confie nos especialistas.',
    features: ['Wiring & Rewiring', 'Panel Upgrades', 'Lighting Installation', 'Safety Inspections']
  },
  hvac: {
    en: 'Heating, ventilation, and air conditioning specialists. Keep your home comfortable year-round with professional HVAC services.',
    pt: 'Especialistas em aquecimento, ventilação e ar condicionado. Mantenha sua casa confortável o ano todo com serviços profissionais.',
    features: ['AC Installation', 'Heating Repair', 'Duct Cleaning', 'Maintenance Plans']
  },
  painting: {
    en: 'Interior and exterior painting professionals. Transform your space with quality workmanship and attention to detail.',
    pt: 'Profissionais de pintura interna e externa. Transforme seu espaço com trabalho de qualidade e atenção aos detalhes.',
    features: ['Interior Painting', 'Exterior Painting', 'Cabinet Refinishing', 'Wallpaper']
  },
  carpentry: {
    en: 'Skilled carpenters for custom woodwork, repairs, and installations. From furniture to structural work.',
    pt: 'Carpinteiros habilidosos para trabalhos em madeira personalizados, reparos e instalações. De móveis a trabalhos estruturais.',
    features: ['Custom Furniture', 'Cabinet Making', 'Deck Building', 'Trim & Molding']
  },
  landscaping: {
    en: 'Professional landscaping and garden services. Create and maintain beautiful outdoor spaces.',
    pt: 'Serviços profissionais de paisagismo e jardinagem. Crie e mantenha espaços externos bonitos.',
    features: ['Lawn Care', 'Garden Design', 'Tree Services', 'Irrigation Systems']
  },
  pest: {
    en: 'Effective pest control solutions for homes and businesses. Safe, eco-friendly treatments available.',
    pt: 'Soluções eficazes de controle de pragas para casas e empresas. Tratamentos seguros e ecológicos disponíveis.',
    features: ['Insect Control', 'Rodent Removal', 'Termite Treatment', 'Prevention Plans']
  },
  handyman: {
    en: 'Versatile handyman services for all your home repair and maintenance needs. No job too small.',
    pt: 'Serviços versáteis de manutenção para todas as suas necessidades de reparo e manutenção residencial. Nenhum trabalho é pequeno demais.',
    features: ['General Repairs', 'Assembly', 'Mounting', 'Minor Renovations']
  },
  roofing: {
    en: 'Professional roofing services for repairs, replacements, and inspections. Protect your home from the elements.',
    pt: 'Serviços profissionais de telhados para reparos, substituições e inspeções. Proteja sua casa das intempéries.',
    features: ['Roof Repair', 'Replacement', 'Inspections', 'Gutter Services']
  },
  flooring: {
    en: 'Expert flooring installation and refinishing. Hardwood, tile, laminate, and more.',
    pt: 'Instalação e restauração de pisos por especialistas. Madeira, cerâmica, laminado e muito mais.',
    features: ['Hardwood', 'Tile & Stone', 'Laminate', 'Floor Refinishing']
  },
  appliance: {
    en: 'Appliance repair specialists for all major brands. Fast, reliable service to get your appliances running again.',
    pt: 'Especialistas em reparo de eletrodomésticos para todas as principais marcas. Serviço rápido e confiável.',
    features: ['Washer/Dryer', 'Refrigerator', 'Dishwasher', 'Oven & Stove']
  },
  moving: {
    en: 'Professional moving services for local and long-distance relocations. Packing, loading, and delivery.',
    pt: 'Serviços profissionais de mudança para relocações locais e de longa distância. Embalagem, carregamento e entrega.',
    features: ['Local Moving', 'Long Distance', 'Packing Services', 'Storage']
  },
  security: {
    en: 'Security system installation and locksmith services. Keep your property safe and secure.',
    pt: 'Instalação de sistemas de segurança e serviços de chaveiro. Mantenha sua propriedade segura.',
    features: ['Lock Services', 'Alarm Systems', 'Camera Installation', 'Smart Locks']
  },
  pool: {
    en: 'Pool and spa maintenance, repair, and installation services. Keep your pool crystal clear.',
    pt: 'Serviços de manutenção, reparo e instalação de piscinas e spas. Mantenha sua piscina cristalina.',
    features: ['Pool Cleaning', 'Equipment Repair', 'Renovation', 'Spa Services']
  },
  masonry: {
    en: 'Expert masonry work including brick, stone, and concrete. Quality craftsmanship for lasting results.',
    pt: 'Trabalhos especializados de alvenaria incluindo tijolo, pedra e concreto. Artesanato de qualidade para resultados duradouros.',
    features: ['Brick Work', 'Stone Installation', 'Concrete', 'Repair & Restoration']
  },
  auto: {
    en: 'Mobile auto services including car wash, detailing, and repairs. Convenient services at your location.',
    pt: 'Serviços automotivos móveis incluindo lavagem, detalhamento e reparos. Serviços convenientes na sua localização.',
    features: ['Mobile Wash', 'Detailing', 'Tire Services', 'Minor Repairs']
  },
  home_decorator: {
    en: 'Interior and exterior decorating services. Transform your space with professional design expertise.',
    pt: 'Serviços de decoração de interiores e exteriores. Transforme seu espaço com expertise profissional em design.',
    features: ['Interior Design', 'Exterior Design', 'Seasonal Decor', 'Event Decoration']
  }
};

// Mock providers for demo
const MOCK_PROVIDERS = [
  { id: '1', name: 'João Silva', rating: 4.9, reviews: 127, hourlyRate: 85, responseTime: 2, verified: true, backgroundChecked: true },
  { id: '2', name: 'Maria Santos', rating: 4.8, reviews: 89, hourlyRate: 95, responseTime: 1, verified: true, backgroundChecked: true },
  { id: '3', name: 'Carlos Oliveira', rating: 4.7, reviews: 56, hourlyRate: 75, responseTime: 3, verified: true, backgroundChecked: false },
  { id: '4', name: 'Ana Costa', rating: 4.9, reviews: 203, hourlyRate: 110, responseTime: 1, verified: true, backgroundChecked: true },
  { id: '5', name: 'Pedro Lima', rating: 4.6, reviews: 42, hourlyRate: 70, responseTime: 4, verified: false, backgroundChecked: false },
  { id: '6', name: 'Fernanda Souza', rating: 4.8, reviews: 98, hourlyRate: 90, responseTime: 2, verified: true, backgroundChecked: true },
];

export default function CategoryDetail() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t, i18n } = useTranslation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [backgroundCheckedOnly, setBackgroundCheckedOnly] = useState(false);

  const category = SERVICE_CATEGORIES.find(cat => cat.id === categoryId);
  const categoryInfo = categoryId ? CATEGORY_DESCRIPTIONS[categoryId] : null;

  const filteredProviders = useMemo(() => {
    return MOCK_PROVIDERS.filter(provider => {
      if (searchQuery && !provider.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (provider.hourlyRate < priceRange[0] || provider.hourlyRate > priceRange[1]) return false;
      if (provider.rating < minRating) return false;
      if (verifiedOnly && !provider.verified) return false;
      if (backgroundCheckedOnly && !provider.backgroundChecked) return false;
      return true;
    });
  }, [searchQuery, priceRange, minRating, verifiedOnly, backgroundCheckedOnly]);

  if (!category || !categoryInfo) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Category not found</h1>
          <Link to="/categories" className="text-primary hover:underline">
            Back to all categories
          </Link>
        </div>
      </AppLayout>
    );
  }

  const Icon = category.icon;
  const categoryName = i18n.language === 'pt' ? category.name_pt : category.name_en;
  const description = i18n.language === 'pt' ? categoryInfo.pt : categoryInfo.en;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/categories" className="hover:text-primary transition-colors">
            {t('categories.allCategories', 'Categories')}
          </Link>
          <span>/</span>
          <span className="text-foreground">{categoryName}</span>
        </div>

        {/* Category Header */}
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card gradient-border p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <Icon className="w-10 h-10" style={{ color: category.color }} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-3">{categoryName}</h1>
              <p className="text-muted-foreground max-w-2xl">{description}</p>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{MOCK_PROVIDERS.length} {t('common.providers', 'Providers')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="w-4 h-4" />
                <span>150+ {t('common.jobsCompleted', 'Jobs Completed')}</span>
              </div>
            </div>
          </div>

          {/* Feature tags */}
          <div className="relative flex flex-wrap gap-2 mt-6">
            {categoryInfo.features.map((feature, idx) => (
              <Badge key={idx} variant="secondary" className="bg-background/50">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('common.searchProviders', 'Search providers...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {t('common.filters', 'Filters')}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{t('common.filters', 'Filters')}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Price Range */}
                <div>
                  <Label className="mb-3 block">
                    {t('filters.priceRange', 'Price Range')}: R${priceRange[0]} - R${priceRange[1]}
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={200}
                    step={10}
                  />
                </div>

                {/* Minimum Rating */}
                <div>
                  <Label className="mb-3 block">
                    {t('filters.minRating', 'Minimum Rating')}: {minRating > 0 ? minRating : 'Any'}
                  </Label>
                  <div className="flex gap-2">
                    {[0, 4, 4.5, 4.8].map((rating) => (
                      <Button
                        key={rating}
                        variant={minRating === rating ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMinRating(rating)}
                        className="flex items-center gap-1"
                      >
                        {rating === 0 ? 'Any' : (
                          <>
                            <Star className="w-3 h-3 fill-current" />
                            {rating}+
                          </>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Verified Only */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('filters.verifiedOnly', 'Verified Only')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('filters.verifiedDesc', 'Show only verified professionals')}
                    </p>
                  </div>
                  <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
                </div>

                {/* Background Checked */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('filters.backgroundChecked', 'Background Checked')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('filters.backgroundDesc', 'Professionals with verified background')}
                    </p>
                  </div>
                  <Switch checked={backgroundCheckedOnly} onCheckedChange={setBackgroundCheckedOnly} />
                </div>

                {/* Clear Filters */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setPriceRange([0, 200]);
                    setMinRating(0);
                    setVerifiedOnly(false);
                    setBackgroundCheckedOnly(false);
                  }}
                >
                  {t('common.clearFilters', 'Clear Filters')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredProviders.length} {t('common.providersFound', 'providers found')}
        </p>

        {/* Provider List */}
        <div className="grid gap-4">
          {filteredProviders.map((provider) => (
            <Link
              key={provider.id}
              to={`/provider/${provider.id}`}
              className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 via-card to-card gradient-border hover:from-primary/10 transition-all"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-muted-foreground">
                  {provider.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{provider.name}</h3>
                  {provider.verified && (
                    <Badge variant="secondary" className="text-xs">
                      <Award className="w-3 h-3 mr-1" />
                      {t('common.verified', 'Verified')}
                    </Badge>
                  )}
                  {provider.backgroundChecked && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      {t('common.bgChecked', 'BG Checked')}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {provider.rating} ({provider.reviews})
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {t('common.respondsIn', 'Responds in')} {provider.responseTime}h
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">R${provider.hourlyRate}/h</p>
                <p className="text-xs text-muted-foreground">{t('common.startingAt', 'Starting at')}</p>
              </div>
            </Link>
          ))}
        </div>

        {filteredProviders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {t('common.noProvidersFound', 'No providers found matching your criteria')}
            </p>
            <Button 
              variant="link" 
              onClick={() => {
                setSearchQuery('');
                setPriceRange([0, 200]);
                setMinRating(0);
                setVerifiedOnly(false);
                setBackgroundCheckedOnly(false);
              }}
            >
              {t('common.clearFilters', 'Clear Filters')}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
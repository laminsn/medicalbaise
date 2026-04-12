import { useState, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatPrice } from '@/lib/currency';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  SlidersHorizontal, 
  Star, 
  MapPin, 
  CheckCircle, 
  ShieldCheck, 
  Calendar,
  Loader2,
  Stethoscope,
  CreditCard,
  Languages as LanguagesIcon,
  GraduationCap,
  Video,
  Home as HomeIcon,
  Phone,
  Hospital,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MEDICAL_CATEGORIES, INSURANCE_PROVIDERS, APPOINTMENT_TYPES } from '@/lib/constants/medical';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { getLocalizedCategoryName, isPortuguese, isSpanish } from '@/lib/i18n-utils';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface Doctor {
  id: string;
  business_name: string;
  category_id: string | null;
  avatar_url: string | null;
  avg_rating: number | null;
  total_reviews: number | null;
  total_patients: number | null;
  city: string | null;
  state: string | null;
  consultation_fee: number | null;
  is_verified: boolean | null;
  is_licensed: boolean | null;
  emergency_available: boolean | null;
  subscription_tier: string | null;
  response_time_hours: number | null;
  years_experience: number | null;
  languages_spoken: string[] | null;
  consultation_types: string[] | null;
  insurance_accepted: string[] | null;
  accepted_insurance: string[] | null;
  hospital_affiliations: string[] | null;
  accepts_new_patients: boolean | null;
  teleconsultation_available: boolean | null;
}

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const isPt = isPortuguese(i18n);
  const isEs = isSpanish(i18n);

  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [feeRange, setFeeRange] = useState([
    parseInt(searchParams.get('minFee') || '0'),
    parseInt(searchParams.get('maxFee') || '1000')
  ]);
  const [minRating, setMinRating] = useState(parseFloat(searchParams.get('minRating') || '0'));
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true');
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');
  const [cityQuery, setCityQuery] = useState(searchParams.get('city') || '');
  const [minExperience, setMinExperience] = useState([parseInt(searchParams.get('minExp') || '0')]);
  const [licensedOnly, setLicensedOnly] = useState(searchParams.get('licensed') === 'true');
  const [emergencyOnly, setEmergencyOnly] = useState(searchParams.get('emergency') === 'true');
  const [newPatientsOnly, setNewPatientsOnly] = useState(searchParams.get('newPatients') === 'true');
  const [telehealthOnly, setTelehealthOnly] = useState(searchParams.get('telehealth') === 'true');
  const [selectedInsurance, setSelectedInsurance] = useState<string[]>(
    searchParams.get('insurance')?.split(',').filter(Boolean) || []
  );
  const [selectedConsultationTypes, setSelectedConsultationTypes] = useState<string[]>(
    searchParams.get('consultTypes')?.split(',').filter(Boolean) || []
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    searchParams.get('languages')?.split(',').filter(Boolean) || []
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch doctors from database
  const { data: doctors, isLoading, error } = useQuery({
    queryKey: ['browse-doctors', selectedCategory, selectedState],
    queryFn: async () => {
      let query = supabase
        .from('providers')
        .select(`
          id,
          business_name,
          category_id,
          avatar_url,
          avg_rating,
          total_reviews,
          total_patients,
          city,
          state,
          consultation_fee,
          is_verified,
          is_licensed,
          emergency_available,
          subscription_tier,
          response_time_hours,
          years_experience,
          languages_spoken,
          consultation_types,
          insurance_accepted,
          accepted_insurance,
          hospital_affiliations,
          accepts_new_patients,
          teleconsultation_available
        `)
        .eq('is_active', true)
        .eq('provider_type', 'healthcare');

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (selectedState) {
        query = query.eq('state', selectedState);
      }

      const { data, error } = await query.order('avg_rating', { ascending: false });
      
      if (error) throw error;
      return data as Doctor[];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Memoized filtering
  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];

    return doctors.filter((doctor) => {
      // Search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = doctor.business_name.toLowerCase().includes(searchLower);
        const category = MEDICAL_CATEGORIES.find(c => c.id === doctor.category_id);
        const categoryMatch = category?.name_en.toLowerCase().includes(searchLower) ||
                             category?.name_pt.toLowerCase().includes(searchLower);
        if (!nameMatch && !categoryMatch) return false;
      }

      // Rating
      if (minRating > 0 && (doctor.avg_rating || 0) < minRating) return false;

      // Verified
      if (verifiedOnly && !doctor.is_verified) return false;

      // Licensed
      if (licensedOnly && !doctor.is_licensed) return false;

      // Consultation fee
      const fee = doctor.consultation_fee || 0;
      if (fee < feeRange[0] || fee > feeRange[1]) return false;

      // City
      if (cityQuery && !doctor.city?.toLowerCase().includes(cityQuery.toLowerCase())) return false;

      // Experience
      if (minExperience[0] > 0 && (doctor.years_experience || 0) < minExperience[0]) return false;

      // Emergency
      if (emergencyOnly && !doctor.emergency_available) return false;

      // New patients
      if (newPatientsOnly && !doctor.accepts_new_patients) return false;

      // Telehealth
      if (telehealthOnly && !doctor.teleconsultation_available) return false;

      // Insurance (check both accepted_insurance and insurance_accepted columns)
      if (selectedInsurance.length > 0) {
        const allInsurance = [
          ...(doctor.insurance_accepted ?? []),
          ...((doctor as any).accepted_insurance ?? []),
        ];
        const hasMatch = selectedInsurance.some(ins => allInsurance.includes(ins));
        if (!hasMatch) return false;
      }

      // Consultation types
      if (selectedConsultationTypes.length > 0) {
        const hasMatch = selectedConsultationTypes.some(ct => 
          doctor.consultation_types?.includes(ct)
        );
        if (!hasMatch) return false;
      }

      // Languages
      if (selectedLanguages.length > 0) {
        const hasMatch = selectedLanguages.some(lang => 
          doctor.languages_spoken?.includes(lang)
        );
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [
    doctors,
    searchQuery,
    minRating,
    verifiedOnly,
    licensedOnly,
    feeRange,
    cityQuery,
    minExperience,
    emergencyOnly,
    newPatientsOnly,
    telehealthOnly,
    selectedInsurance,
    selectedConsultationTypes,
    selectedLanguages
  ]);

  // Update URL
  const updateURLParams = useCallback(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (feeRange[0] !== 0) params.set('minFee', feeRange[0].toString());
    if (feeRange[1] !== 1000) params.set('maxFee', feeRange[1].toString());
    if (minRating > 0) params.set('minRating', minRating.toString());
    if (verifiedOnly) params.set('verified', 'true');
    if (licensedOnly) params.set('licensed', 'true');
    if (selectedState) params.set('state', selectedState);
    if (cityQuery) params.set('city', cityQuery);
    if (minExperience[0] > 0) params.set('minExp', minExperience[0].toString());
    if (emergencyOnly) params.set('emergency', 'true');
    if (newPatientsOnly) params.set('newPatients', 'true');
    if (telehealthOnly) params.set('telehealth', 'true');
    if (selectedInsurance.length > 0) params.set('insurance', selectedInsurance.join(','));
    if (selectedConsultationTypes.length > 0) params.set('consultTypes', selectedConsultationTypes.join(','));
    if (selectedLanguages.length > 0) params.set('languages', selectedLanguages.join(','));

    setSearchParams(params, { replace: true });
  }, [
    searchQuery, selectedCategory, feeRange, minRating, verifiedOnly, licensedOnly,
    selectedState, cityQuery, minExperience, emergencyOnly, newPatientsOnly, 
    telehealthOnly, selectedInsurance, selectedConsultationTypes, selectedLanguages,
    setSearchParams
  ]);

  // Apply filters
  const applyFilters = () => {
    updateURLParams();
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setFeeRange([0, 1000]);
    setMinRating(0);
    setVerifiedOnly(false);
    setLicensedOnly(false);
    setSelectedState('');
    setCityQuery('');
    setMinExperience([0]);
    setEmergencyOnly(false);
    setNewPatientsOnly(false);
    setTelehealthOnly(false);
    setSelectedInsurance([]);
    setSelectedConsultationTypes([]);
    setSelectedLanguages([]);
    setSearchParams({}, { replace: true });
  };

  const toggleInsurance = (value: string) => {
    setSelectedInsurance(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleConsultationType = (value: string) => {
    setSelectedConsultationTypes(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleLanguage = (value: string) => {
    setSelectedLanguages(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">{t('browse.loadingDoctors')}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <div className="px-4 py-8">
          <div className="bg-destructive/10 text-destructive p-6 rounded-lg text-center max-w-md mx-auto">
            <p className="font-semibold mb-2">{t('browse.errorLoading')}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
              {t('common.reload')}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Helmet>
        <title>{t('browse.title', 'Browse Medical Professionals')} - Medical Baise</title>
        <meta name="description" content={t('browse.metaDescription', 'Find verified doctors, specialists, and healthcare providers near you. Compare ratings, reviews, and fees.')} />
      </Helmet>
      <div className="px-4 py-4">
        {/* Search and filters */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder={t('browse.searchDoctors')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateURLParams();
                }
              }}
              className="pl-10 h-11 rounded-xl"
              aria-label={t('browse.searchDoctors')}
            />
          </div>

          {/* Quick insurance filter */}
          <Select
            value={selectedInsurance.length === 1 ? selectedInsurance[0] : 'all'}
            onValueChange={(v) => {
              if (v === 'all') {
                setSelectedInsurance([]);
              } else {
                setSelectedInsurance([v]);
              }
              updateURLParams();
            }}
          >
            <SelectTrigger className="h-11 w-auto min-w-[130px] rounded-xl text-xs gap-1" aria-label={t('browse.insuranceAccepted')}>
              <CreditCard className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
              <SelectValue placeholder={isPt ? 'Convênio' : 'Insurance'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isPt ? 'Todos os planos' : 'All plans'}</SelectItem>
              {[
                ...INSURANCE_PROVIDERS,
                isPt ? 'Particular (sem plano)' : 'Particular (out-of-pocket)',
                'SUS',
              ].map((plan) => (
                <SelectItem key={plan} value={plan}>{plan}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-11 w-11 rounded-xl"
                aria-label={t('browse.filters')}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>{t('browse.filters')}</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(85vh-120px)] mt-4 pr-4">
                <div className="space-y-6">
                  
                  {/* Medical Specialty */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" />
                      {t('browse.specialty')}
                    </Label>
                    <Select 
                      value={selectedCategory || "all"} 
                      onValueChange={(v) => setSelectedCategory(v === "all" ? "" : v)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={t('browse.selectSpecialty')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        {MEDICAL_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {getLocalizedCategoryName(cat, i18n, t)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                  </Select>
                  </div>

                  {/* Location - CEP Only */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {t('browse.location')}
                    </Label>
                    <Input
                      placeholder={t('browse.cepPlaceholder')}
                      value={cityQuery}
                      onChange={(e) => {
                        // Only allow numbers and format as CEP
                        const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                        const formattedCEP = value.length > 5 
                          ? `${value.slice(0, 5)}-${value.slice(5)}` 
                          : value;
                        setCityQuery(formattedCEP);
                      }}
                      className="mt-2"
                      maxLength={9}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('browse.cepHint')}
                    </p>
                    <Select 
                      value={selectedState || "all"} 
                      onValueChange={(v) => setSelectedState(v === "all" ? "" : v)}
                    >
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
                  </div>

                  {/* Consultation Fee Range */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      {t('browse.consultationFee')}
                    </Label>
                    <div className="mt-3">
                      <Slider
                        value={feeRange}
                        onValueChange={setFeeRange}
                        max={1000}
                        step={50}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>{formatPrice(feeRange[0])}</span>
                        <span>{formatPrice(feeRange[1])}+</span>
                      </div>
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

                  {/* Years of Experience */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      {t('browse.experience')}
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {t('browse.experienceDescription')}
                    </p>
                    <Slider
                      value={minExperience}
                      onValueChange={setMinExperience}
                      max={40}
                      step={5}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>{t('browse.anyExperience')}</span>
                      <span>
                        {minExperience[0] === 0 
                          ? t('browse.anyExperience') 
                          : `${minExperience[0]}+ ${t('browse.years')}`
                        }
                      </span>
                    </div>
                  </div>

                  {/* Insurance Accepted */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      {t('browse.insuranceAccepted')}
                    </Label>
                    <div className="space-y-2 mt-3 max-h-48 overflow-y-auto">
                      {INSURANCE_PROVIDERS.map((insurance) => (
                        <div key={insurance} className="flex items-center space-x-2">
                          <Checkbox
                            id={`insurance-${insurance}`}
                            checked={selectedInsurance.includes(insurance)}
                            onCheckedChange={() => toggleInsurance(insurance)}
                          />
                          <label
                            htmlFor={`insurance-${insurance}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {insurance}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Consultation Type */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      {t('browse.consultationType')}
                    </Label>
                    <div className="space-y-3 mt-3">
                      {APPOINTMENT_TYPES.map((type) => (
                        <div key={type.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`consult-${type.id}`}
                            checked={selectedConsultationTypes.includes(type.id)}
                            onCheckedChange={() => toggleConsultationType(type.id)}
                            className="mt-0.5"
                          />
                          <div className="flex items-center gap-2">
                            {type.id === 'in-person' && <Hospital className="w-4 h-4 text-muted-foreground" />}
                            {type.id === 'teleconsultation' && <Video className="w-4 h-4 text-muted-foreground" />}
                            {type.id === 'phone' && <Phone className="w-4 h-4 text-muted-foreground" />}
                            {type.id === 'home-visit' && <HomeIcon className="w-4 h-4 text-muted-foreground" />}
                            <label
                              htmlFor={`consult-${type.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {isPt
                                ? type.label_pt
                                : isEs
                                  ? (
                                    type.id === 'in-person'
                                      ? 'Presencial'
                                      : type.id === 'teleconsultation'
                                        ? 'Consulta por video'
                                        : type.id === 'phone'
                                          ? 'Consulta telefónica'
                                          : 'Visita a domicilio'
                                  )
                                  : type.label_en}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Languages Spoken */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <LanguagesIcon className="w-4 h-4" />
                      {t('browse.languagesSpoken')}
                    </Label>
                    <div className="space-y-2 mt-3">
                      {[
                        { value: 'Portuguese', label: isPt ? 'Português' : isEs ? 'Portugués' : 'Portuguese' },
                        { value: 'English', label: isPt ? 'Inglês' : isEs ? 'Inglés' : 'English' },
                        { value: 'Spanish', label: isPt ? 'Espanhol' : isEs ? 'Español' : 'Spanish' },
                        { value: 'Italian', label: isPt ? 'Italiano' : isEs ? 'Italiano' : 'Italian' },
                        { value: 'German', label: isPt ? 'Alemão' : isEs ? 'Alemán' : 'German' },
                        { value: 'French', label: isPt ? 'Francês' : isEs ? 'Francés' : 'French' },
                        { value: 'Mandarin', label: isPt ? 'Mandarim' : isEs ? 'Mandarín' : 'Mandarin' },
                      ].map((lang) => (
                        <div key={lang.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`lang-${lang.value}`}
                            checked={selectedLanguages.includes(lang.value)}
                            onCheckedChange={() => toggleLanguage(lang.value)}
                          />
                          <label
                            htmlFor={`lang-${lang.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {lang.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Medical License Verified */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <div>
                        <Label className="text-sm font-medium">
                          {t('browse.licenseVerified')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('browse.licenseVerifiedDescription')}
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={licensedOnly} 
                      onCheckedChange={setLicensedOnly} 
                    />
                  </div>

                  {/* Identity Verified */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <div>
                        <Label className="text-sm font-medium">
                          {t('browse.verifiedOnly')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('browse.verifiedDescription')}
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={verifiedOnly} 
                      onCheckedChange={setVerifiedOnly} 
                    />
                  </div>

                  {/* Accepting New Patients */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div>
                        <Label className="text-sm font-medium">
                          {t('browse.acceptingNewPatients')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('browse.acceptingNewPatientsDescription')}
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={newPatientsOnly} 
                      onCheckedChange={setNewPatientsOnly} 
                    />
                  </div>

                  {/* Telehealth Available */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-primary" />
                      <div>
                        <Label className="text-sm font-medium">
                          {t('browse.telehealthAvailable')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('browse.telehealthDescription')}
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={telehealthOnly} 
                      onCheckedChange={setTelehealthOnly} 
                    />
                  </div>

                  {/* Emergency Care */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hospital className="w-4 h-4 text-destructive" />
                      <div>
                        <Label className="text-sm font-medium">
                          {t('browse.emergencyCare')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('browse.emergencyCareDescription')}
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={emergencyOnly} 
                      onCheckedChange={setEmergencyOnly} 
                    />
                  </div>

                </div>
              </ScrollArea>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={clearFilters}
                >
                  {t('browse.clearFilters')}
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={applyFilters}
                >
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
            onClick={() => {
              setSelectedCategory('');
              updateURLParams();
            }}
          >
            {t('common.all')}
          </Button>
          {MEDICAL_CATEGORIES.slice(0, 8).map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              className="flex-shrink-0 rounded-full"
              onClick={() => {
                setSelectedCategory(cat.id);
                updateURLParams();
              }}
            >
              {getLocalizedCategoryName(cat, i18n, t)}
            </Button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredDoctors.length} {t('browse.doctorsFound')}
        </p>

        {/* Empty state */}
        {filteredDoctors.length === 0 && (
          <div className="text-center py-16">
            <Stethoscope className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="font-semibold text-lg mb-2 text-foreground">
              {t('browse.noResults')}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {t('browse.noResultsDescription')}
            </p>
            <Button onClick={clearFilters} variant="outline">
              {t('browse.clearFilters')}
            </Button>
          </div>
        )}

        {/* Doctor Cards */}
        <div className="space-y-3 pb-4">
          {filteredDoctors.map((doctor) => {
            const category = MEDICAL_CATEGORIES.find(c => c.id === doctor.category_id);
            const categoryName = category 
              ? getLocalizedCategoryName(category, i18n, t)
              : doctor.category_id || '';

            return (
              <Link
                key={doctor.id}
                to={`/doctor/${doctor.id}`}
                className="block bg-card rounded-xl border border-border hover:border-primary/50 p-4 transition-all hover:shadow-lg"
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={doctor.avatar_url || '/placeholder.svg'}
                      alt={doctor.business_name}
                      className="w-16 h-16 rounded-xl object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    {doctor.is_verified && (
                      <CheckCircle 
                        className="absolute -bottom-1 -right-1 w-5 h-5 text-primary bg-card rounded-full" 
                        aria-label={t('browse.verified')}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1 gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground truncate">
                          Dr. {doctor.business_name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {categoryName}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end flex-shrink-0">
                        {doctor.emergency_available && (
                          <Badge variant="destructive" className="text-xs whitespace-nowrap">
                            <Hospital className="w-3 h-3 mr-1" />
                            {t('browse.emergency')}
                          </Badge>
                        )}
                        {doctor.is_licensed && (
                          <Badge variant="secondary" className="text-xs whitespace-nowrap">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            {t('browse.licensed')}
                          </Badge>
                        )}
                        {doctor.teleconsultation_available && (
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            <Video className="w-3 h-3 mr-1" />
                            {t('browse.telehealth')}
                          </Badge>
                        )}
                        {doctor.subscription_tier === 'elite' && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0 text-xs whitespace-nowrap">
                            ⭐ Elite
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-sm mb-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                        <span className="font-medium">
                          {doctor.avg_rating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-muted-foreground">
                          ({doctor.total_reviews || 0})
                        </span>
                      </div>
                      <span className="text-muted-foreground" aria-hidden="true">•</span>
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                        <span className="text-muted-foreground">
                          {doctor.years_experience || 0} {t('browse.yearsExp')}
                        </span>
                      </div>
                      {(doctor.total_patients || 0) > 0 && (
                        <>
                          <span className="text-muted-foreground" aria-hidden="true">•</span>
                          <span className="text-muted-foreground">
                            {doctor.total_patients} {t('browse.patients')}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                        <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                        <span className="truncate">{doctor.city || ''}{doctor.city && doctor.state ? ', ' : ''}{doctor.state || ''}</span>
                        {doctor.response_time_hours && (
                          <>
                            <span className="mx-1 flex-shrink-0" aria-hidden="true">•</span>
                            <span className="flex-shrink-0">&lt; {doctor.response_time_hours}h</span>
                          </>
                        )}
                      </div>
                      <span className="font-semibold text-primary whitespace-nowrap">
                        {formatPrice(doctor.consultation_fee || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

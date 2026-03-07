import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import ProviderMap from '@/components/map/ProviderMap';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Filter, Search, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { isPortuguese, isSpanish } from '@/lib/i18n-utils';

interface ServiceCategory {
  id: string;
  name_en: string | null;
  name_pt: string | null;
}

const MapView = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [locationSearch, setLocationSearch] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const { data: mapboxToken } = useMapboxToken();

  const { data: categories } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return (data as ServiceCategory[] | null) ?? [];
    },
  });

  const handleProviderClick = (providerId: string) => {
    navigate(`/provider/${providerId}`);
  };

  const getCategoryName = (category: ServiceCategory) => {
    if (isPortuguese(i18n)) return category.name_pt;
    if (isSpanish(i18n)) {
      return t(`medicalCategories.${category.id}.name`, category.name_en || category.name_pt || category.id);
    }
    return category.name_en;
  };

  const handleLocationSearch = async () => {
    if (!locationSearch.trim()) return;
    if (!mapboxToken) {
      toast.error(t('map.locationError'));
      return;
    }
    
    try {
      // Use Mapbox Geocoding API
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationSearch)}.json?access_token=${mapboxToken}&country=BR&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setMapCenter([lng, lat]);
        toast.success(t('map.locationFound'));
      } else {
        toast.error(t('map.locationNotFound'));
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error(t('map.locationError'));
    }
  };

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    
    if (!navigator.geolocation) {
      toast.error(t('map.geolocationNotSupported'));
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter([position.coords.longitude, position.coords.latitude]);
        toast.success(t('map.currentLocationFound'));
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error(t('map.geolocationError'));
        setIsLocating(false);
      }
    );
  };

  return (
    <AppLayout>
      <Helmet>
        <title>{t('map.pageTitle')} | Brasil Base</title>
        <meta name="description" content={t('map.pageDescription')} />
      </Helmet>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('map.title')}</h1>
              <p className="text-muted-foreground text-sm">{t('map.subtitle')}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Location Search */}
            <Card className="w-full sm:w-auto">
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                    placeholder={t('map.enterLocation')}
                    className="w-[180px]"
                  />
                  <Button size="icon" variant="ghost" onClick={handleLocationSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                  >
                    <Navigation className={`h-4 w-4 ${isLocating ? 'animate-pulse' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Category Filter */}
            <Card className="w-full sm:w-auto">
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select 
                    value={selectedCategory} 
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t('map.filterCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('map.allCategories')}</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {getCategoryName(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <ProviderMap
              onProviderClick={handleProviderClick}
              selectedCategory={selectedCategory === 'all' ? undefined : selectedCategory}
              center={mapCenter}
              className="h-[calc(100vh-280px)] min-h-[500px]"
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default MapView;

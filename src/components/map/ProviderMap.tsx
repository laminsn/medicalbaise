import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { escapeHtml } from '@/lib/sanitize';

interface ProviderMapProps {
  onProviderClick?: (providerId: string) => void;
  selectedCategory?: string;
  center?: [number, number] | null;
  className?: string;
}

const ProviderMap: React.FC<ProviderMapProps> = ({ 
  onProviderClick, 
  selectedCategory,
  center,
  className = ''
}) => {
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Fetch Mapbox token from edge function
  const { data: tokenData, isLoading: tokenLoading } = useQuery({
    queryKey: ['mapbox-token'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (error) throw error;
      return data;
    },
    staleTime: Infinity,
  });

  const { data: providers, isLoading } = useQuery({
    queryKey: ['providers-with-location', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('providers')
        .select(`
          id,
          business_name,
          tagline,
          avg_rating,
          total_reviews,
          location_lat,
          location_lng,
          service_radius_km,
          is_verified,
          subscription_tier,
          provider_services (
            category_id,
            service_categories (
              id,
              name_en,
              name_pt
            )
          )
        `)
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null);

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter by category if selected
      if (selectedCategory && data) {
        return data.filter(provider => 
          provider.provider_services?.some(
            (service: any) => service.category_id === selectedCategory
          )
        );
      }
      
      return data;
    },
  });

  useEffect(() => {
    if (!mapContainer.current || map.current || !tokenData?.token) return;

    mapboxgl.accessToken = tokenData.token;

    if (!mapboxgl.accessToken) {
      setMapError('Mapbox token not configured');
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-46.6333, -23.5505], // São Paulo default
      zoom: 10,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, [tokenData?.token]);

  // Handle center changes from external location search
  useEffect(() => {
    if (map.current && center) {
      map.current.flyTo({
        center: center,
        zoom: 13,
        essential: true
      });
    }
  }, [center]);

  // Add markers when providers data changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !providers) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    providers.forEach((provider) => {
      if (!provider.location_lat || !provider.location_lng) return;

      const el = document.createElement('div');
      el.className = 'provider-marker';
      el.innerHTML = `
        <div class="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
          provider.subscription_tier === 'pro' || provider.subscription_tier === 'elite' || provider.subscription_tier === 'enterprise'
            ? 'bg-primary border-2 border-primary-foreground shadow-lg shadow-primary/50'
            : 'bg-secondary border-2 border-border'
        }">
          <span class="text-xs font-bold text-primary-foreground">
            ${provider.avg_rating ? provider.avg_rating.toFixed(1) : '—'}
          </span>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div class="p-3 min-w-[200px] bg-card text-card-foreground rounded-lg">
            <h3 class="font-semibold text-sm mb-1">${escapeHtml(provider.business_name || '')}</h3>
            ${provider.tagline ? `<p class="text-xs text-muted-foreground mb-2">${escapeHtml(provider.tagline)}</p>` : ''}
            <div class="flex items-center gap-2 text-xs">
              <span class="text-yellow-500">★ ${provider.avg_rating?.toFixed(1) || '—'}</span>
              <span class="text-muted-foreground">(${provider.total_reviews || 0} reviews)</span>
            </div>
            ${provider.is_verified ? '<span class="inline-block mt-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Verified</span>' : ''}
          </div>
        `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([provider.location_lng, provider.location_lat])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        if (onProviderClick) {
          onProviderClick(provider.id);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (providers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      providers.forEach(provider => {
        if (provider.location_lat && provider.location_lng) {
          bounds.extend([provider.location_lng, provider.location_lat]);
        }
      });
      
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 14
        });
      }
    }
  }, [providers, mapLoaded, onProviderClick]);

  if (isLoading || tokenLoading) {
    return (
      <div className={`flex items-center justify-center bg-card rounded-lg ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (mapError || !tokenData?.token) {
    return (
      <div className={`flex items-center justify-center bg-card rounded-lg p-6 ${className}`}>
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {mapError || 'Map configuration error. Please try again later.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-full min-h-[400px]" />
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground">
        {providers?.length || 0} {t('map.providersFound')}
      </div>
    </div>
  );
};

export default ProviderMap;

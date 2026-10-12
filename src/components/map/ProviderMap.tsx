import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { escapeHtml } from '@/lib/sanitize';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { fromProvidersPublic } from '@/lib/publicDirectory';

interface ProviderMapProps {
  onProviderClick?: (providerId: string) => void;
  selectedCategory?: string;
  center?: [number, number] | null;
  className?: string;
}

interface ProviderWithServices {
  id: string;
  business_name: string | null;
  tagline: string | null;
  avg_rating: number | null;
  total_reviews: number | null;
  location_lat: number | null;
  location_lng: number | null;
  is_verified: boolean | null;
  subscription_tier: string | null;
  provider_services: { category_id: string }[] | null;
}

const SOURCE_ID = 'provider-approximate-areas';
const LAYER_ID = 'provider-approximate-areas';
/** Neighborhood-sized disc. providers_public rounds coordinates to 2 decimals (~1.1 km); the client rounds again. */
const APPROXIMATE_RADIUS_METERS = 1000;
const HIGHLIGHTED_TIERS = new Set(['pro', 'elite', 'enterprise']);
// Mapbox GL uses 512px tiles. Equatorial meters/pixel at zoom 20.
const METERS_PER_PIXEL_AT_ZOOM_20_EQUATOR = 40075016.68557849 / (512 * 2 ** 20);

function roundToApproximateCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

function radiusPixelsAtZoom20(latitude: number): number {
  const metersPerPixel =
    METERS_PER_PIXEL_AT_ZOOM_20_EQUATOR *
    Math.max(Math.cos((latitude * Math.PI) / 180), 0.01);
  return APPROXIMATE_RADIUS_METERS / metersPerPixel;
}

function extendBoundsByApproximateArea(bounds: mapboxgl.LngLatBounds, lng: number, lat: number) {
  const latPad = APPROXIMATE_RADIUS_METERS / 111320;
  const lngPad = latPad / Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
  bounds.extend([lng - lngPad, lat - latPad]);
  bounds.extend([lng + lngPad, lat + latPad]);
}

function areaPopupHtml(
  properties: GeoJSON.GeoJsonProperties,
  reviewsLabel: string,
  verifiedLabel: string,
): string {
  const name = escapeHtml(String(properties?.business_name ?? ''));
  const tagline = properties?.tagline ? escapeHtml(String(properties.tagline)) : '';
  const ratingNumber = Number(properties?.avg_rating);
  const rating = Number.isFinite(ratingNumber) && ratingNumber >= 0 ? ratingNumber.toFixed(1) : '—';
  const reviews = Number(properties?.total_reviews) || 0;
  const verified = properties?.is_verified === true || properties?.is_verified === 'true';

  return `
    <div class="p-3 min-w-[200px] bg-card text-card-foreground rounded-lg">
      <h3 class="font-semibold text-sm mb-1">${name}</h3>
      ${tagline ? `<p class="text-xs text-muted-foreground mb-2">${tagline}</p>` : ''}
      <div class="flex items-center gap-2 text-xs">
        <span class="text-yellow-500">★ ${rating}</span>
        <span class="text-muted-foreground">(${reviews} ${escapeHtml(reviewsLabel)})</span>
      </div>
      ${verified ? `<span class="inline-block mt-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">${escapeHtml(verifiedLabel)}</span>` : ''}
    </div>
  `;
}

const ProviderMap: React.FC<ProviderMapProps> = ({ 
  onProviderClick, 
  selectedCategory,
  center,
  className = ''
}) => {
  const { t, i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');
  const reviewsLabel = isPt ? 'avaliações' : isEs ? 'reseñas' : 'reviews';
  const verifiedLabel = t('providers.verified', isPt ? 'Verificado' : isEs ? 'Verificado' : 'Verified');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const { data: mapboxToken, isLoading: tokenLoading } = useMapboxToken();

  const { data: providers, isLoading } = useQuery({
    queryKey: ['providers-with-location', selectedCategory],
    queryFn: async () => {
      const { data, error } = await fromProvidersPublic()
        .select(`
          id,
          business_name,
          tagline,
          avg_rating,
          total_reviews,
          location_lat,
          location_lng,
          is_verified,
          subscription_tier,
          provider_services (
            category_id
          )
        `)
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null);

      if (error) throw error;
      const providerData = (data as ProviderWithServices[] | null) ?? [];
      
      // Filter by category if selected
      if (selectedCategory) {
        return providerData.filter(provider => 
          provider.provider_services?.some(
            (service) => service.category_id === selectedCategory
          )
        );
      }
      
      return providerData;
    },
  });

  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    if (!mapboxgl.accessToken) {
      setMapError(isPt ? 'Token do mapa não configurado' : isEs ? 'Token de mapa no configurado' : 'Mapbox token not configured');
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
      popupRef.current?.remove();
      popupRef.current = null;
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, isPt, isEs]);

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

  // Draw an approximate 1 km area for each provider instead of an exact pin.
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !mapLoaded || !providers) return;

    const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
    providers.forEach((provider) => {
      if (provider.location_lat == null || provider.location_lng == null || !provider.id) return;
      const lat = roundToApproximateCoordinate(provider.location_lat);
      const lng = roundToApproximateCoordinate(provider.location_lng);
      const highlighted = HIGHLIGHTED_TIERS.has(provider.subscription_tier ?? '') ? 1 : 0;
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          id: provider.id,
          business_name: provider.business_name ?? '',
          tagline: provider.tagline ?? '',
          avg_rating: provider.avg_rating ?? -1,
          total_reviews: provider.total_reviews ?? 0,
          is_verified: Boolean(provider.is_verified),
          highlighted,
          radiusPx: radiusPixelsAtZoom20(lat),
        },
      });
    });

    const collection: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features,
    };

    const existingSource = mapInstance.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (existingSource) {
      existingSource.setData(collection);
    } else {
      mapInstance.addSource(SOURCE_ID, { type: 'geojson', data: collection });
      mapInstance.addLayer({
        id: LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        layout: {
          'circle-sort-key': ['get', 'highlighted'],
        },
        paint: {
          'circle-radius': [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            0,
            0,
            20,
            ['get', 'radiusPx'],
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'highlighted'], 1],
            '#00b8d4',
            '#737373',
          ],
          'circle-opacity': 0.35,
          'circle-blur': 0.15,
          'circle-pitch-alignment': 'map',
          'circle-pitch-scale': 'map',
          'circle-stroke-width': 2,
          'circle-stroke-color': [
            'case',
            ['==', ['get', 'highlighted'], 1],
            '#00b8d4',
            '#d4d4d4',
          ],
          'circle-stroke-opacity': 0.9,
        },
      });
    }

    const onClick = (event: mapboxgl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature || feature.geometry.type !== 'Point') return;
      const [lng, lat] = feature.geometry.coordinates;
      popupRef.current?.remove();
      popupRef.current = new mapboxgl.Popup({ offset: 8, closeButton: false })
        .setLngLat([lng, lat])
        .setHTML(areaPopupHtml(feature.properties, reviewsLabel, verifiedLabel))
        .addTo(mapInstance);
      const id = feature.properties?.id;
      if (typeof id === 'string' && onProviderClick) {
        onProviderClick(id);
      }
    };
    const onEnter = () => {
      mapInstance.getCanvas().style.cursor = 'pointer';
    };
    const onLeave = () => {
      mapInstance.getCanvas().style.cursor = '';
    };

    mapInstance.on('click', LAYER_ID, onClick);
    mapInstance.on('mouseenter', LAYER_ID, onEnter);
    mapInstance.on('mouseleave', LAYER_ID, onLeave);

    if (features.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      features.forEach((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        extendBoundsByApproximateArea(bounds, lng, lat);
      });

      if (!bounds.isEmpty()) {
        mapInstance.fitBounds(bounds, {
          padding: 50,
          maxZoom: 14
        });
      }
    }

    return () => {
      mapInstance.off('click', LAYER_ID, onClick);
      mapInstance.off('mouseenter', LAYER_ID, onEnter);
      mapInstance.off('mouseleave', LAYER_ID, onLeave);
      mapInstance.getCanvas().style.cursor = '';
    };
  }, [providers, mapLoaded, onProviderClick, reviewsLabel, verifiedLabel]);

  if (isLoading || tokenLoading) {
    return (
      <div className={`flex items-center justify-center bg-card rounded-lg ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (mapError || !mapboxToken) {
    return (
      <div className={`flex items-center justify-center bg-card rounded-lg p-6 ${className}`}>
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {mapError || (isPt ? 'Erro na configuração do mapa. Tente novamente mais tarde.' : isEs ? 'Error de configuración del mapa. Inténtalo de nuevo más tarde.' : 'Map configuration error. Please try again later.')}
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

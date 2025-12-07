import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle, MapPin, Navigation, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface JobLocationMapProps {
  activeJobId: string;
  className?: string;
}

const JobLocationMap: React.FC<JobLocationMapProps> = ({ 
  activeJobId,
  className = ''
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Fetch Mapbox token
  const { data: tokenData, isLoading: tokenLoading } = useQuery({
    queryKey: ['mapbox-token'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (error) throw error;
      return data;
    },
    staleTime: Infinity,
  });

  // Fetch active job with location
  const { data: activeJob, isLoading: jobLoading } = useQuery({
    queryKey: ['active-job-location', activeJobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_jobs')
        .select(`
          id,
          job_status,
          customer_id,
          provider_id,
          job:jobs_posted (
            id,
            title,
            location_address,
            location_lat,
            location_lng
          )
        `)
        .eq('id', activeJobId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!activeJobId && !!user,
  });

  // Check if user is participant
  const isParticipant = activeJob && user && 
    (activeJob.customer_id === user.id || activeJob.provider_id === user.id);

  // Check if job is confirmed (not pending)
  const isConfirmed = activeJob && 
    !['pending_start', 'cancelled'].includes(activeJob.job_status);

  const canViewLocation = isParticipant && isConfirmed;

  useEffect(() => {
    if (!mapContainer.current || map.current || !tokenData?.token || !canViewLocation) return;
    if (!activeJob?.job?.location_lat || !activeJob?.job?.location_lng) return;

    mapboxgl.accessToken = tokenData.token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [activeJob.job.location_lng, activeJob.job.location_lat],
      zoom: 15,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      setMapLoaded(true);

      // Add marker for job location
      if (activeJob?.job?.location_lat && activeJob?.job?.location_lng) {
        const el = document.createElement('div');
        el.innerHTML = `
          <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `;

        new mapboxgl.Marker(el)
          .setLngLat([activeJob.job.location_lng, activeJob.job.location_lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-3">
                  <h3 class="font-semibold">${activeJob.job.title}</h3>
                  <p class="text-sm text-muted-foreground">${activeJob.job.location_address || ''}</p>
                </div>
              `)
          )
          .addTo(map.current!);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [tokenData?.token, activeJob, canViewLocation]);

  if (jobLoading || tokenLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!canViewLocation) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5" />
            {t('jobLocation.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-8 text-center">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">{t('jobLocation.locked')}</h4>
            <p className="text-sm text-muted-foreground">
              {!isParticipant 
                ? t('jobLocation.notParticipant')
                : t('jobLocation.awaitingConfirmation')
              }
            </p>
            {!isConfirmed && (
              <Badge variant="secondary" className="mt-4">
                {t('jobLocation.pendingConfirmation')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activeJob?.job?.location_lat || !activeJob?.job?.location_lng) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5" />
            {t('jobLocation.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('jobLocation.noLocation')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const openInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${activeJob.job.location_lat},${activeJob.job.location_lng}`;
    window.open(url, '_blank');
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5" />
            {t('jobLocation.title')}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={openInMaps}>
            <Navigation className="h-4 w-4 mr-2" />
            {t('jobLocation.getDirections')}
          </Button>
        </div>
        {activeJob.job.location_address && (
          <p className="text-sm text-muted-foreground">{activeJob.job.location_address}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative rounded-lg overflow-hidden">
          <div ref={mapContainer} className="w-full h-[300px]" />
        </div>
      </CardContent>
    </Card>
  );
};

export default JobLocationMap;

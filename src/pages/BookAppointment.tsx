import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Star, MapPin, Clock, BadgeCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/currency';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';

interface ProviderProfile {
  id: string;
  business_name: string;
  provider_type: string | null;
  consultation_fee: number | null;
  consultation_duration_minutes: number | null;
  teleconsultation_available: boolean | null;
  tagline: string | null;
  avatar_url: string | null;
  avg_rating: number | null;
  total_reviews: number | null;
  is_verified: boolean | null;
  city: string | null;
  state: string | null;
}

export default function BookAppointment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: provider, isLoading, error } = useQuery({
    queryKey: ['book-appointment-provider', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error: fetchError } = await supabase
        .from('providers')
        .select(
          'id, business_name, provider_type, consultation_fee, consultation_duration_minutes, teleconsultation_available, tagline, avatar_url, avg_rating, total_reviews, is_verified, city, state',
        )
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      return data as ProviderProfile | null;
    },
    enabled: !!id,
  });

  if (!id) {
    return (
      <Alert>
        <AlertDescription>{t('common.invalidRequest', 'Invalid request.')}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (error || !provider) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>
              {t('appointments.providerNotFound', 'Provider not found.')}
            </AlertDescription>
          </Alert>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/browse')}>
            {t('common.backToBrowse')}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const location = [provider.city, provider.state].filter(Boolean).join(', ');

  return (
    <>
      <Helmet>
        <title>
          {t('appointments.bookWith', 'Book with')} {provider.business_name} - Brasil Base
        </title>
      </Helmet>
      <AppLayout>
        <div className="container mx-auto px-4 py-6 pb-24 max-w-2xl space-y-6">
          {/* Back button */}
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
            ← {t('common.back')}
          </Button>

          {/* Doctor info card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                {provider.avatar_url ? (
                  <img
                    src={provider.avatar_url}
                    alt={provider.business_name}
                    className="w-16 h-16 rounded-full object-cover shrink-0 border border-border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-border">
                    <span className="text-2xl font-bold text-primary">
                      {provider.business_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold truncate">{provider.business_name}</h2>
                    {provider.is_verified && (
                      <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                  {provider.tagline && (
                    <p className="text-sm text-muted-foreground mt-0.5">{provider.tagline}</p>
                  )}
                  {provider.provider_type && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {provider.provider_type}
                    </Badge>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {provider.avg_rating ? (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {provider.avg_rating.toFixed(1)}
                        {provider.total_reviews ? ` (${provider.total_reviews})` : ''}
                      </span>
                    ) : null}
                    {location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {location}
                      </span>
                    )}
                    {provider.consultation_duration_minutes ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {provider.consultation_duration_minutes} min
                      </span>
                    ) : null}
                    {provider.consultation_fee ? (
                      <span className="font-semibold text-primary">
                        {formatPrice(provider.consultation_fee)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Calendar booking widget */}
          <Card>
            <CardContent className="pt-5">
              <AppointmentCalendar
                doctorId={provider.id}
                doctorName={provider.business_name}
                consultationFee={provider.consultation_fee}
                consultationDuration={provider.consultation_duration_minutes}
                teleconsultationAvailable={provider.teleconsultation_available ?? false}
              />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}

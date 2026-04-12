import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Loader2, MessageSquare, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useStartConversation } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';

interface ProviderLite {
  id: string;
  business_name: string;
  provider_type: string | null;
  consultation_fee: number | null;
  teleconsultation_available: boolean | null;
  tagline: string | null;
}

export default function BookAppointment() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { startConversation } = useStartConversation();

  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const appointmentType = useMemo(
    () => (searchParams.get('type') === 'teleconsultation' ? 'teleconsultation' : 'in-person'),
    [searchParams],
  );

  const { data: provider, isLoading, error } = useQuery({
    queryKey: ['appointment-provider', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('providers')
        .select('id, business_name, provider_type, consultation_fee, teleconsultation_available, tagline')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as ProviderLite | null;
    },
    enabled: !!id,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!id || !user) {
      toast.error(t('auth.loginRequired'));
      navigate('/auth');
      return;
    }

    if (!preferredDate || !preferredTime) {
      toast.error(t('appointments.fillRequiredFields', 'Please choose date and time.'));
      return;
    }

    setSubmitting(true);

    try {
      const conversationId = await startConversation(id);
      if (!conversationId) {
        throw new Error('Failed to create conversation');
      }

      const typeLabel =
        appointmentType === 'teleconsultation'
          ? t('doctorProfile.teleconsultation')
          : t('doctorProfile.bookAppointment');

      const messageLines = [
        `${t('appointments.requestMessageTitle', 'Appointment request')}: ${typeLabel}`,
        `${t('appointments.preferredDate', 'Preferred date')}: ${preferredDate}`,
        `${t('appointments.preferredTime', 'Preferred time')}: ${preferredTime}`,
      ];

      if (notes.trim()) {
        messageLines.push(`${t('appointments.notes', 'Notes')}: ${notes.trim()}`);
      }

      const { error: messageError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: messageLines.join('\n'),
      });

      if (messageError) throw messageError;

      toast.success(t('appointments.requestSent', 'Appointment request sent.'));
      navigate(`/chat/${conversationId}`);
    } catch (submitError) {

      toast.error(t('appointments.requestFailed', 'Could not send appointment request.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) {
    return <Alert><AlertDescription>{t('common.invalidRequest', 'Invalid request.')}</AlertDescription></Alert>;
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

  const isTeleconsultation = appointmentType === 'teleconsultation';
  const teleconsultationUnavailable = isTeleconsultation && !provider.teleconsultation_available;

  return (
    <>
      <Helmet>
        <title>{t('appointments.requestAppointment', 'Request appointment')} - Brasil Base</title>
      </Helmet>
      <AppLayout>
        <div className="container mx-auto px-4 py-6 pb-24 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isTeleconsultation ? <Video className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                {t('appointments.requestAppointment', 'Request appointment')}
              </CardTitle>
              <CardDescription>
                {provider.business_name}
                {provider.tagline ? ` • ${provider.tagline}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teleconsultationUnavailable && (
                <Alert className="mb-4" variant="destructive">
                  <AlertDescription>
                    {t('doctorProfile.telehealthNotAvailable')}
                  </AlertDescription>
                </Alert>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="appointment-date">{t('appointments.preferredDate', 'Preferred date')}</Label>
                  <Input
                    id="appointment-date"
                    type="date"
                    value={preferredDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(event) => setPreferredDate(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointment-time">{t('appointments.preferredTime', 'Preferred time')}</Label>
                  <Input
                    id="appointment-time"
                    type="time"
                    value={preferredTime}
                    onChange={(event) => setPreferredTime(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointment-notes">
                    {t('appointments.notes', 'Notes')}
                  </Label>
                  <Textarea
                    id="appointment-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder={t(
                      'appointments.notesPlaceholder',
                      'Describe symptoms, goals, or anything useful for this appointment.',
                    )}
                    rows={4}
                  />
                </div>

                {provider.consultation_fee ? (
                  <p className="text-sm text-muted-foreground">
                    {t('appointments.consultationFee', 'Consultation fee')}: {formatPrice(provider.consultation_fee)}
                  </p>
                ) : null}

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)} className="sm:w-auto">
                    {t('common.back')}
                  </Button>
                  <Button type="submit" disabled={submitting || teleconsultationUnavailable} className="sm:ml-auto">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {t('appointments.sendRequest', 'Send request')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}

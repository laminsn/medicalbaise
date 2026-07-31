import { useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarCheck2, Clock3, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Generated Supabase types are regenerated only after the migration is applied.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const appointmentDb = supabase as any;

type PatientPreferences = {
  communications_enabled: boolean;
  in_app_enabled: boolean;
  email_enabled: boolean;
  reminders_enabled: boolean;
  follow_up_enabled: boolean;
  thank_you_enabled: boolean;
  review_requests_enabled: boolean;
  timezone: string;
};

type ProviderPreferences = {
  enabled: boolean;
  reminder_offsets_minutes: number[];
  confirmation_enabled: boolean;
  follow_up_enabled: boolean;
  follow_up_delay_minutes: number;
  thank_you_enabled: boolean;
  thank_you_delay_minutes: number;
  review_request_enabled: boolean;
  review_request_delay_minutes: number;
  timezone: string;
};

const getLocalTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'America/Sao_Paulo';
  }
};

const defaultPatientPreferences = (): PatientPreferences => ({
  communications_enabled: false,
  in_app_enabled: true,
  email_enabled: true,
  reminders_enabled: true,
  follow_up_enabled: true,
  thank_you_enabled: true,
  review_requests_enabled: false,
  timezone: getLocalTimezone(),
});

const defaultProviderPreferences = (): ProviderPreferences => ({
  enabled: true,
  reminder_offsets_minutes: [1440, 60],
  confirmation_enabled: true,
  follow_up_enabled: true,
  follow_up_delay_minutes: 1440,
  thank_you_enabled: true,
  thank_you_delay_minutes: 120,
  review_request_enabled: true,
  review_request_delay_minutes: 2880,
  timezone: getLocalTimezone(),
});

const ToggleRow = ({
  id,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <div className="flex items-start justify-between gap-4">
    <Label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
      <span className="block text-sm font-medium">{label}</span>
      <span className="mt-0.5 block text-xs font-normal leading-relaxed text-muted-foreground">
        {description}
      </span>
    </Label>
    <Switch
      id={id}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
    />
  </div>
);

export function AppointmentLifecycleSettings({
  userId,
  providerId,
}: {
  userId: string;
  providerId: string | null;
}) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [patient, setPatient] = useState<PatientPreferences>(defaultPatientPreferences);
  const [provider, setProvider] = useState<ProviderPreferences>(defaultProviderPreferences);
  const [offsetHours, setOffsetHours] = useState<string[]>(['24', '1']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const locale = useMemo(() => {
    const language = i18n.resolvedLanguage || i18n.language || 'pt';
    if (language.startsWith('en')) return 'en';
    if (language.startsWith('es')) return 'es';
    return 'pt';
  }, [i18n.language, i18n.resolvedLanguage]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const patientRequest = appointmentDb
        .from('medical_appointment_patient_preferences')
        .select('communications_enabled, in_app_enabled, email_enabled, reminders_enabled, follow_up_enabled, thank_you_enabled, review_requests_enabled, timezone')
        .eq('user_id', userId)
        .maybeSingle();
      const providerRequest = providerId
        ? appointmentDb
            .from('medical_appointment_provider_preferences')
            .select('enabled, reminder_offsets_minutes, confirmation_enabled, follow_up_enabled, follow_up_delay_minutes, thank_you_enabled, thank_you_delay_minutes, review_request_enabled, review_request_delay_minutes, timezone')
            .eq('provider_id', providerId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null });

      const [patientResult, providerResult] = await Promise.all([
        patientRequest,
        providerRequest,
      ]);
      if (!active) return;

      if (patientResult.data) {
        setPatient(patientResult.data as unknown as PatientPreferences);
      }
      if (providerResult.data) {
        const loaded = providerResult.data as unknown as ProviderPreferences;
        setProvider(loaded);
        setOffsetHours(
          loaded.reminder_offsets_minutes.map((minutes) => String(minutes / 60)),
        );
      }
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [providerId, userId]);

  const updateOffset = (index: number, value: string) => {
    setOffsetHours((current) =>
      current.map((offset, offsetIndex) => (offsetIndex === index ? value : offset)),
    );
  };

  const save = async () => {
    const offsets = Array.from(
      new Set(
        offsetHours
          .map((hours) => Number(hours))
          .filter((hours) => Number.isFinite(hours))
          .map((hours) => Math.round(hours * 60))
          .filter((minutes) => minutes >= 15 && minutes <= 10080),
      ),
    ).sort((left, right) => right - left);

    if (providerId && offsets.length !== offsetHours.length) {
      toast({
        title: t('common.error', 'Check reminder times'),
        description: t(
          'appointments.lifecycle.offsetError',
          'Use unique reminder times between 15 minutes and 7 days.',
        ),
        variant: 'destructive',
      });
      return;
    }

    if (patient.communications_enabled && !patient.in_app_enabled && !patient.email_enabled) {
      toast({
        title: t('common.error', 'Choose a delivery method'),
        description: t(
          'appointments.lifecycle.channelError',
          'Turn on secure in-app messages, email, or opt out of appointment communications.',
        ),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    const { error: patientError } = await appointmentDb
      .from('medical_appointment_patient_preferences')
      .upsert({
        user_id: userId,
        ...patient,
        locale,
        consent_version: patient.communications_enabled ? 'medical-appointments-v1' : null,
      }, { onConflict: 'user_id' });

    let providerError: { message?: string } | null = null;
    if (!patientError && providerId) {
      const result = await appointmentDb
        .from('medical_appointment_provider_preferences')
        .upsert({
          provider_id: providerId,
          ...provider,
          reminder_offsets_minutes: offsets,
        }, { onConflict: 'provider_id' });
      providerError = result.error;
    }
    setSaving(false);

    if (patientError || providerError) {
      toast({
        title: t('common.error', 'Could not save settings'),
        description: t(
          'appointments.lifecycle.saveError',
          'No appointment communication settings were activated. Please try again.',
        ),
        variant: 'destructive',
      });
      return;
    }

    setProvider((current) => ({ ...current, reminder_offsets_minutes: offsets }));
    toast({
      title: t('common.success', 'Settings saved'),
      description: patient.communications_enabled
        ? t(
            'appointments.lifecycle.consentSaved',
            'Appointment communications are active. Medical details remain inside the secure portal.',
          )
        : t(
            'appointments.lifecycle.optOutSaved',
            'Appointment communications are off and queued messages were cancelled.',
          ),
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          {t('common.loading', 'Loading appointment settings…')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="h-4 w-4 text-primary" />
            {t('appointments.lifecycle.patientTitle', 'Appointment communications')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <ToggleRow
            id="appointment-consent"
            label={t('appointments.lifecycle.consent', 'Receive appointment communications')}
            description={t(
              'appointments.lifecycle.consentDescription',
              'I agree to receive minimum-necessary confirmations, reminders, follow-ups, and thank-you messages. I can opt out at any time.',
            )}
            checked={patient.communications_enabled}
            onCheckedChange={(checked) =>
              setPatient((current) => ({ ...current, communications_enabled: checked }))
            }
          />
          <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mr-1 inline h-4 w-4 text-primary" />
            {t(
              'appointments.lifecycle.privacy',
              'Messages never include symptoms, diagnoses, treatment, insurance information, or appointment notes. Details stay in the secure portal.',
            )}
          </div>
          <ToggleRow
            id="appointment-in-app"
            label={t('appointments.lifecycle.inApp', 'Secure in-app messages')}
            description={t('appointments.lifecycle.inAppDescription', 'Receive generic appointment updates after signing in.')}
            checked={patient.in_app_enabled}
            disabled={!patient.communications_enabled}
            onCheckedChange={(checked) => setPatient((current) => ({ ...current, in_app_enabled: checked }))}
          />
          <ToggleRow
            id="appointment-email"
            label={t('appointments.lifecycle.email', 'Email')}
            description={t('appointments.lifecycle.emailDescription', 'Receive generic branded email with a secure portal link.')}
            checked={patient.email_enabled}
            disabled={!patient.communications_enabled}
            onCheckedChange={(checked) => setPatient((current) => ({ ...current, email_enabled: checked }))}
          />
          <ToggleRow
            id="appointment-reminders"
            label={t('appointments.lifecycle.reminders', 'Appointment reminders')}
            description={t('appointments.lifecycle.remindersDescription', 'Providers default to 24 hours and 1 hour before the appointment.')}
            checked={patient.reminders_enabled}
            disabled={!patient.communications_enabled}
            onCheckedChange={(checked) => setPatient((current) => ({ ...current, reminders_enabled: checked }))}
          />
          <ToggleRow
            id="appointment-follow-up"
            label={t('appointments.lifecycle.followUp', 'Follow-up reminders and thank-you messages')}
            description={t('appointments.lifecycle.followUpDescription', 'Receive generic after-appointment messages without medical details.')}
            checked={patient.follow_up_enabled && patient.thank_you_enabled}
            disabled={!patient.communications_enabled}
            onCheckedChange={(checked) =>
              setPatient((current) => ({ ...current, follow_up_enabled: checked, thank_you_enabled: checked }))
            }
          />
          <ToggleRow
            id="appointment-review"
            label={t('appointments.lifecycle.reviews', 'Optional review requests')}
            description={t(
              'appointments.lifecycle.reviewsDescription',
              'Review requests are neutral, never incentivized, and optional. Do not share medical details publicly.',
            )}
            checked={patient.review_requests_enabled}
            disabled={!patient.communications_enabled}
            onCheckedChange={(checked) => setPatient((current) => ({ ...current, review_requests_enabled: checked }))}
          />
        </CardContent>
      </Card>

      {providerId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck2 className="h-4 w-4 text-primary" />
              {t('appointments.lifecycle.providerTitle', 'Provider appointment automation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ToggleRow
              id="provider-appointment-automation"
              label={t('appointments.lifecycle.providerEnabled', 'Enable appointment lifecycle messages')}
              description={t('appointments.lifecycle.providerEnabledDescription', 'Only patients who explicitly opt in can receive these messages.')}
              checked={provider.enabled}
              onCheckedChange={(checked) => setProvider((current) => ({ ...current, enabled: checked }))}
            />
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Clock3 className="h-4 w-4" />
                {t('appointments.lifecycle.reminderTimes', 'Reminder times before appointment')}
              </Label>
              {offsetHours.map((hours, index) => (
                <div key={`${index}-${offsetHours.length}`} className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0.25"
                    max="168"
                    step="0.25"
                    value={hours}
                    disabled={!provider.enabled}
                    onChange={(event) => updateOffset(index, event.target.value)}
                    aria-label={t('appointments.lifecycle.hoursBefore', 'Hours before appointment')}
                  />
                  <span className="w-16 text-xs text-muted-foreground">
                    {t('appointments.lifecycle.hours', 'hours')}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!provider.enabled || offsetHours.length <= 1}
                    onClick={() => setOffsetHours((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    aria-label={t('common.delete', 'Remove reminder')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!provider.enabled || offsetHours.length >= 6}
                onClick={() => setOffsetHours((current) => [...current, '2'])}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('appointments.lifecycle.addReminder', 'Add reminder')}
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t(
                  'appointments.lifecycle.timezoneNote',
                  `Times use ${provider.timezone}. Stored appointment instants keep daylight-saving changes consistent.`,
                )}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider-appointment-timezone">
                {t('appointments.lifecycle.timezone', 'IANA time zone')}
              </Label>
              <Input
                id="provider-appointment-timezone"
                value={provider.timezone}
                disabled={!provider.enabled}
                onChange={(event) => setProvider((current) => ({ ...current, timezone: event.target.value.trim() }))}
                placeholder="America/Sao_Paulo"
                autoComplete="off"
              />
            </div>
            <ToggleRow
              id="provider-confirmation"
              label={t('appointments.lifecycle.twoWay', 'Two-way confirmation')}
              description={t('appointments.lifecycle.twoWayDescription', 'Patients can confirm, decline, or request a new time through a signed response page.')}
              checked={provider.confirmation_enabled}
              disabled={!provider.enabled}
              onCheckedChange={(checked) => setProvider((current) => ({ ...current, confirmation_enabled: checked }))}
            />
            <ToggleRow
              id="provider-follow-up"
              label={t('appointments.lifecycle.providerFollowUp', 'Follow-up and thank-you messages')}
              description={t('appointments.lifecycle.providerFollowUpDescription', 'Defaults: thank-you after 2 hours and follow-up after 24 hours.')}
              checked={provider.follow_up_enabled && provider.thank_you_enabled}
              disabled={!provider.enabled}
              onCheckedChange={(checked) =>
                setProvider((current) => ({ ...current, follow_up_enabled: checked, thank_you_enabled: checked }))
              }
            />
            <ToggleRow
              id="provider-review"
              label={t('appointments.lifecycle.providerReviews', 'Neutral review request')}
              description={t('appointments.lifecycle.providerReviewsDescription', 'Sent after 48 hours only when the patient separately opts in. No rewards or credits.')}
              checked={provider.review_request_enabled}
              disabled={!provider.enabled}
              onCheckedChange={(checked) => setProvider((current) => ({ ...current, review_request_enabled: checked }))}
            />
          </CardContent>
        </Card>
      )}

      <Button className="w-full" onClick={() => void save()} disabled={saving}>
        {saving
          ? t('common.saving', 'Saving…')
          : t('appointments.lifecycle.save', 'Save appointment communication settings')}
      </Button>
    </div>
  );
}

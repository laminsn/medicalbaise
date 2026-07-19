import { Check, Circle, ExternalLink } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { onboardingConfig, type OnboardingStepKey } from './onboardingConfig';
import type { OnboardingProgress } from './useOnboarding';

interface ActivationChecklistProps {
  progress: OnboardingProgress;
  percent: number;
  profileComplete: boolean;
  hasService: boolean;
  hasAvailability: boolean;
  hasPublishedListing: boolean;
  onNavigate: (destination: string) => void;
  onTour: () => void;
  onMarkStep: (key: OnboardingStepKey) => Promise<void> | void;
}

export function ActivationChecklist({ progress, percent, profileComplete, hasService, hasAvailability,
  hasPublishedListing, onNavigate, onTour, onMarkStep }: ActivationChecklistProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (profileComplete && !progress.steps.provider_profile?.done) void Promise.resolve(onMarkStep('provider_profile')).catch(() => undefined);
  }, [onMarkStep, profileComplete, progress.steps.provider_profile?.done]);
  useEffect(() => {
    if (hasService && !progress.steps.first_service?.done) void Promise.resolve(onMarkStep('first_service')).catch(() => undefined);
  }, [hasService, onMarkStep, progress.steps.first_service?.done]);
  useEffect(() => {
    if (hasPublishedListing && !progress.steps.publish_listing?.done) void Promise.resolve(onMarkStep('publish_listing')).catch(() => undefined);
  }, [hasPublishedListing, onMarkStep, progress.steps.publish_listing?.done]);

  if (percent >= 100) return null;

  return (
    <aside className="rounded-xl border bg-card p-4 shadow-sm" aria-labelledby="onboarding-checklist-title">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id="onboarding-checklist-title" className="font-bold text-card-foreground">{t('onboarding.checklist.title')}</h2>
          <p className="text-xs font-medium text-muted-foreground">{t('onboarding.checklist.progress', { percent })}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onTour} className="text-xs font-semibold text-primary underline underline-offset-2">{t('onboarding.tour.start')}</button>
          <span className="text-xl font-bold text-primary">{percent}%</span>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="h-full bg-primary transition-[width] motion-reduce:transition-none" style={{ width: `${percent}%` }} />
      </div>
      {hasAvailability && !progress.steps.availability_payout?.done && (
        <p className="mt-3 text-xs text-muted-foreground">{t('onboarding.checklist.availabilityDetected')}</p>
      )}
      <ul className="mt-4 grid gap-2 lg:grid-cols-2">
        {onboardingConfig.checklistSteps.map((step) => {
          const done = Boolean(progress.steps[step.key]?.done);
          return (
            <li key={step.key} className="flex items-start gap-3 rounded-lg border border-border p-3">
              {done ? <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/50" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-card-foreground">{t(step.labelKey)}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{t(step.descriptionKey)}</p>
                {!done && (
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button type="button" onClick={() => onNavigate(step.destination)} className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                      {t('onboarding.open')} <ExternalLink className="h-3 w-3" />
                    </button>
                    {step.autoDetect === 'none' && (
                      <button type="button" onClick={() => void Promise.resolve(onMarkStep(step.key)).catch(() => undefined)} className="text-xs font-semibold text-muted-foreground underline underline-offset-2">
                        {t('onboarding.markDone')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

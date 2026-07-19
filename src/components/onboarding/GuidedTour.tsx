import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { onboardingConfig, type ProviderTourSection } from './onboardingConfig';

interface GuidedTourProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => Promise<void> | void;
  onNavigate: (section: ProviderTourSection) => void;
}

export function GuidedTour({ open, onClose, onComplete, onNavigate }: GuidedTourProps) {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const step = onboardingConfig.tourSteps[stepIndex];

  const measureTarget = useCallback(() => {
    const element = step ? document.querySelector(step.selector) : null;
    setTargetRect(element?.getBoundingClientRect() ?? null);
  }, [step]);

  useLayoutEffect(() => {
    if (!open || !step) return;
    onNavigate(step.section);
    let innerFrame: number | undefined;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(measureTarget);
    });
    return () => {
      cancelAnimationFrame(outerFrame);
      if (innerFrame !== undefined) cancelAnimationFrame(innerFrame);
    };
  }, [measureTarget, onNavigate, open, step]);

  useEffect(() => {
    if (!open) return;
    const update = () => measureTarget();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    panelRef.current?.focus();
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [measureTarget, open]);

  const finish = useCallback(async () => {
    try {
      await onComplete();
      setStepIndex(0);
      onClose();
    } catch {
      // Keep the tour open so the persisted write can be retried.
    }
  }, [onClose, onComplete]);
  const next = useCallback(() => {
    if (stepIndex < onboardingConfig.tourSteps.length - 1) setStepIndex((value) => value + 1);
    else void finish();
  }, [finish, stepIndex]);
  const previous = useCallback(() => setStepIndex((value) => Math.max(0, value - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') previous();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [next, onClose, open, previous]);

  if (!open || !step) return null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rect = targetRect;
  const panelStyle = !rect || window.innerWidth < 640
    ? { bottom: '16px', left: '50%', transform: 'translateX(-50%)' }
    : rect.left < window.innerWidth / 3
      ? { top: `${Math.max(16, Math.min(rect.top, window.innerHeight - 330))}px`, left: `${Math.min(rect.right + 16, window.innerWidth - 380)}px` }
      : { top: `${Math.min(rect.bottom + 16, window.innerHeight - 330)}px`, left: `${Math.max(16, Math.min(rect.left, window.innerWidth - 380))}px` };

  return (
    <>
      <svg className="pointer-events-none fixed inset-0 z-40" width="100%" height="100%" aria-hidden="true">
        <defs>
          <mask id="baise-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && <rect x={rect.left - 6} y={rect.top - 6} width={rect.width + 12} height={rect.height + 12} rx="8" fill="black" />}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(2,6,23,.64)" mask="url(#baise-tour-mask)" />
        {rect && <rect x={rect.left - 6} y={rect.top - 6} width={rect.width + 12} height={rect.height + 12} rx="8" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />}
      </svg>
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t('onboarding.tour.label')}
        className={`fixed z-50 w-[360px] max-w-[calc(100vw-32px)] rounded-xl border border-primary bg-background shadow-2xl ${reducedMotion ? '' : 'transition-[top,left,bottom] duration-200'}`}
        style={panelStyle}>
        <div className="border-b border-border p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            {t('onboarding.tour.progress', { current: stepIndex + 1, total: onboardingConfig.tourSteps.length })}
          </p>
          <h2 className="mt-1 text-xl font-bold text-foreground">{t(step.titleKey)}</h2>
        </div>
        <p className="p-4 text-sm leading-6 text-muted-foreground">{t(step.bodyKey)}</p>
        <div className="flex items-center justify-between gap-2 border-t border-border p-3">
          <button type="button" onClick={onClose} className="px-2 py-2 text-xs font-semibold text-muted-foreground">{t('onboarding.tour.dismiss')}</button>
          <div className="flex gap-2">
            <button type="button" onClick={previous} disabled={stepIndex === 0} className="rounded-md border border-border px-3 py-2 text-xs font-semibold disabled:opacity-40">{t('onboarding.back')}</button>
            <button type="button" onClick={next} className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
              {stepIndex === onboardingConfig.tourSteps.length - 1 ? t('onboarding.finish') : t('onboarding.next')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

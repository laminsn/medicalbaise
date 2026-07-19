import { ArrowRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface WelcomeFirstRunProps {
  open: boolean;
  onStart: () => void;
  onDismiss: () => Promise<void> | void;
}

export function WelcomeFirstRun({ open, onStart, onDismiss }: WelcomeFirstRunProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') void Promise.resolve(onDismiss()).catch(() => undefined);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onDismiss, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="onboarding-welcome-title"
        className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{t('onboarding.welcome.eyebrow')}</p>
            <h2 id="onboarding-welcome-title" className="mt-2 text-3xl font-bold text-foreground">{t('onboarding.welcome.outcome')}</h2>
          </div>
          <button type="button" onClick={() => void Promise.resolve(onDismiss()).catch(() => undefined)} aria-label={t('onboarding.close')}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{t('onboarding.welcome.body')}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onStart} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground">
            {t('onboarding.welcome.cta')} <ArrowRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => void Promise.resolve(onDismiss()).catch(() => undefined)} className="min-h-11 rounded-lg px-5 text-sm font-semibold text-muted-foreground hover:bg-muted">
            {t('onboarding.skipNow')}
          </button>
        </div>
      </div>
    </div>
  );
}

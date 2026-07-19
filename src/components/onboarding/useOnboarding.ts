import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { onboardingConfig, type OnboardingStepKey } from './onboardingConfig';

export interface OnboardingProgress {
  user_id: string;
  lane: string;
  steps: Partial<Record<OnboardingStepKey, { done: boolean; done_at: string | null }>>;
  tour_completed_at: string | null;
  welcome_dismissed_at: string | null;
  percent: number;
  updated_at: string;
}

const db = supabase as any;

function initialProgress(userId: string): OnboardingProgress {
  return {
    user_id: userId,
    lane: onboardingConfig.lane,
    steps: {},
    tour_completed_at: null,
    welcome_dismissed_at: null,
    percent: 0,
    updated_at: new Date().toISOString(),
  };
}

function calculatePercent(steps: OnboardingProgress['steps']) {
  const completed = onboardingConfig.checklistSteps.filter((step) => steps[step.key]?.done).length;
  return Math.round((completed / onboardingConfig.checklistSteps.length) * 100);
}

export function useOnboarding(userId: string | null) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const progressRef = useRef<OnboardingProgress | null>(null);
  const latestRequestIdRef = useRef(0);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const currentUserIdRef = useRef(userId);
  currentUserIdRef.current = userId;
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const commitProgress = useCallback((next: OnboardingProgress) => {
    progressRef.current = next;
    setProgress(next);
  }, []);

  useEffect(() => {
    if (!userId) {
      progressRef.current = null;
      setProgress(null);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    progressRef.current = null;
    setProgress(null);
    setLoading(true);
    setError(null);
    db.from('onboarding_progress').select('*').eq('user_id', userId).maybeSingle()
      .then(({ data, error: readError }: { data: unknown; error: { message: string } | null }) => {
        if (!active) return;
        if (readError) {
          setError(readError.message);
        } else {
          const authoritative = data ? (data as OnboardingProgress) : initialProgress(userId);
          commitProgress(authoritative);
        }
        setLoading(false);
      })
      .catch((readError: Error) => {
        if (!active) return;
        setError(readError.message);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [commitProgress, userId]);

  const update = useCallback((change: (current: OnboardingProgress) => OnboardingProgress) => {
    const requestId = ++latestRequestIdRef.current;
    setError(null);
    const queued = writeQueueRef.current.then(async () => {
      const current = progressRef.current;
      if (!current || current.user_id !== userId || currentUserIdRef.current !== userId) return;
      const changed = change(current);
      const next = { ...changed, percent: calculatePercent(changed.steps), updated_at: new Date().toISOString() };
      const { data, error: writeError } = await db
        .from('onboarding_progress').upsert(next, { onConflict: 'user_id' }).select().single();
      if (writeError) {
        if (requestId === latestRequestIdRef.current) setError(writeError.message);
        throw writeError;
      }
      if (currentUserIdRef.current !== userId) return;
      const saved = (data || next) as OnboardingProgress;
      if (requestId === latestRequestIdRef.current) commitProgress(saved);
      else progressRef.current = saved;
    });
    writeQueueRef.current = queued.then(() => undefined, () => undefined);
    return queued;
  }, [commitProgress, userId]);

  const markStep = useCallback((key: OnboardingStepKey) => update((current) => ({
    ...current,
    steps: { ...current.steps, [key]: { done: true, done_at: new Date().toISOString() } },
  })), [update]);
  const dismissWelcome = useCallback(() => update((current) => ({
    ...current,
    welcome_dismissed_at: new Date().toISOString(),
  })), [update]);
  const completeTour = useCallback(() => update((current) => ({
    ...current,
    tour_completed_at: new Date().toISOString(),
  })), [update]);
  const resetOnboarding = useCallback(() => update((current) => ({
    ...current,
    steps: {},
    tour_completed_at: null,
    welcome_dismissed_at: null,
    percent: 0,
  })), [update]);

  return useMemo(() => ({
    progress,
    percent: progress?.percent ?? 0,
    loading,
    error,
    markStep,
    dismissWelcome,
    completeTour,
    resetOnboarding,
  }), [completeTour, dismissWelcome, error, loading, markStep, progress, resetOnboarding]);
}

import { LucideIcon, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface DashboardMetric {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  tone?: 'blue' | 'green' | 'amber' | 'purple';
}

export interface DashboardAction {
  label: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

export interface DashboardFocus {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'blue' | 'green' | 'amber' | 'purple';
}

interface DashboardCommandCenterProps {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
  focus?: DashboardFocus;
  metrics: DashboardMetric[];
  actions: DashboardAction[];
}

const toneClass = {
  blue: 'text-sky-600 bg-sky-500/10 ring-sky-500/20',
  green: 'text-emerald-600 bg-emerald-500/10 ring-emerald-500/20',
  amber: 'text-amber-600 bg-amber-500/10 ring-amber-500/20',
  purple: 'text-violet-600 bg-violet-500/10 ring-violet-500/20',
};

export function DashboardCommandCenter({
  eyebrow,
  title,
  description,
  badge,
  focus,
  metrics,
  actions,
}: DashboardCommandCenterProps) {
  const primaryAction = actions[0];
  const secondaryActions = actions.slice(1);
  const PrimaryIcon = primaryAction?.icon;
  const FocusIcon = focus?.icon;
  const focusTone = toneClass[focus?.tone || 'blue'];

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="border-b bg-gradient-to-b from-muted/40 via-card to-card px-4 py-5 sm:px-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="min-w-0 lg:pt-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {eyebrow}
              </span>
              {badge && <Badge variant="secondary" className="rounded-md">{badge}</Badge>}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
            {primaryAction && (
              <Button onClick={primaryAction.onClick} className="mt-4 h-10 gap-2 rounded-md px-4 active:scale-[0.98]">
                {PrimaryIcon && <PrimaryIcon className="h-4 w-4" />}
                {primaryAction.label}
              </Button>
            )}
          </div>

          {focus && (
            <div className="rounded-md border bg-background/80 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                {FocusIcon && (
                  <span className={`rounded-md p-2 ring-1 ${focusTone}`}>
                    <FocusIcon className="h-4 w-4" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {focus.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{focus.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{focus.description}</p>
                  {focus.actionLabel && focus.onAction && (
                    <button
                      type="button"
                      onClick={focus.onAction}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-[color,transform] duration-150 ease-out hover:text-primary/80 active:scale-[0.98]"
                    >
                      {focus.actionLabel}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const tone = toneClass[metric.tone || 'blue'];

          return (
            <div key={metric.label} className="min-h-[132px] bg-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                    {metric.value}
                  </p>
                </div>
                <div className={`rounded-md p-2 ring-1 ${tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              {metric.detail && (
                <p className="mt-3 text-xs leading-5 text-muted-foreground">{metric.detail}</p>
              )}
            </div>
          );
        })}
      </div>

      {secondaryActions.length > 0 && (
        <div className="border-t">
          <div className="flex items-center justify-between gap-3 bg-muted/25 px-4 py-2 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Action queue
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Fast paths for the work people open the dashboard to do.
            </p>
          </div>
          <div className="grid gap-px bg-border md:grid-cols-2">
            {secondaryActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className="group flex min-h-[92px] items-start gap-3 bg-card p-4 text-left transition-[background-color,transform] duration-150 ease-out hover:bg-muted/40 active:scale-[0.99]"
                >
                  <span className="rounded-md bg-muted p-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{action.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {action.description}
                    </span>
                  </span>
                  <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

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

interface DashboardCommandCenterProps {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
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
  metrics,
  actions,
}: DashboardCommandCenterProps) {
  const primaryAction = actions[0];
  const secondaryActions = actions.slice(1);
  const PrimaryIcon = primaryAction?.icon;

  return (
    <section className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
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
          </div>
          {primaryAction && (
            <Button onClick={primaryAction.onClick} className="h-10 shrink-0 gap-2 rounded-md">
              {PrimaryIcon && <PrimaryIcon className="h-4 w-4" />}
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const tone = toneClass[metric.tone || 'blue'];

          return (
            <div key={metric.label} className="bg-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
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
        <div className="grid gap-px border-t bg-border md:grid-cols-3">
          {secondaryActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="group flex items-start gap-3 bg-card p-4 text-left transition-[background-color,transform] duration-150 ease-out hover:bg-muted/40 active:scale-[0.99]"
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
      )}
    </section>
  );
}

import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FileText, Printer, ShieldCheck } from 'lucide-react';

type PrintableMetric = {
  label: string;
  value: string | number;
  detail: string;
};

type PrintableSection = {
  title: string;
  items: string[];
};

type PrintableDashboardProps = {
  brandName: string;
  audience: 'provider' | 'client';
  title: string;
  subtitle: string;
  accountLabel: string;
  generatedFor?: string | null;
  metrics: PrintableMetric[];
  sections: PrintableSection[];
  nextSteps: string[];
  recordsChecklist: string[];
};

const audienceLabels = {
  provider: {
    badge: t('app.serviceProviderReport', "Service provider report"),
    footer: t('app.providerDashboardPrintoutForOperations', "Provider dashboard printout for operations, revenue review, client follow-up, and record keeping."),
  },
  client: {
    badge: t('app.serviceUserReport', "Service user report"),
    footer: t('app.clientDashboardPrintoutForService', "Client dashboard printout for service tracking, approvals, records, receipts, and follow-up."),
  },
};

export function PrintableDashboard({
  brandName,
  audience,
  title,
  subtitle,
  accountLabel,
  generatedFor,
  metrics,
  sections,
  nextSteps,
  recordsChecklist,
}: PrintableDashboardProps) {
  const { t } = useTranslation();
  const generatedAt = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>
        {`
          @media print {
            @page {
              margin: 0.45in;
              size: letter;
            }

            body * {
              visibility: hidden !important;
            }

            .baise-print-root,
            .baise-print-root * {
              visibility: visible !important;
            }

            .baise-print-root {
              position: absolute !important;
              inset: 0 auto auto 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #111111 !important;
            }

            .baise-print-controls {
              display: none !important;
            }

            .baise-print-card {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
              border-color: #d4d4d4 !important;
              box-shadow: none !important;
              background: #ffffff !important;
              color: #111111 !important;
            }

            .baise-print-muted {
              color: #525252 !important;
            }

            .baise-print-section {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          }
        `}
      </style>

      <Card className="baise-print-root baise-print-card overflow-hidden border-primary/20">
        <CardHeader className="space-y-4 border-b bg-gradient-to-br from-card to-muted/30 baise-print-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {audienceLabels[audience].badge}
                </Badge>
                <Badge variant="outline">{accountLabel}</Badge>
              </div>
              <div>
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription className="baise-print-muted mt-2 max-w-3xl text-sm leading-6">
                  {subtitle}
                </CardDescription>
              </div>
            </div>

            <div className="baise-print-controls flex shrink-0 gap-2">
              <Button type="button" onClick={handlePrint} className="gap-2 active:scale-[0.98]">
                <Printer className="h-4 w-4" />{t('app.printSavePdf', "Print / Save PDF")}</Button>
            </div>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg border bg-background/70 p-3 baise-print-card">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground baise-print-muted">Brand</p>
              <p className="mt-1 font-semibold">{brandName}</p>
            </div>
            <div className="rounded-lg border bg-background/70 p-3 baise-print-card">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground baise-print-muted">{t('app.generatedFor', "Generated for")}</p>
              <p className="mt-1 font-semibold">{generatedFor || 'Current account'}</p>
            </div>
            <div className="rounded-lg border bg-background/70 p-3 baise-print-card">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground baise-print-muted">Generated</p>
              <p className="mt-1 font-semibold">{generatedAt}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-5">
          <section className="baise-print-section">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground baise-print-muted">{t('app.dashboardSnapshot', "Dashboard snapshot")}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-xl border bg-card p-4 baise-print-card">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground baise-print-muted">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold">{metric.value}</p>
                  <p className="baise-print-muted mt-2 text-xs leading-5 text-muted-foreground">{metric.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            {sections.map((section) => (
              <div key={section.title} className="baise-print-section rounded-xl border bg-card p-4 baise-print-card">
                <h3 className="text-base font-semibold">{section.title}</h3>
                <ul className="mt-3 space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-6">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="baise-print-section rounded-xl border bg-card p-4 baise-print-card">
              <h3 className="text-base font-semibold">{t('app.recommendedNextSteps', "Recommended next steps")}</h3>
              <ol className="mt-3 space-y-2">
                {nextSteps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-6">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="baise-print-section rounded-xl border bg-card p-4 baise-print-card">
              <h3 className="text-base font-semibold">{t('app.recordsChecklist', "Records checklist")}</h3>
              <ul className="mt-3 space-y-2">
                {recordsChecklist.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div className="baise-print-muted border-t pt-4 text-xs leading-5 text-muted-foreground">
            {audienceLabels[audience].footer} This report is generated from the dashboard view and should be refreshed before sharing financial, tax, legal, medical, or operational records.
          </div>
        </CardContent>
      </Card>
    </>
  );
}

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Radio, ReceiptText } from 'lucide-react';

const TRUST_COPY = {
  en: {
    eyebrow: 'Service-provider social discovery',
    title: 'Post stories, go live, and authentically present your services to people who came to discover and meet providers.',
    subtitle: 'MD Baise brings provider-led social content together with appointment requests, client relationships, and invoices—without treating public posts as medical advice.',
    spotlight: 'Tools for an authentic provider presence',
    guidance: 'Show your approach, workspace, availability, and service updates. Keep private health details out of public posts.',
    social: 'Stories and live video',
    operations: 'Appointments and CRM',
    billing: 'Invoices and records',
  },
  es: {
    eyebrow: 'Descubrimiento social de proveedores',
    title: 'Publica historias, transmite en vivo y presenta tus servicios de forma auténtica a quienes llegaron para descubrir y conocer proveedores.',
    subtitle: 'MD Baise reúne contenido social creado por proveedores con solicitudes de citas, relaciones con clientes y facturas, sin tratar las publicaciones públicas como asesoramiento médico.',
    spotlight: 'Herramientas para una presencia auténtica',
    guidance: 'Muestra tu enfoque, espacio de trabajo, disponibilidad y novedades. No publiques datos privados de salud.',
    social: 'Historias y video en vivo',
    operations: 'Citas y CRM',
    billing: 'Facturas y registros',
  },
  pt: {
    eyebrow: 'Descoberta social de prestadores',
    title: 'Publique stories, faça lives e apresente seus serviços de forma autêntica a quem chegou para descobrir e conhecer prestadores.',
    subtitle: 'O MD Baise reúne conteúdo social criado por prestadores com solicitações de consulta, relacionamento com clientes e faturas, sem tratar publicações públicas como orientação médica.',
    spotlight: 'Ferramentas para uma presença autêntica',
    guidance: 'Mostre sua abordagem, espaço de trabalho, disponibilidade e novidades. Não publique dados privados de saúde.',
    social: 'Stories e vídeo ao vivo',
    operations: 'Consultas e CRM',
    billing: 'Faturas e registros',
  },
} as const;

const getCopyKey = (language?: string) => {
  if (language?.startsWith('es')) return 'es';
  if (language?.startsWith('pt')) return 'pt';
  return 'en';
};

export function HomeTrustStrip() {
  const { i18n } = useTranslation();
  const copy = useMemo(
    () => TRUST_COPY[getCopyKey(i18n.resolvedLanguage || i18n.language)],
    [i18n.language, i18n.resolvedLanguage],
  );

  const signals = [
    { label: copy.social, icon: Radio },
    { label: copy.operations, icon: CalendarDays },
    { label: copy.billing, icon: ReceiptText },
  ];

  return (
    <section className="relative z-10 -mt-8 px-4 pb-8">
      <div className="mx-auto max-w-6xl rounded-xl border bg-background/95 p-5 shadow-xl backdrop-blur md:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">{copy.eyebrow}</p>
            <h2 className="text-xl font-bold text-foreground md:text-2xl">{copy.title}</h2>
            <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{copy.subtitle}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <div className="rounded-lg bg-muted/60 px-4 py-3">
              <p className="mt-1 text-sm font-semibold">{copy.spotlight}</p>
              <p className="text-xs text-muted-foreground">{copy.guidance}</p>
            </div>

            <div className="grid gap-2 sm:min-w-[340px] sm:grid-cols-3 lg:min-w-[380px]">
              {signals.map((signal) => {
                const Icon = signal.icon;
                return (
                  <div key={signal.label} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm font-medium">
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{signal.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

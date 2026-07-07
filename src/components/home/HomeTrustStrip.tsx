import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, ReceiptText, ShieldCheck, Star } from 'lucide-react';

const TRUST_COPY = {
  en: {
    eyebrow: 'Trust that sells',
    title: 'Trusted by service providers globally to find trusted service providers',
    subtitle: 'Compare verified profiles, real reviews, secure payments, and service records before choosing a pro.',
    rating: '4.8 average rating',
    proof: 'Trusted by over 30,000 small businesses, agencies, and global users worldwide',
    verified: 'Verified providers',
    secure: 'Secure payments',
    records: 'Receipts and history',
  },
  es: {
    eyebrow: 'Confianza que convierte',
    title: 'Usado por proveedores de servicios globales para encontrar proveedores confiables',
    subtitle: 'Compara perfiles verificados, reseñas reales, pagos seguros e historial de servicio antes de elegir.',
    rating: 'Calificacion promedio 4.8',
    proof: 'Con la confianza de mas de 30,000 pequenas empresas, agencias y usuarios globales',
    verified: 'Proveedores verificados',
    secure: 'Pagos seguros',
    records: 'Recibos e historial',
  },
  pt: {
    eyebrow: 'Confianca que converte',
    title: 'Usado por prestadores de servico globais para encontrar prestadores confiaveis',
    subtitle: 'Compare perfis verificados, avaliacoes reais, pagamentos seguros e historico antes de escolher.',
    rating: 'Avaliacao media 4.8',
    proof: 'Confiado por mais de 30.000 pequenas empresas, agencias e usuarios globais',
    verified: 'Prestadores verificados',
    secure: 'Pagamentos seguros',
    records: 'Recibos e historico',
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
    { label: copy.verified, icon: ShieldCheck },
    { label: copy.secure, icon: CreditCard },
    { label: copy.records, icon: ReceiptText },
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
              <div className="flex items-center gap-1 text-amber-500" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-1 text-sm font-semibold">{copy.rating}</p>
              <p className="text-xs text-muted-foreground">{copy.proof}</p>
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

import type { ComponentType, SVGProps } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Check, Home, Stethoscope, Scale } from 'lucide-react';

export type BaiseApp = 'casa' | 'medical' | 'legal';

interface BaiseAppCardProps {
  app: BaiseApp;
  current: boolean;
  href: string;
  external: boolean;
}

interface AppMeta {
  color: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const APP_META: Record<BaiseApp, AppMeta> = {
  casa: { color: '#1dbf73', icon: Home },
  medical: { color: '#00b8d4', icon: Stethoscope },
  legal: { color: '#7c3aed', icon: Scale },
};

const CARD_BG = 'hsl(0 0% 10%)';
const CARD_BG_HOVER = 'hsl(0 0% 12%)';
const CARD_BORDER = 'hsl(0 0% 18%)';

export function BaiseAppCard({ app, current, href, external }: BaiseAppCardProps) {
  const { t } = useTranslation();
  const meta = APP_META[app];
  const Icon = meta.icon;
  const title = t(`hub.${app}.title`);
  const blurb = t(`hub.${app}.blurb`);
  const cta = t(`hub.${app}.cta`);
  const bulletsRaw = t(`hub.${app}.bullets`, { returnObjects: true });
  const bullets = Array.isArray(bulletsRaw) ? (bulletsRaw as string[]) : [];

  const cardStyle = {
    background: `linear-gradient(180deg, ${CARD_BG} 0%, ${CARD_BG} 100%)`,
    border: `1px solid ${CARD_BORDER}`,
    '--accent': meta.color,
    '--accent-hover-bg': CARD_BG_HOVER,
  } as React.CSSProperties;

  const inner = (
    <>
      {/* Top accent bar with gradient */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
        style={{
          background: `linear-gradient(90deg, ${meta.color}00 0%, ${meta.color} 50%, ${meta.color}00 100%)`,
        }}
      />

      {/* Hover glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at var(--mx, 50%) var(--my, 0%), ${meta.color}26, transparent 40%)`,
        }}
      />

      {current && (
        <div
          className="absolute top-4 right-4 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] rounded-full text-white shadow-lg"
          style={{
            backgroundColor: meta.color,
            boxShadow: `0 0 20px ${meta.color}66`,
          }}
        >
          {t('hub.youAreHere')}
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}99 100%)`,
            boxShadow: `0 8px 30px -8px ${meta.color}66`,
          }}
          aria-hidden="true"
        >
          <Icon className="w-7 h-7 text-white" />
        </div>

        <h3 className="text-2xl md:text-[26px] font-bold text-white mb-2.5 tracking-tight">
          {title}
        </h3>
        <p className="text-[15px] text-white/60 mb-5 leading-relaxed">{blurb}</p>

        {bullets.length > 0 && (
          <ul className="space-y-2.5 mb-7 flex-1">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[14px] text-white/85 leading-snug">
                <span
                  className="mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: `${meta.color}26` }}
                  aria-hidden="true"
                >
                  <Check className="w-3 h-3" style={{ color: meta.color }} strokeWidth={3} />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        <div
          className="inline-flex items-center justify-between gap-3 px-5 py-3 rounded-xl text-white font-semibold text-[14px] self-stretch transition-all duration-300 group-hover:translate-y-[-1px]"
          style={{
            background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}dd 100%)`,
            boxShadow: `0 8px 24px -10px ${meta.color}aa`,
          }}
        >
          <span>{cta}</span>
          <ArrowUpRight
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </div>
      </div>
    </>
  );

  const className =
    'relative flex flex-col p-7 pt-9 rounded-2xl overflow-hidden group transition-all duration-500 hover:-translate-y-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-[#0a0a0a] focus-visible:ring-white';

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    target.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    target.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  const ariaLabel = `${title} — ${cta}`;

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={cardStyle}
        onMouseMove={handleMove}
        aria-label={ariaLabel}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link
      to={href}
      className={className}
      style={cardStyle}
      onMouseMove={handleMove}
      aria-label={ariaLabel}
    >
      {inner}
    </Link>
  );
}

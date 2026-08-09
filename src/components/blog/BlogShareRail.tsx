import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import {
  buildShareTargets,
  mountShareRail,
  resolveContext,
  type ShareTarget,
} from '@/lib/share-kit.mjs';
import TARGETS from '@/lib/share-targets.json';
import '@/lib/share-kit.css';

/**
 * The floating share control for a blog post.
 *
 * Behaviour (reveal on scroll, obstacle clearance, footer yield, copy with a
 * non-secure-context fallback, native share, analytics before navigation) lives
 * in the shared kit so the three Baise apps and every other empire blog cannot
 * drift apart. This component owns only the markup and the React lifecycle.
 *
 * Source of truth: BUSINESSES/empire-shared/share-kit/ — synced here by
 * BUSINESSES/empire-shared/deep-links/sync-to-hubs.sh. Do not edit src/lib copies.
 */

const NO_TARGETS: ShareTarget[] = [];
const targetCache = new Map<string, ShareTarget[]>();
const neverChanges = () => () => {};

function readTargets(url: string, title: string, slug: string, lang: string) {
  const key = `${url}|${lang}`;
  const cached = targetCache.get(key);
  if (cached) return cached;
  const built = buildShareTargets(resolveContext(document, { url, title, slug, lang }), TARGETS);
  targetCache.set(key, built);
  return built;
}

/**
 * Read the app's own palette instead of hard-coding one. All three Baise apps
 * share the shadcn token names and differ only in their values — Casa is green,
 * Legal purple, Medical aqua — so one component stays correct in all three.
 * Values are HSL triplets (`160 76% 44%`), not colours, hence the wrap.
 */
function brandTokens(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const cs = getComputedStyle(document.documentElement);
  const hsl = (name: string, fallback: string) => {
    const raw = cs.getPropertyValue(name).trim();
    return raw ? `hsl(${raw})` : fallback;
  };
  return {
    accent: hsl('--primary', '#111111'),
    ink: hsl('--foreground', '#111111'),
    surface: hsl('--background', '#ffffff'),
    muted: hsl('--muted-foreground', '#6b7280'),
  };
}

export function BlogShareRail({
  url,
  title,
  slug,
}: {
  url: string;
  title: string;
  slug: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';

  // Which targets exist depends on navigator.share and the user agent, so this
  // is a read of an external (platform) value rather than derived state.
  const targets = useSyncExternalStore(
    neverChanges,
    () => readTargets(url, title, slug, lang),
    () => NO_TARGETS,
  );

  useEffect(() => {
    if (!ref.current || targets.length === 0) return;
    return mountShareRail({
      root: ref.current,
      context: resolveContext(document, { url, title, slug, lang }),
      targets,
      heading: lang.startsWith('pt') ? 'Compartilhar' : lang.startsWith('es') ? 'Compartir' : 'Share',
      footerSelector: 'footer',
      // The mobile nav is fixed to the bottom edge on small screens; without
      // this the docked bar sits on top of it.
      obstacleSelector: 'nav.fixed.bottom-0,#empire-consent',
      tokens: brandTokens(),
    });
  }, [targets, url, title, slug, lang]);

  if (targets.length === 0) return null;

  return (
    <nav ref={ref} className="ek-share" data-ek-share-root aria-label="Share this post" hidden>
      <p className="ek-share__label">
        {lang.startsWith('pt') ? 'Compartilhar' : lang.startsWith('es') ? 'Compartir' : 'Share'}
      </p>
      <div className="ek-share__row">
        {targets.map((target) =>
          target.action === 'link' ? (
            <a
              key={target.key}
              className="ek-share__btn"
              data-ek-share={target.key}
              data-ek-docked-hidden={target.dockedHidden ? '1' : undefined}
              href={target.href}
              {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              aria-label={target.label}
              title={target.label}
            >
              <ShareIcon path={target.icon} />
              <span className="ek-share__tip">{target.short}</span>
            </a>
          ) : (
            <button
              key={target.key}
              type="button"
              className="ek-share__btn"
              data-ek-share={target.key}
              data-ek-docked-hidden={target.dockedHidden ? '1' : undefined}
              aria-label={target.label}
              title={target.label}
            >
              <ShareIcon path={target.icon} />
              <span className="ek-share__tip">{target.short}</span>
            </button>
          ),
        )}
      </div>
      <span className="ek-share__status" role="status" aria-live="polite" />
    </nav>
  );
}

function ShareIcon({ path }: { path: string }) {
  return (
    <svg className="ek-share__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={path} />
    </svg>
  );
}

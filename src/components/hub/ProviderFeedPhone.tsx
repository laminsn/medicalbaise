import { useTranslation } from 'react-i18next';

/**
 * A phone showing the provider feed as a visitor would actually scroll it.
 *
 * The track holds the cards twice and translates by exactly -50%, so the loop
 * is seamless: at the end of the animation the second copy sits precisely where
 * the first began. Duplicating is what makes it continuous — a single pass would
 * visibly snap back.
 *
 * The images are real generated provider photos in /public/feed, not stock: this
 * is meant to read as the product, and a stock-looking feed undercuts the claim
 * the section is making.
 */

const CARDS = [
  { img: '/feed/feed-doctor.jpg', key: 'doctor', live: true },
  { img: '/feed/feed-lawyer.jpg', key: 'lawyer', live: false },
  { img: '/feed/feed-builder.jpg', key: 'builder', live: false },
] as const;

export function ProviderFeedPhone({ accent }: { accent: string }) {
  const { t } = useTranslation();
  // Rendered twice for the seamless loop; the duplicate is decorative, so it is
  // hidden from assistive tech rather than read out a second time.
  const track = [...CARDS, ...CARDS];

  return (
    <div className="relative mx-auto w-[268px] sm:w-[300px]">
      {/* soft glow behind the device */}
      <div
        aria-hidden="true"
        className="absolute -inset-8 rounded-[3rem] opacity-40 blur-3xl"
        style={{ background: `radial-gradient(circle at 50% 30%, ${accent}55, transparent 70%)` }}
      />

      <div
        className="relative overflow-hidden rounded-[2.6rem] border-[7px] border-[#1c1c1e] bg-black shadow-2xl"
        style={{ boxShadow: '0 30px 70px -25px rgba(0,0,0,0.9)' }}
      >
        {/* notch */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 z-20 h-[22px] w-[110px] -translate-x-1/2 rounded-b-2xl bg-[#1c1c1e]"
        />

        {/* status bar */}
        <div className="relative z-10 flex items-center justify-between px-5 pb-1 pt-2 font-mono text-[9px] text-white/50">
          <span>9:41</span>
          <span>{t('hub.feedPhone.appName')}</span>
        </div>

        <div className="relative h-[430px] overflow-hidden">
          <div className="baise-feed-track">
            {track.map((card, i) => (
              <article
                key={`${card.key}-${i}`}
                className="relative h-[430px] w-full shrink-0"
                aria-hidden={i >= CARDS.length ? 'true' : undefined}
              >
                <img
                  src={card.img}
                  alt={i < CARDS.length ? t(`hub.feedPhone.${card.key}.alt`) : ''}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {/* legibility scrim */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 32%, transparent 46%, rgba(0,0,0,0.86) 100%)',
                  }}
                />

                {card.live && (
                  <span
                    className="absolute left-3 top-3 rounded-full px-2 py-[3px] text-[9px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: '#e0245e' }}
                  >
                    ● {t('hub.feedPhone.live')}
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-[13px] font-bold leading-tight text-white">
                    {t(`hub.feedPhone.${card.key}.name`)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/75">
                    {t(`hub.feedPhone.${card.key}.trade`)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-[3px] text-[9.5px] font-semibold text-black"
                      style={{ backgroundColor: accent }}
                    >
                      {t('hub.feedPhone.verified')}
                    </span>
                    <span className="font-mono text-[10px] text-white/70">
                      ★ {t(`hub.feedPhone.${card.key}.rating`)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* fade the seam at both ends so cards enter and leave softly */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-20"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.95) 30%, transparent)' }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}
          />
        </div>

        {/* home indicator */}
        <div className="flex justify-center bg-black py-2" aria-hidden="true">
          <span className="h-[3px] w-24 rounded-full bg-white/25" />
        </div>
      </div>
    </div>
  );
}

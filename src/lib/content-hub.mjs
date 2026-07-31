/**
 * Empire content-hub renderer.
 *
 * Renders the strategic content funnel into a link-in-bio hub, in priority order:
 *   1. LATEST EPISODE  — auto-fetched from the channel's YouTube RSS (via /api/latest-episode)
 *   2. YOUTUBE         — the loudest slot; where the view credit + algorithm live
 *   3. LISTEN          — the streaming/monetized-listening row
 *   4. RESOURCES       — blog / guides / lead magnets
 *
 * It is BRAND-NEUTRAL: it emits semantic markup with class hooks and, via `classMap`,
 * reuses each hub's own card classes so the content links look native to that hub's
 * design. It renders links through EmpireDeepLinks so a tap opens the native app.
 *
 * Non-negotiables (same as the resolver):
 *  - Never fabricate. A platform/channel with verified !== true renders NOTHING.
 *  - Never break the normal case. Every link's href is the plain web URL.
 *  - Fire analytics before a native handoff (the handoff kills the page).
 *  - The latest-episode block only appears once the fetch actually returns an episode.
 *
 * Depends on EmpireDeepLinks (deep-links.iife.js) being loaded first.
 *
 * @see BUSINESSES/knowledge-base/marketing/content-links.json  (the config)
 */

const LISTEN_PLATFORMS = [
  ['spotify', 'Spotify'],
  ['apple_podcasts', 'Apple Podcasts'],
  ['youtube_music', 'YouTube Music'],
  ['amazon_music', 'Amazon Music'],
  ['deezer', 'Deezer'],
];

const DEFAULT_LABELS = {
  latestKicker: 'Latest episode',
  watch: 'Watch on YouTube',
  youtube: 'YouTube',
  youtubeSub: 'Watch & subscribe',
  listen: 'Listen',
  resources: 'Resources',
};

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.textContent = String(v);
    else node.setAttribute(k, v);
  }
  for (const c of children) if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return node;
}

/** Wire an anchor through the resolver: web href always; native handoff inside in-app. */
function wireLink(a, platform, entry, tracking, DL) {
  const resolved = DL.resolve(platform, entry, { tracking });
  if (!resolved) return null; // unverified → caller drops it
  a.href = resolved.href;
  a.addEventListener('click', (e) => {
    beacon(tracking);
    if (resolved.nativeUrl) {
      e.preventDefault();
      DL.attemptNative(resolved);
    }
  });
  return a;
}

function beacon(tracking) {
  try {
    navigator.sendBeacon?.(
      '/api/link-analytics',
      new Blob(
        [JSON.stringify({ event_type: 'bio.cta.clicked', ...tracking })],
        { type: 'application/json' }
      )
    );
  } catch {}
}

/**
 * @param {HTMLElement} mount   where to render
 * @param {object} config       the business slice of content-links.json
 * @param {object} opts         { classMap, labels, tracking, DL }
 *   classMap: { section, kicker, card, cardTitle, cardSub, primary, listenRow, listenChip, resourceCard }
 */
export function renderContentHub(mount, config, opts = {}) {
  const DL = opts.DL || window.EmpireDeepLinks;
  if (!mount || !config || !DL) return;
  const cm = opts.classMap || {};
  const L = { ...DEFAULT_LABELS, ...(opts.labels || {}) };
  const src = (opts.tracking && opts.tracking.source) || 'bio';

  const yt = config.youtube || {};
  // `verified` = the channel exists and is ours. `ready` = it is worth linking yet.
  // Same split social-handles.json uses — never conflate "doesn't exist" with
  // "exists but has nothing on it we want to lead with". ready:false renders nothing.
  const ytVerified = yt.verified === true && yt.ready !== false && (yt.channel_url || yt.channel_id);

  // ---- 2. YOUTUBE primary slot (rendered first structurally so it can lead) ----
  if (ytVerified) {
    const url = yt.channel_url || `https://www.youtube.com/channel/${yt.channel_id}`;
    const a = el('a', { class: cm.primary || 'ch-primary', 'data-track': 'youtube' },
      el('span', { class: cm.cardTitle }, L.youtube),
      el('em', { class: cm.cardSub }, L.youtubeSub));
    if (wireLink(a, 'youtube', { handle: yt.channel_id, url, verified: true },
      { source: `${src}-youtube`, destination: 'youtube' }, DL)) {
      mount.appendChild(el('div', { class: cm.section || 'ch-section' }, a));
    }
  }

  // ---- 3. LISTEN row ----
  const listen = config.listen || {};
  const chips = [];
  for (const [key, name] of LISTEN_PLATFORMS) {
    const entry = listen[key];
    if (!entry || entry.verified !== true || !entry.url) continue;
    const a = el('a', { class: cm.listenChip || 'ch-chip', 'data-track': `listen-${key}` }, name);
    if (wireLink(a, key, { url: entry.url, verified: true },
      { source: `${src}-listen-${key}`, destination: `listen_${key}` }, DL)) chips.push(a);
  }
  if (chips.length) {
    const row = el('div', { class: cm.listenRow || 'ch-listen' });
    row.appendChild(el('p', { class: cm.kicker || 'ch-kicker' }, L.listen));
    const wrap = el('div', { class: 'ch-chips' });
    chips.forEach((c) => wrap.appendChild(c));
    row.appendChild(wrap);
    mount.appendChild(el('div', { class: cm.section || 'ch-section' }, row));
  }

  // ---- 4. RESOURCES ----
  const resources = Array.isArray(config.resources) ? config.resources : [];
  if (resources.length) {
    const box = el('div', { class: cm.section || 'ch-section' });
    box.appendChild(el('p', { class: cm.kicker || 'ch-kicker' }, L.resources));
    for (const r of resources) {
      if (!r || !r.url) continue;
      const a = el('a', {
        class: cm.resourceCard || cm.card || 'ch-card',
        href: r.url,
        'data-track': `resource`,
        ...(r.external ? { target: '_blank', rel: 'noopener' } : {}),
      },
        el('div', {},
          el('strong', { class: cm.cardTitle }, r.label || ''),
          r.sub ? el('span', { class: cm.cardSub }, r.sub) : null),
        el('em', {}, r.external ? '↗' : '→'));
      a.addEventListener('click', () => beacon({ source: `${src}-resource`, destination: 'resource', href: r.url }));
      box.appendChild(a);
    }
    mount.appendChild(box);
  }

  // ---- 1. LATEST EPISODE (fetched; prepended so it leads once it resolves) ----
  // Gated on the SAME ytVerified as the primary slot: an unverified channel must
  // never reach the fetcher, or an unconfirmed destination could render here even
  // though the contract says verified!==true renders nothing.
  const le = config.latest_episode || {};
  if (ytVerified && le.enabled && le.endpoint) {
    const q = yt.channel_id
      ? `channel=${encodeURIComponent(yt.channel_id)}`
      : `handle=${encodeURIComponent((yt.channel_url || '').split('/@')[1] || '')}`;
    fetch(`${le.endpoint}?${q}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((ep) => {
        if (!ep || !ep.url) return; // no episode → render nothing (no fabrication)
        const a = el('a', { class: cm.latestCard || cm.card || 'ch-latest', 'data-track': 'latest-episode' },
          ep.thumbnail ? el('img', { class: 'ch-thumb', src: ep.thumbnail, alt: '', loading: 'lazy' }) : null,
          el('div', { class: 'ch-latest-copy' },
            el('span', { class: cm.kicker || 'ch-kicker' }, L.latestKicker),
            el('strong', { class: cm.cardTitle }, ep.title),
            el('em', { class: cm.cardSub }, L.watch)));
        wireLink(a, 'youtube', { handle: yt.channel_id, url: ep.url, verified: true },
          { source: `${src}-latest`, destination: 'latest_episode' }, DL);
        mount.insertBefore(el('div', { class: cm.section || 'ch-section' }, a), mount.firstChild);
      })
      .catch(() => {});
  }
}

export default { renderContentHub };

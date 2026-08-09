/**
 * Empire share kit — the floating share control for every empire blog.
 *
 * Problem it solves: every empire blog is built to CAPTURE a reader (name, email,
 * phone, events) and not one of them asks the reader to PASS IT ON. A reader who
 * wants to send a post to a partner has to select the URL bar and paste it
 * somewhere. The blog is the hub we own; a hub with no outbound edge is a cul-de-sac.
 *
 * Design rules (lifted from deep-links.mjs, which earned them):
 *  1. Never break the normal case. Every target is a real <a href> carrying the
 *     plain intent URL. If JS never runs, the links still work.
 *  2. Never ship a guess. verified:false, or an unmet `requires`, renders NOTHING.
 *     A dead share button is worse than a missing one because it fails silently.
 *  3. Fire analytics BEFORE navigating. Navigation kills the page — use sendBeacon.
 *  4. Never collide with the CTA. The right rail belongs to the opt-in form; this
 *     lives on the left, and on small screens it yields to the consent banner.
 *
 * The module is deliberately split in half:
 *   - PURE half (no DOM): resolveContext / withSource / buildShareTargets.
 *     React shells import this and render their own markup.
 *   - DOM half: renderRailHTML / mountShareRail. Static hubs use this.
 *
 * @see ./targets.json for the destination matrix and its per-row confidence.
 * @see ./README.md
 */

/* ------------------------------------------------------------------ pure half */

/** Locales we carry labels for. Anything else falls back to English. */
const LOCALES = ['en', 'pt', 'es'];

/** Normalise `pt-BR` / `es-419` / `EN` down to a key we hold labels for. */
export function normaliseLang(lang) {
  const base = String(lang || 'en').toLowerCase().split('-')[0];
  return LOCALES.includes(base) ? base : 'en';
}

/**
 * Append the attribution param.
 *
 * Every outbound share URL carries ?source=share-<key> so both the reach and the
 * return traffic are measurable — including copy-link and native share, which are
 * the two highest-intent paths and therefore exactly the two you cannot afford to
 * leave unmeasured. Canonical tags absorb the SEO effect of the variants.
 */
export function withSource(url, key, param = 'source') {
  if (!url || !key) return url;
  try {
    const u = new URL(url);
    // Don't clobber an inbound ?source= the page was already opened with —
    // that would rewrite someone else's attribution.
    if (!u.searchParams.has(param)) u.searchParams.set(param, `share-${key}`);
    return u.toString();
  } catch {
    return url; // relative or malformed — leave it alone rather than mangle it
  }
}

/**
 * Resolve what we are actually sharing, degrading through progressively weaker
 * sources. Every empire blog stamps data-blog-* on <body> (Brainwash's
 * render-blog.mjs and Carolina's blog-analytics.js already share the convention),
 * so the common case needs no wiring at all.
 */
export function resolveContext(doc, overrides = {}) {
  const d = doc || (typeof document !== 'undefined' ? document : null);

  // The static generators stamp data-blog-* on <body>; the Next surface stamps
  // it on the page wrapper div instead. Check body first, then anywhere — the
  // convention is the attribute name, not the element it happens to sit on.
  let ds = (d && d.body && d.body.dataset) || {};
  if (!ds.blogSlug && !ds.blogTitle && d && d.querySelector) {
    const carrier = d.querySelector('[data-blog-slug],[data-blog-title]');
    if (carrier && carrier.dataset) ds = carrier.dataset;
  }

  const meta = (sel, attr = 'content') => {
    if (!d || !d.querySelector) return '';
    const el = d.querySelector(sel);
    return (el && el.getAttribute(attr)) || '';
  };

  const url =
    overrides.url ||
    meta('link[rel="canonical"]', 'href') ||
    meta('meta[property="og:url"]') ||
    (typeof location !== 'undefined' ? location.href : '');

  const title =
    overrides.title ||
    ds.blogTitle ||
    meta('meta[property="og:title"]') ||
    (d && d.title) ||
    '';

  const promise =
    overrides.promise ||
    meta('meta[name="description"]') ||
    meta('meta[property="og:description"]') ||
    '';

  return {
    url,
    title,
    promise,
    slug: overrides.slug || ds.blogSlug || '',
    lang: normaliseLang(overrides.lang || ds.blogLang || (d && d.documentElement && d.documentElement.lang)),
  };
}

/** Fill a template, URL-encoding every placeholder value. */
function fill(template, vars) {
  let unresolved = false;
  const out = String(template).replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key];
    if (val == null || val === '') {
      // A missing {url} is fatal; a missing {promise} is merely an empty body.
      if (key === 'url' || key === 'title') unresolved = true;
      return '';
    }
    return encodeURIComponent(String(val));
  });
  return unresolved ? null : out;
}

/**
 * Does this environment satisfy a row's `requires`?
 * Never assume — an absent API must yield an absent button, not a dead one.
 */
export function capabilityAvailable(requires, env) {
  if (!requires) return true;
  const nav = (env && env.navigator) || (typeof navigator !== 'undefined' ? navigator : undefined);
  if (!nav) return false;
  if (requires === 'navigator.share') return typeof nav.share === 'function';
  if (requires === 'navigator.clipboard') return !!(nav.clipboard && nav.clipboard.writeText);
  return false;
}

/**
 * Build the renderable target list for one post.
 *
 * @param {object} ctx     from resolveContext()
 * @param {object} matrix  parsed targets.json
 * @param {object} [opts]  { env, isMobile, sourceParam }
 * @returns {Array<{key,label,short,icon,action,href,newTab,done}>}
 *          Rows that fail verification or capability are simply absent.
 */
export function buildShareTargets(ctx, matrix, opts = {}) {
  const rows = (matrix && matrix.targets) || [];
  const lang = normaliseLang(ctx && ctx.lang);
  const isMobile = opts.isMobile !== undefined ? opts.isMobile : detectMobile(opts.env);

  const built = rows
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((row) => {
      if (row.verified !== true) return null;                          // rule 2
      if (row.mobileOnly && !isMobile) return null;
      if (!capabilityAvailable(row.requires, opts.env)) return null;   // rule 2

      const shareUrl = withSource(ctx.url, row.key, opts.sourceParam);
      if (!shareUrl) return null;

      const base = {
        key: row.key,
        label: (row.label && (row.label[lang] || row.label.en)) || row.key,
        short: (row.short && (row.short[lang] || row.short.en)) || row.key,
        done: (row.done && (row.done[lang] || row.done.en)) || null,
        icon: row.icon || '',
        action: row.action || 'link',
        newTab: row.newTab !== false && !row.action,
        url: shareUrl,
      };

      // copy / native carry no template — they act on ctx directly.
      if (row.action) return { ...base, href: shareUrl };

      const href = fill(row.template, { ...ctx, url: shareUrl });
      return href ? { ...base, href } : null;
    })
    .filter(Boolean);

  /* The docked bar is one row on a 375px phone: label + N buttons. Ten targets
   * (every platform, plus SMS and native, both of which appear on a real phone)
   * overflow it and silently clip the LAST ones — which is how the copy button,
   * the only path to Instagram and TikTok, ends up unreachable.
   *
   * So mark the overflow. `copy` and `native` are pinned because copy is the
   * fallback for everything with no web intent, and native IS the full platform
   * list via the OS sheet. What drops off a phone is reachable inside that
   * sheet. CSS applies this only below the rail breakpoint — the vertical rail
   * has room for all of them. */
  const cap = opts.maxDocked || 7;
  const pinned = new Set(opts.pinned || ['copy', 'native']);
  const budget = cap - built.filter((t) => pinned.has(t.key)).length;
  let spent = 0;
  return built.map((t) =>
    pinned.has(t.key) ? t : { ...t, dockedHidden: spent++ >= budget }
  );
}

function detectMobile(env) {
  const nav = (env && env.navigator) || (typeof navigator !== 'undefined' ? navigator : null);
  if (!nav) return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent || '');
}

/* ------------------------------------------------------------------- DOM half */

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

/**
 * Markup for the rail. Anchors are real links with real hrefs (rule 1) — the JS
 * only intercepts to fire analytics and to handle copy/native.
 *
 * Root class is `ek-share`; the empire prefix avoids colliding with any host
 * site's own `.share-*` classes (Baby Elephant already ships `.share-btn`).
 */
export function renderRailHTML(targets, opts = {}) {
  const heading = opts.heading || 'Share this';
  if (!targets || !targets.length) return '';

  const buttons = targets
    .map((t) => {
      const tag = t.action === 'link' ? 'a' : 'button';
      const attrs =
        t.action === 'link'
          ? `href="${esc(t.href)}"${t.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''}`
          : 'type="button"';
      return (
        `<${tag} class="ek-share__btn" data-ek-share="${esc(t.key)}"` +
        `${t.dockedHidden ? ' data-ek-docked-hidden="1"' : ''} ${attrs} ` +
        `aria-label="${esc(t.label)}" title="${esc(t.label)}">` +
        `<svg class="ek-share__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">` +
        `<path d="${esc(t.icon)}"/></svg>` +
        `<span class="ek-share__tip">${esc(t.short)}</span>` +
        `</${tag}>`
      );
    })
    .join('');

  return (
    `<nav class="ek-share" data-ek-share-root aria-label="${esc(heading)}" hidden>` +
    `<p class="ek-share__label">${esc(heading)}</p>` +
    `<div class="ek-share__row">${buttons}</div>` +
    `<span class="ek-share__status" role="status" aria-live="polite"></span>` +
    `</nav>`
  );
}

/** Copy that works outside a secure context too, where navigator.clipboard is undefined. */
async function copyText(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through to the legacy path — a rejected permission is not fatal */
    }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Mount the rail and wire its behaviour.
 *
 * Everything here is additive and defensive: if the root is missing, if the
 * consent banner never appears, if IntersectionObserver is absent — the control
 * still renders and still works.
 *
 * @returns {Function} cleanup
 */
export function mountShareRail(options = {}) {
  const root = options.root || document.querySelector('[data-ek-share-root]');
  if (!root) return () => {};

  const ctx = options.context || resolveContext(document);
  const targets = options.targets || [];

  /* Per-hub palette. A blog that already declares the empire token names
   * (--yellow / --blog-yellow …) needs nothing. A blog with its own system —
   * Carolina is navy/gold Tailwind, Fica com Deus is sapphire/gold — declares
   * it here rather than in a stylesheet, because this module injects its <style>
   * at runtime and would therefore load AFTER the hub's CSS and win. An inline
   * custom property on the root beats both, and it puts the palette at the call
   * site where the person wiring the hub can see it. */
  if (options.tokens) {
    for (const [name, value] of Object.entries(options.tokens)) {
      if (value == null) continue;
      root.style.setProperty(name.startsWith('--') ? name : `--ek-${name}`, String(value));
    }
  }
  const byKey = new Map(targets.map((t) => [t.key, t]));
  const status = root.querySelector('.ek-share__status');
  const revealAt = options.revealAt != null ? options.revealAt : 0.12;

  /* -- the label yields before the buttons do -----------------------------
   * The heading is the only variable-width part, and it is translated: "Share"
   * is 5 characters, "Compartilhar" is 12. On a 375px phone that difference
   * pushed the last button clean off the screen, and in the vertical rail it
   * made the whole column 120px wide instead of 64px. Rather than guess a
   * breakpoint per language, measure: if the label is what does not fit, drop
   * the label. Every button keeps an aria-label, so nothing is lost but a word. */
  const fitLabel = () => {
    const label = root.querySelector('.ek-share__label');
    const row = root.querySelector('.ek-share__row');
    if (!label || !row) return;
    root.classList.remove('is-tight');
    const vertical = getComputedStyle(row).flexDirection === 'column';
    const overflows = vertical
      ? label.scrollWidth > row.offsetWidth
      : root.scrollWidth > root.clientWidth + 1;
    if (overflows) root.classList.add('is-tight');
  };

  /* -- reveal on scroll ---------------------------------------------------
     Showing it at 0% reads as an ad. Showing it after the reader has cleared
     the hero reads as intentional. */
  let shown = false;
  const reveal = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 1;
    if (!shown && ratio >= revealAt) {
      shown = true;
      root.hidden = false;
      // Measure only once it is in the layout — a hidden element has no width.
      requestAnimationFrame(() => {
        fitLabel();
        root.classList.add('is-visible');
      });
    }
  };
  reveal();
  addEventListener('scroll', reveal, { passive: true });
  addEventListener('resize', reveal);
  // The rail/docked regimes swap at a breakpoint, so re-measure on resize.
  addEventListener('resize', fitLabel);

  /* -- yield to the footer -------------------------------------------------
     On small screens the bar is bottom-docked; letting it sit over the footer
     (or over the mobile opt-in form, which lands near the end of the flow)
     would cover the exact thing we want the reader to fill in. */
  let footObserver = null;
  const foot = options.footer || document.querySelector(options.footerSelector || 'footer');
  if (foot && typeof IntersectionObserver === 'function') {
    footObserver = new IntersectionObserver(
      (entries) => entries.forEach((e) => root.classList.toggle('is-yielding', e.isIntersecting)),
      { rootMargin: '0px' }
    );
    footObserver.observe(foot);
  }

  /* -- yield to the consent banner ----------------------------------------
     The empire consent banner is position:fixed; bottom:0 at z-index
     2147483647 — the maximum possible, which cannot be outranked. A
     bottom-docked bar is buried by it for every first-time visitor unless we
     measure it and sit above it. */
  /* Anything else pinned to the bottom of the viewport that the docked bar must
   * sit above. Two real cases, and they can co-exist:
   *   - the empire consent banner (#empire-consent — the REAL id used by both
   *     empire-shared/tracking/consent-banner.mjs and its Next mirror), and
   *   - a host's own bottom CTA (Fica com Deus ships `.flutua`, full-width at
   *     bottom:0; Baise ships a mobile nav).
   * Measure them all and clear the tallest, rather than assuming one. */
  const OBSTACLES =
    options.obstacleSelector ||
    options.consentSelector ||
    '#empire-consent,[data-consent-banner],#consent-banner,.consent-banner';

  const measureConsent = () => {
    let tallest = 0;
    for (const el of document.querySelectorAll(OBSTACLES)) {
      if (el === root || root.contains(el)) continue;
      const cs = getComputedStyle(el);
      // NOT offsetParent — it is null for every position:fixed element, which
      // is exactly what these are. Computed visibility is the check that works.
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
      const rect = el.getBoundingClientRect();
      if (rect.height === 0) continue;
      // How far up from the viewport bottom this element reaches.
      const reach = window.innerHeight - rect.top;
      if (reach > tallest) tallest = reach;
    }
    root.style.setProperty('--ek-share-consent', `${Math.max(0, Math.round(tallest))}px`);
  };
  measureConsent();
  addEventListener('resize', measureConsent);
  // The empire banner dispatches on DOCUMENT with bubbles:false, so a window
  // listener alone never hears it. Listen on both — cheap, and the difference
  // between the bar reclaiming its space and sitting in a permanent gap.
  document.addEventListener('cookie:consent', measureConsent);
  addEventListener('cookie:consent', measureConsent);
  const consentTimer = setTimeout(measureConsent, 1200);
  // The banner is usually injected AFTER us (it is a client component on the
  // Next surface), and it can be dismissed at any time. A single timer would
  // catch the first case and miss the second, so watch the body directly.
  let bodyObserver = null;
  if (typeof MutationObserver === 'function') {
    bodyObserver = new MutationObserver(measureConsent);
    bodyObserver.observe(document.body, { childList: true, subtree: false });
  }

  /* -- analytics ----------------------------------------------------------
     Rule 3: fire BEFORE navigating. A new-tab open usually spares the page,
     but a mailto:/sms: handoff does not, so treat every path the same. */
  const track = (key) => {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'blog_share',
        share_platform: key,
        destination_slug: ctx.slug || '',
        page_url: ctx.url || '',
      });
    } catch {
      /* analytics must never break the share */
    }
    const beacon = options.beaconUrl;
    if (beacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        navigator.sendBeacon(beacon, JSON.stringify({ event: 'blog_share', platform: key, slug: ctx.slug }));
      } catch {}
    }
  };

  const say = (msg) => {
    if (!status) return;
    status.textContent = msg;
    clearTimeout(say._t);
    say._t = setTimeout(() => { status.textContent = ''; }, 2600);
  };

  const onClick = async (event) => {
    const el = event.target.closest('[data-ek-share]');
    if (!el || !root.contains(el)) return;
    const key = el.getAttribute('data-ek-share');
    const target = byKey.get(key);
    if (!target) return;

    track(key);

    if (target.action === 'copy') {
      event.preventDefault();
      const ok = await copyText(target.url || ctx.url);
      el.classList.toggle('is-done', ok);
      say(ok ? (target.done || 'Copied') : (options.copyFailed || 'Press Ctrl+C to copy'));
      setTimeout(() => el.classList.remove('is-done'), 2200);
      return;
    }

    if (target.action === 'native') {
      event.preventDefault();
      try {
        await navigator.share({ title: ctx.title, text: ctx.title, url: target.url || ctx.url });
      } catch {
        /* the user dismissed the sheet — not an error, and not worth a message */
      }
      return;
    }
    // plain link: let the browser do exactly what the href says (rule 1)
  };

  root.addEventListener('click', onClick);

  return function cleanup() {
    removeEventListener('scroll', reveal);
    removeEventListener('resize', reveal);
    removeEventListener('resize', fitLabel);
    removeEventListener('resize', measureConsent);
    removeEventListener('cookie:consent', measureConsent);
    document.removeEventListener('cookie:consent', measureConsent);
    clearTimeout(consentTimer);
    if (bodyObserver) bodyObserver.disconnect();
    if (footObserver) footObserver.disconnect();
    root.removeEventListener('click', onClick);
  };
}

/** One-call convenience for static hubs: resolve, build, inject, mount. */
export function autoMount(matrix, options = {}) {
  const ctx = resolveContext(document, options.context);
  const targets = buildShareTargets(ctx, matrix, options);
  if (!targets.length) return () => {};

  let root = document.querySelector('[data-ek-share-root]');

  // A multilingual hub re-mounts when the reader switches language. Reusing the
  // existing node would rewire the behaviour and leave the OLD labels sitting
  // there, so replace the markup rather than adopt it. Callers that re-init for
  // any reason want this; the first mount is unaffected either way.
  if (root && options.replace !== false) {
    root.remove();
    root = null;
  }

  if (!root) {
    const host = options.mountTo || document.body;
    host.insertAdjacentHTML('beforeend', renderRailHTML(targets, options));
    root = document.querySelector('[data-ek-share-root]');
  }
  return mountShareRail({ ...options, root, context: ctx, targets });
}

export default {
  normaliseLang,
  withSource,
  resolveContext,
  capabilityAvailable,
  buildShareTargets,
  renderRailHTML,
  mountShareRail,
  autoMount,
};

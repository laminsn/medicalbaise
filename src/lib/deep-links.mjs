/**
 * Empire deep-link resolver.
 *
 * Problem it solves: a tap from an Instagram bio opens our link-in-bio page inside
 * Instagram's in-app WebView. A plain https://youtube.com/... link then opens the
 * channel *inside that WebView*, logged out — so the view never accrues to the
 * account, the subscribe button is one-tap-broken, and our own site's session
 * cookies don't exist.
 *
 * This module hands the navigation off to the NATIVE APP when (and only when) we
 * detect an in-app browser, and otherwise gets out of the way entirely.
 *
 * Design rules (do not relax these):
 *  1. Never break the normal case. Desktop and real mobile browsers always get the
 *     plain https URL. The native handoff is strictly additive.
 *  2. Always fall back. Android carries S.browser_fallback_url; iOS uses a timed
 *     fallback. The anchor's href is ALWAYS the web URL, so if JS never runs the
 *     link still works. Progressive enhancement, not JS-dependence.
 *  3. Never ship a guess. A platform whose matrix row is not VERIFIED/PARTIAL, or
 *     whose handle is not verified, emits the plain web URL — never a broken scheme.
 *  4. Fire analytics BEFORE navigating. A scheme handoff kills the page.
 *
 * @see ./platforms.json for the scheme/package matrix and its per-row confidence.
 * @see ./README.md
 */

const NATIVE_OK = new Set(['VERIFIED', 'PARTIAL']);

/**
 * Detect OS and whether we are inside a known in-app browser.
 * UA sniffing is defeatable — that is acceptable here because a false negative
 * simply yields the ordinary web link, which is the safe outcome.
 */
export function detectContext(matrix, ua) {
  const agent = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  const sigs = (matrix && matrix._in_app_signatures) || {};

  const os = /iPhone|iPad|iPod/i.test(agent)
    ? 'ios'
    : /Android/i.test(agent)
      ? 'android'
      : 'other';

  // `sources` is also an array, so filtering on Array.isArray alone is not enough —
  // it would treat source URLs as UA tokens. Skip the metadata keys explicitly.
  const META_KEYS = new Set(['confidence', 'note', 'sources']);

  let app = null;
  for (const [name, tokens] of Object.entries(sigs)) {
    if (META_KEYS.has(name) || !Array.isArray(tokens)) continue;
    if (tokens.some((t) => agent.includes(t))) {
      app = name;
      break;
    }
  }

  return { os, app, isInApp: app !== null };
}

/** Append tracking params without clobbering any the caller already set. */
export function withTracking(url, params) {
  if (!params) return url;
  try {
    const u = new URL(url);
    for (const [k, v] of Object.entries(params)) {
      if (v != null && !u.searchParams.has(k)) u.searchParams.set(k, String(v));
    }
    return u.toString();
  } catch {
    return url; // relative or malformed — leave it alone rather than mangle it
  }
}

function fill(template, vars) {
  if (!template) return null;
  let out = template;
  let unresolved = false;
  out = out.replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key];
    if (val == null || val === '') {
      unresolved = true;
      return '';
    }
    return String(val);
  });
  return unresolved ? null : out;
}

/** Build an Android intent:// URL with a guaranteed web fallback. */
export function buildAndroidIntent(webUrl, pkg) {
  let u;
  try {
    u = new URL(webUrl);
  } catch {
    return null;
  }
  if (!pkg) return null;
  const hostPath = `${u.host}${u.pathname}${u.search}`;
  return (
    `intent://${hostPath}#Intent;scheme=${u.protocol.replace(':', '')};package=${pkg};` +
    `S.browser_fallback_url=${encodeURIComponent(webUrl)};end`
  );
}

/**
 * Resolve one social destination.
 *
 * @param {string} platformKey    e.g. 'youtube'
 * @param {object} handleEntry    from social-handles.json: { handle, url, verified, ... }
 * @param {object} matrix         parsed platforms.json
 * @param {object} [opts]         { ua, tracking }
 * @returns {null|{href:string, webUrl:string, strategy:string, onClick?:Function}}
 *          null means: render nothing. The handle or the platform row is not trustworthy.
 */
export function resolveDeepLink(platformKey, handleEntry, matrix, opts = {}) {
  const row = matrix && matrix[platformKey];
  if (!row || !handleEntry) return null;

  // Rule 3: an unverified handle never ships. A dead link is worse than no button.
  if (handleEntry.verified !== true) return null;

  const webUrl = withTracking(
    handleEntry.url || fill(row.web, handleEntry) || '',
    opts.tracking
  );
  if (!webUrl) return null;

  const ctx = detectContext(matrix, opts.ua);
  const plain = { href: webUrl, webUrl, strategy: 'web' };

  // Only augment inside a detected in-app browser, and only for trustworthy rows.
  if (!ctx.isInApp || !NATIVE_OK.has(row.confidence)) return plain;

  if (ctx.os === 'android') {
    const intent = buildAndroidIntent(webUrl, row.android_package);
    // href stays the web URL so a JS-less / unsupported client still works.
    return intent ? { ...plain, strategy: 'android-intent', nativeUrl: intent } : plain;
  }

  if (ctx.os === 'ios') {
    const scheme = fill(row.ios_scheme, { ...handleEntry, handle: handleEntry.handle });
    return scheme ? { ...plain, strategy: 'ios-scheme', nativeUrl: scheme } : plain;
  }

  return plain;
}

/**
 * Attempt the native handoff, then fall back to the web URL.
 *
 * The timing here is the fiddly part. We cannot reliably distinguish "app opened"
 * from "app not installed" — so we watch for the page being backgrounded (which
 * means the app took over) and cancel the fallback if it happens. Safari does not
 * always dispatch visibilitychange/pagehide, so we listen on several events and
 * still bound the whole thing with a timer.
 *
 * Returns a cleanup function.
 */
export function attemptNative(resolved, { timeout = 1200, navigate } = {}) {
  if (!resolved || !resolved.nativeUrl) return () => {};

  const go = navigate || ((url) => { window.location.href = url; });
  let settled = false;

  const cancel = () => {
    if (settled) return;
    settled = true;
    cleanup();
  };

  const events = ['visibilitychange', 'pagehide', 'blur'];
  const onLeave = () => {
    // Page went away => the native app almost certainly took over. Don't double-navigate.
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') return;
    cancel();
  };

  function cleanup() {
    clearTimeout(timer);
    events.forEach((e) => {
      try { document.removeEventListener(e, onLeave); } catch {}
      try { window.removeEventListener(e, onLeave); } catch {}
    });
  }

  events.forEach((e) => {
    try { document.addEventListener(e, onLeave); } catch {}
    try { window.addEventListener(e, onLeave); } catch {}
  });

  const timer = setTimeout(() => {
    if (settled) return;
    settled = true;
    cleanup();
    go(resolved.webUrl); // app absent (or blocked) — land them on the real page
  }, timeout);

  try {
    go(resolved.nativeUrl);
  } catch {
    cancel();
    go(resolved.webUrl);
  }

  return cancel;
}

/**
 * Build an "open this in the real browser" URL.
 *
 * Meta actively blocks programmatic escapes and this is an acknowledged
 * cat-and-mouse game — so callers MUST also render a visible "Open in browser" /
 * "Copy link" control. Never rely on this alone.
 */
export function escapeInAppBrowser(url, matrix, opts = {}) {
  const ctx = detectContext(matrix, opts.ua);
  if (!ctx.isInApp) return null;

  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const hostPath = `${u.host}${u.pathname}${u.search}`;

  if (ctx.os === 'ios') {
    return { href: `x-safari-https://${hostPath}`, strategy: 'ios-safari', webUrl: url };
  }
  if (ctx.os === 'android') {
    return {
      href:
        `intent://${hostPath}#Intent;scheme=https;package=com.android.chrome;` +
        `S.browser_fallback_url=${encodeURIComponent(url)};end`,
      strategy: 'android-chrome',
      webUrl: url,
    };
  }
  return null;
}

export default {
  detectContext,
  resolveDeepLink,
  attemptNative,
  escapeInAppBrowser,
  buildAndroidIntent,
  withTracking,
};

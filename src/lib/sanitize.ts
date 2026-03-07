import DOMPurify from 'dompurify';

// Global hook: force rel="noopener noreferrer" on all anchor tags to prevent tabnabbing
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer');
    // Only allow http(s) and mailto protocols in links
    const href = node.getAttribute('href') || '';
    if (href && !/^(https?:|mailto:|#|\/)/i.test(href)) {
      node.removeAttribute('href');
    }
  }
  // Remove any img src that isn't https or data
  if (node.tagName === 'IMG') {
    const src = node.getAttribute('src') || '';
    if (src && !/^(https?:|data:image\/)/i.test(src)) {
      node.removeAttribute('src');
    }
  }
});

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Strips all dangerous tags/attributes while preserving safe formatting.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'b', 'em', 'i', 'u', 's', 'del',
      'ul', 'ol', 'li',
      'a', 'span', 'div',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class',
      'src', 'alt', 'width', 'height',
    ],
    // style attribute removed — CSS can be used for data exfiltration and UI redressing
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    // Force rel="noopener noreferrer" on links to prevent tabnabbing
    FORCE_BODY: true,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button', 'meta', 'link', 'base', 'svg', 'math'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange', 'oninput', 'onkeydown', 'onkeyup', 'onkeypress', 'style'],
  });
}

/**
 * Sanitize plain text — strips ALL HTML tags.
 * Use for user-generated text content that should never contain HTML.
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Escape HTML entities for safe display in non-innerHTML contexts.
 */
export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Validate that a URL is safe (http/https only).
 * Prevents javascript:, data:, and other dangerous protocols.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize a redirect URL to prevent open redirect attacks.
 * Only allows relative paths or same-origin URLs.
 */
export function sanitizeRedirectUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) {
      return '/';
    }
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    // If it's a relative path starting with /, allow it
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }
    return '/';
  }
}

/**
 * Truncate and sanitize user input to prevent oversized payloads.
 */
export function sanitizeInput(input: string, maxLength = 5000): string {
  return sanitizeText(input.slice(0, maxLength));
}

/**
 * Sanitize a value for use in PostgREST `.or()` / `.filter()` strings.
 * Strips characters that could inject additional filter clauses:
 *   commas (clause separator), parentheses, dots (column.op), and backslashes.
 * Use this whenever interpolating user input into a PostgREST filter string.
 */
export function sanitizePostgrestValue(value: string): string {
  return value.replace(/[,().\\]/g, '');
}

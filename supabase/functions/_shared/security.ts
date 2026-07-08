/**
 * Shared security utilities for Supabase Edge Functions.
 * Provides CORS, authentication, input validation, and HTML escaping.
 */

// --- CORS Configuration ---

const ALLOWED_ORIGINS = [
  'https://casabaise.lovable.app',
  'https://casabaise.com',
  'https://www.casabaise.com',
  'https://medicalbaise.lovable.app',
  'https://medicalbaise.com',
  'https://www.medicalbaise.com',
  'https://mdbaise.com',
  'https://www.mdbaise.com',
  'https://legalbaise.lovable.app',
  'https://legalbaise.com',
  'https://www.legalbaise.com',
];

// In development, also allow localhost
if (Deno.env.get('ENVIRONMENT') !== 'production') {
  ALLOWED_ORIGINS.push(
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176',
  );
}

/**
 * Returns CORS headers with origin validation.
 * Only allows whitelisted origins instead of wildcard "*".
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Permitted-Cross-Domain-Policies': 'none',
  };
}

// --- Authentication Helpers ---

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

/**
 * Authenticates a request and returns the user.
 * Throws an error if authentication fails.
 */
export async function authenticateRequest(req: Request): Promise<{
  user: { id: string; email: string };
  token: string;
}> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new AuthError('No authorization header provided', 401);
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token || token === authHeader) {
    throw new AuthError('Invalid authorization header format', 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new AuthError('Server configuration error', 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError('Invalid or expired token', 401);
  }

  if (!user.email) {
    throw new AuthError('User email not available', 401);
  }

  return { user: { id: user.id, email: user.email }, token };
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

// --- Server-Side Rate Limiting (in-memory, per-instance) ---

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter for edge functions.
 * Returns true if the request is allowed, false if rate-limited.
 */
export function serverRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// --- Input Validation ---

/**
 * Safely parses JSON from a request body with size limits.
 */
export async function parseRequestBody<T = Record<string, unknown>>(
  req: Request,
  maxSizeBytes: number = 1024 * 100 // 100KB default
): Promise<T> {
  const contentLength = req.headers.get('Content-Length');
  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    throw new Error('Request body too large');
  }

  try {
    const body = await req.json();
    if (typeof body !== 'object' || body === null) {
      throw new Error('Invalid request body');
    }
    return body as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON in request body');
    }
    throw error;
  }
}

// --- HTML Escaping (for email templates) ---

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escapes HTML special characters to prevent injection in email templates.
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

// --- URL Validation ---

/**
 * Validates that a URL is a safe HTTP(S) URL.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validates and restricts the origin header to allowed domains for redirect URLs.
 */
export function getSafeOrigin(req: Request, fallback: string = 'https://casabaise.lovable.app'): string {
  const origin = req.headers.get('origin') || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return fallback;
}

// --- HTML Sanitization for User-Provided HTML (email campaigns) ---

/**
 * Sanitizes user-provided HTML for email campaigns.
 * Strips script tags, event handlers, dangerous URLs, iframes, forms, SVG,
 * and other vectors that could execute arbitrary code or exfiltrate data.
 */
export function sanitizeCampaignHtml(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') return '';

  let s = html;

  // Strip script tags and their content
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Strip style blocks (can contain expression(), behavior:url())
  s = s.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Strip event handlers (onclick, onerror, onload, onmouseover, etc.)
  s = s.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Strip javascript:, data:, and vbscript: URLs from any attribute
  s = s.replace(/(href|src|action|background|formaction|poster|dynsrc|lowsrc)\s*=\s*["']?\s*(?:javascript|data|vbscript)\s*:/gi, '$1="');

  // Strip dangerous CSS expressions in inline styles
  s = s.replace(/expression\s*\(/gi, '');
  s = s.replace(/behavior\s*:/gi, '');
  s = s.replace(/-moz-binding\s*:/gi, '');
  s = s.replace(/url\s*\(\s*["']?\s*(?:javascript|data)\s*:/gi, 'url(');

  // Strip iframe, object, embed, form, input, textarea, select, button, meta, link, base, applet tags
  s = s.replace(/<\s*\/?\s*(iframe|object|embed|form|input|textarea|select|button|meta|link|base|applet|frame|frameset)\b[^>]*>/gi, '');

  // Strip SVG (can contain arbitrary JS via <foreignObject>, event handlers, etc.)
  s = s.replace(/<svg\b[\s\S]*?<\/svg>/gi, '');

  // Strip <math> (can be used for mXSS in some contexts)
  s = s.replace(/<math\b[\s\S]*?<\/math>/gi, '');

  return s;
}

// --- HTTP Method Validation ---

/**
 * Returns a 405 Method Not Allowed response if the request method is not POST.
 * Returns null if the method is allowed (POST or OPTIONS).
 * OPTIONS is handled separately by CORS preflight, so callers should check OPTIONS first.
 */
export function rejectNonPostMethod(req: Request, corsHeaders: Record<string, string>): Response | null {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Allow': 'POST, OPTIONS' },
      }
    );
  }
  return null;
}

// --- WebAuthn Domain Validation ---

const ALLOWED_RP_DOMAINS = [
  'casabaise.lovable.app',
  'casabaise.com',
  'www.casabaise.com',
  'medicalbaise.lovable.app',
  'medicalbaise.com',
  'www.medicalbaise.com',
  'mdbaise.com',
  'www.mdbaise.com',
  'legalbaise.lovable.app',
  'legalbaise.com',
  'www.legalbaise.com',
  'localhost',
];

/**
 * Returns a validated rpId for WebAuthn. Only allows known production domains
 * and localhost for development. Rejects unknown origins to prevent phishing.
 */
export function getValidatedRpId(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  try {
    const hostname = new URL(origin).hostname;
    if (ALLOWED_RP_DOMAINS.includes(hostname)) {
      return hostname;
    }
  } catch {
    // invalid origin URL
  }
  return 'localhost';
}

/**
 * Returns a validated origin for WebAuthn. Only allows known origins.
 */
export function getValidatedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return 'http://localhost:8080';
}

// --- Error Handling ---

/**
 * Creates a safe error response that doesn't leak internal details.
 */
export function createErrorResponse(
  error: unknown,
  corsHeaders: Record<string, string>,
  logPrefix: string = ''
): Response {
  const isAuthError = error instanceof AuthError;
  const status = isAuthError ? error.status : 500;

  // Log the full error server-side
  if (logPrefix) {
    console.error(`[${logPrefix}] ERROR:`, error instanceof Error ? error.message : String(error));
  }

  // Return sanitized error to client
  const clientMessage = isAuthError
    ? error.message
    : 'An internal error occurred. Please try again later.';

  return new Response(
    JSON.stringify({ error: clientMessage }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Security utilities for authentication hardening.
 * Implements rate limiting, account lockout, and password strength validation.
 *
 * IMPORTANT: Client-side rate limiting is a defense-in-depth layer only.
 * It can be bypassed by clearing localStorage or using incognito mode.
 * Server-side rate limiting (Supabase Auth + Edge Functions) is the
 * primary enforcement layer. This provides UX feedback and deters casual abuse.
 */

const LOGIN_ATTEMPTS_KEY = 'auth_login_attempts';
const LOCKOUT_KEY = 'auth_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 minute sliding window

interface LoginAttempt {
  timestamp: number;
  email: string;
}

/** Record a failed login attempt */
export function recordFailedAttempt(email: string): void {
  const attempts = getRecentAttempts();
  attempts.push({ timestamp: Date.now(), email: email.toLowerCase() });
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));

  // Check if lockout threshold reached
  const recentForEmail = attempts.filter(
    (a) => a.email === email.toLowerCase() && Date.now() - a.timestamp < ATTEMPT_WINDOW_MS
  );
  if (recentForEmail.length >= MAX_ATTEMPTS) {
    const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify({ email: email.toLowerCase(), until: lockoutUntil }));
  }
}

/** Clear attempts after a successful login */
export function clearLoginAttempts(email: string): void {
  const attempts = getRecentAttempts().filter((a) => a.email !== email.toLowerCase());
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
  const lockout = getLockout();
  if (lockout && lockout.email === email.toLowerCase()) {
    localStorage.removeItem(LOCKOUT_KEY);
  }
}

/** Check if account is currently locked out */
export function isAccountLocked(email: string): { locked: boolean; remainingMs: number } {
  const lockout = getLockout();
  if (lockout && lockout.email === email.toLowerCase()) {
    const remaining = lockout.until - Date.now();
    if (remaining > 0) {
      return { locked: true, remainingMs: remaining };
    }
    // Lockout expired
    localStorage.removeItem(LOCKOUT_KEY);
  }
  return { locked: false, remainingMs: 0 };
}

/** Get remaining attempts before lockout */
export function getRemainingAttempts(email: string): number {
  const attempts = getRecentAttempts().filter(
    (a) => a.email === email.toLowerCase() && Date.now() - a.timestamp < ATTEMPT_WINDOW_MS
  );
  return Math.max(0, MAX_ATTEMPTS - attempts.length);
}

function getRecentAttempts(): LoginAttempt[] {
  try {
    const stored = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (!stored) return [];
    const attempts: LoginAttempt[] = JSON.parse(stored);
    // Prune old attempts
    const cutoff = Date.now() - ATTEMPT_WINDOW_MS;
    return attempts.filter((a) => a.timestamp > cutoff);
  } catch {
    return [];
  }
}

function getLockout(): { email: string; until: number } | null {
  try {
    const stored = localStorage.getItem(LOCKOUT_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Password strength validator.
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-5
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasDigit: boolean;
    hasSpecial: boolean;
  };
}

// Common passwords that should always be rejected regardless of complexity
const COMMON_PASSWORDS = new Set([
  'password1234', 'qwerty123456', 'admin1234567', '123456789012',
  'letmein12345', 'welcome12345', 'monkey123456', 'dragon123456',
  'master123456', 'football1234', 'shadow123456', 'sunshine1234',
  'trustno11234', 'iloveyou1234', 'batman123456', 'password!234',
]);

export function validatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const passesComplexity = Object.values(checks).every(Boolean);
  const isCommon = COMMON_PASSWORDS.has(password.toLowerCase());
  const isValid = passesComplexity && !isCommon;

  return { isValid, score: isCommon ? Math.min(score, 2) : score, checks };
}

/** Format remaining lockout time as human-readable string */
export function formatLockoutTime(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes <= 1) return '1 minute';
  return `${minutes} minutes`;
}

/**
 * Generate a cryptographically random nonce for CSRF-like protection.
 * Used for state parameters in OAuth flows.
 */
export function generateNonce(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate that a JWT token is not expired (client-side check only).
 * This does NOT validate the signature — that must be done server-side.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * Security utilities for authentication hardening.
 * Implements rate limiting, account lockout, and password strength validation.
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

export function validatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const isValid = Object.values(checks).every(Boolean);

  return { isValid, score, checks };
}

/** Format remaining lockout time as human-readable string */
export function formatLockoutTime(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes <= 1) return '1 minute';
  return `${minutes} minutes`;
}

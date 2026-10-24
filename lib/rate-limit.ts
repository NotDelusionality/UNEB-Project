/**
 * In-memory login rate limiting (§5.5): after 5 failures for one email
 * within 15 minutes, further attempts for that email are rejected for
 * 15 minutes. Resets on server restart; the README names the production
 * alternative (a persistent store).
 */

const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

type AttemptRecord = {
  failures: number;
  windowStartedAt: number;
  lockedUntil: number | null;
};

// Survives dev-server hot reloads the same way the db client does.
const globalForRateLimit = globalThis as unknown as {
  loginAttempts?: Map<string, AttemptRecord>;
};
const attempts = (globalForRateLimit.loginAttempts ??= new Map());

/** Returns null when the attempt may proceed, or the lockout expiry when not. */
export function loginLockedUntil(email: string): Date | null {
  const record = attempts.get(email.toLowerCase());
  if (!record?.lockedUntil) return null;
  if (record.lockedUntil <= Date.now()) {
    attempts.delete(email.toLowerCase());
    return null;
  }
  return new Date(record.lockedUntil);
}

export function recordLoginFailure(email: string): void {
  const key = email.toLowerCase();
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now - record.windowStartedAt > WINDOW_MS) {
    attempts.set(key, { failures: 1, windowStartedAt: now, lockedUntil: null });
    return;
  }

  record.failures += 1;
  if (record.failures >= MAX_FAILURES) {
    record.lockedUntil = now + LOCKOUT_MS;
  }
}

export function clearLoginFailures(email: string): void {
  attempts.delete(email.toLowerCase());
}

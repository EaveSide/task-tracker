// Per-user auth helpers.
//
// Each team member logs in with their own email + password (PBKDF2-hashed in
// the users table). A successful login is recorded as a signed, expiring
// cookie carrying the user id; it cannot be forged without AUTH_SECRET.
// The shared APP_PASSWORD survives only as the "invite code" required to set
// (or reset) a personal password on the first-time-setup screen.
//
// Everything here uses the Web Crypto API (globalThis.crypto.subtle) so it runs
// in the Edge runtime used by Next.js middleware.

export const AUTH_COOKIE = 'tt_team_auth';

// How long a login stays valid before the team has to re-enter the password.
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('Missing AUTH_SECRET env var (used to sign the login cookie)');
  }
  return secret;
}

export function getAppPassword(): string {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    throw new Error('Missing APP_PASSWORD env var (the shared team login password)');
  }
  return password;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return toHex(signature);
}

// Constant-time comparison of two equal-length hex strings.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// Cookie attributes shared by every place that sets the session cookie.
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

// Session token format: `<userId>.<expiryMs>.<hmacHexOf(userId.expiryMs)>`.
// (Old shared-password tokens had two parts and simply fail verification, so
// everyone re-logs in once after the switch to per-user accounts.)
export async function createSessionToken(userId: string, now: number): Promise<string> {
  const expiry = String(now + SESSION_TTL_MS);
  const payload = `${userId}.${expiry}`;
  const signature = await sign(payload, getSecret());
  return `${payload}.${signature}`;
}

// Returns the user id carried by a valid, unexpired token, or null.
export async function verifySessionToken(
  token: string | undefined,
  now: number
): Promise<string | null> {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expiry, signature] = parts;
  if (!userId || !expiry || !signature) return null;

  let expected: string;
  try {
    expected = await sign(`${userId}.${expiry}`, getSecret());
  } catch {
    return null;
  }

  if (!timingSafeEqual(signature, expected)) return null;
  if (Number(expiry) < now) return null;

  return userId;
}

// ── Password hashing (PBKDF2-SHA256, Web Crypto, no dependencies) ──
// Stored format: pbkdf2$<iterations>$<salt-hex>$<hash-hex>

const PBKDF2_ITERATIONS = 100_000;

async function deriveHash(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    256
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveHash(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt.buffer)}$${toHex(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterStr, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'pbkdf2' || !iterStr || !saltHex || !hashHex) return false;
  const iterations = parseInt(iterStr, 10);
  if (!Number.isFinite(iterations) || iterations < 1) return false;

  const hash = await deriveHash(password, fromHex(saltHex), iterations);
  return timingSafeEqual(toHex(hash), hashHex);
}

// Constant-time check of a submitted password against the configured one.
export function passwordMatches(submitted: string): boolean {
  const expected = getAppPassword();
  if (submitted.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < submitted.length; i++) {
    mismatch |= submitted.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

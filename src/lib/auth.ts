// Shared-password ("team login") auth helpers.
//
// There are no per-user accounts: the whole team uses one password, set via the
// APP_PASSWORD env var. A successful login is recorded as a signed, expiring
// cookie so the password itself is never stored in the browser and the cookie
// cannot be forged without AUTH_SECRET.
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

// Token format: `<expiryMs>.<hmacHexOfExpiryMs>`
export async function createAuthToken(now: number): Promise<string> {
  const expiry = String(now + SESSION_TTL_MS);
  const signature = await sign(expiry, getSecret());
  return `${expiry}.${signature}`;
}

export async function verifyAuthToken(token: string | undefined, now: number): Promise<boolean> {
  if (!token) return false;

  const [expiry, signature] = token.split('.');
  if (!expiry || !signature) return false;

  let expected: string;
  try {
    expected = await sign(expiry, getSecret());
  } catch {
    return false;
  }

  if (!timingSafeEqual(signature, expected)) return false;
  if (Number(expiry) < now) return false;

  return true;
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

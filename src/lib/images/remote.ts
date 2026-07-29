import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { MAX_IMAGE_SIZE, type AllowedImageType } from './constants';
import { ImageInputError } from './errors';
import { assertSupportedImage } from './sniff';

// Server-side fetching of an image the user dragged straight out of a web page
// or Slack, where the browser hands us a URL instead of bytes.
//
// This makes the server issue a request to a user-supplied address, so every
// hop is constrained: http(s) only, no address that resolves into private or
// link-local space (which is what protects cloud instance metadata at
// 169.254.169.254), redirects followed manually so each new host is re-checked,
// a hard timeout, a streaming size cap, and magic-byte validation of the
// result. The endpoint is also behind the normal team login.
//
// Residual risk: a hostile DNS server could answer differently between our
// lookup and the fetch (rebinding). Closing that needs connection-level pinning
// of the resolved IP; for a login-gated internal tool the checks below are the
// proportionate trade-off.

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 8000;
const MAX_MB = Math.round(MAX_IMAGE_SIZE / 1024 / 1024);

export interface RemoteImage {
  bytes: Uint8Array;
  type: AllowedImageType;
}

/**
 * Downloads a remote image after validating the destination is a public
 * http(s) address. Throws with a user-facing message on any failure.
 */
export async function fetchRemoteImage(rawUrl: string): Promise<RemoteImage> {
  let target = await resolvePublicUrl(rawUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(target, {
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: 'image/*' },
    }).catch(() => {
      throw new ImageInputError('Could not reach that image URL.');
    });

    const location = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
    if (location) {
      target = await resolvePublicUrl(new URL(location, target).toString());
      continue;
    }

    if (!res.ok) {
      throw new ImageInputError(`Could not download that image (the site returned ${res.status}).`);
    }

    const bytes = await readCappedBody(res);
    return { bytes, type: assertSupportedImage(bytes, target.hostname) };
  }

  throw new ImageInputError('That image URL redirected too many times.');
}

/** Parses a URL and confirms every address it resolves to is publicly routable. */
async function resolvePublicUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ImageInputError('That does not look like a valid image URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ImageInputError('Only http and https image URLs can be imported.');
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(hostname)
    ? [hostname]
    : (await lookup(hostname, { all: true }).catch(() => {
        throw new ImageInputError(`Could not resolve ${url.hostname}.`);
      })).map((entry) => entry.address);

  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new ImageInputError('That image URL points to a private address and cannot be imported.');
  }

  return url;
}

/** True for any address outside publicly routable space. Unknown formats are blocked. */
function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPrivateIPv4(address);
  if (version === 6) return isPrivateIPv6(address);
  return true;
}

function isPrivateIPv4(address: string): boolean {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    return true;
  }
  const [a, b] = parts;

  if (a === 0) return true; // "this network"
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 192 && b === 0) return true; // IETF protocol assignments / TEST-NET-1
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 198 && b === 51) return true; // TEST-NET-2
  if (a === 203 && b === 0) return true; // TEST-NET-3
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  if (a >= 224) return true; // multicast, reserved, broadcast
  return false;
}

function isPrivateIPv6(address: string): boolean {
  const normalized = address.toLowerCase().split('%')[0]; // drop any zone id

  const mapped = /^(?:::ffff:)?(\d+\.\d+\.\d+\.\d+)$/.exec(normalized);
  if (mapped) return isPrivateIPv4(mapped[1]);
  if (normalized === '::' || normalized === '::1') return true;

  const head = normalized.split('::')[0].split(':')[0];
  const first = head ? parseInt(head, 16) : 0;
  if (!Number.isFinite(first)) return true;

  if ((first & 0xfe00) === 0xfc00) return true; // unique local fc00::/7
  if ((first & 0xffc0) === 0xfe80) return true; // link-local fe80::/10
  if ((first & 0xff00) === 0xff00) return true; // multicast ff00::/8
  return false;
}

/** Reads the body, aborting as soon as it exceeds the size limit. */
async function readCappedBody(res: Response): Promise<Uint8Array> {
  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_IMAGE_SIZE) {
    throw new ImageInputError(`That image is larger than the ${MAX_MB}MB limit.`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new ImageInputError('That image URL returned no data.');

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_IMAGE_SIZE) {
      await reader.cancel();
      throw new ImageInputError(`That image is larger than the ${MAX_MB}MB limit.`);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

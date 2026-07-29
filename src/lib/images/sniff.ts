import { SUPPORTED_TYPES_LABEL, type AllowedImageType } from './constants';
import { ImageInputError } from './errors';

// Content-type sniffing from magic bytes.
//
// Both the declared MIME type on an uploaded File and the Content-Type header
// on a fetched remote URL are attacker-controlled, so neither is trusted on its
// own: the bytes themselves have to look like one of the formats we accept.

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, i) => bytes[offset + i] === byte);
}

function asciiAt(bytes: Uint8Array, offset: number, text: string): boolean {
  return startsWith(bytes, Array.from(text, (c) => c.charCodeAt(0)), offset);
}

/**
 * The image type the bytes actually are, or null when they are not one of the
 * formats this app accepts. Only the leading header bytes are inspected.
 */
export function sniffImageType(bytes: Uint8Array): AllowedImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (asciiAt(bytes, 0, 'GIF87a') || asciiAt(bytes, 0, 'GIF89a')) return 'image/gif';
  if (asciiAt(bytes, 0, 'RIFF') && asciiAt(bytes, 8, 'WEBP')) return 'image/webp';
  return null;
}

/**
 * Confirms the bytes are a supported image and returns the true content type.
 * Throws with a user-facing message when they are not.
 */
export function assertSupportedImage(bytes: Uint8Array, label: string): AllowedImageType {
  const sniffed = sniffImageType(bytes);
  if (!sniffed) {
    throw new ImageInputError(`"${label}" is not a readable ${SUPPORTED_TYPES_LABEL} image.`);
  }
  return sniffed;
}

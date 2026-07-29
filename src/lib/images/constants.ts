// Image constraints shared by the client fields and the upload API routes, so
// the browser-side check and the server-side check can never drift apart.

export const MAX_TASK_IMAGES = 6;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/** The `accept` attribute for file inputs that take task photos. */
export const IMAGE_ACCEPT_ATTR = ALLOWED_IMAGE_TYPES.join(',');

const EXTENSIONS: Record<AllowedImageType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export function isAllowedImageType(type: string): type is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

/** Storage-safe file extension for a validated image type. */
export function extensionForType(type: AllowedImageType): string {
  return EXTENSIONS[type];
}

/** Human-readable list used in every "unsupported type" message. */
export const SUPPORTED_TYPES_LABEL = 'JPEG, PNG, GIF, or WebP';

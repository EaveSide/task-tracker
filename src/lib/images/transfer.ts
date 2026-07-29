// Reading images out of a browser DataTransfer (a drop or a paste).
//
// There are three ways an image reaches us without the user saving it first:
//   1. A real file dragged from Finder, or a screenshot pasted from the
//      clipboard — both arrive as a File and upload directly.
//   2. An image dragged out of a web page or Slack — the browser hands over a
//      URL, not bytes, so the server has to fetch it on our behalf.
//   3. An inline `data:` image — bytes encoded in the URL itself, which we
//      decode here rather than round-tripping through the server.

/** Droppable images split by how each one has to be uploaded. */
export interface DroppedImages {
  /** Uploadable as-is via the multipart endpoint. */
  files: File[];
  /** Remote http(s) URLs the server must fetch on our behalf. */
  remoteUrls: string[];
}

const EMPTY: DroppedImages = { files: [], remoteUrls: [] };

/**
 * Whether a drag carries something we could accept. Called during `dragover`,
 * where the payload is not readable yet and only the type list is available.
 */
export function transferHasImages(transfer: DataTransfer | null): boolean {
  if (!transfer) return false;
  const types = Array.from(transfer.types);
  if (types.includes('Files')) return true;
  return types.includes('text/uri-list') || types.includes('text/html');
}

/**
 * Whether a transfer carries actual image bytes. Stricter than
 * {@link transferHasImages}: a paste is only intercepted when it holds a real
 * image, so pasting text or a link into a text field still behaves normally.
 */
export function transferHasImageFiles(transfer: DataTransfer | null): boolean {
  if (!transfer) return false;
  return Array.from(transfer.items).some(
    (item) => item.kind === 'file' && item.type.startsWith('image/')
  );
}

/** Pulls every usable image out of a completed drop or paste. */
export async function readDroppedImages(transfer: DataTransfer | null): Promise<DroppedImages> {
  if (!transfer) return EMPTY;

  // A real file always wins: when a drag carries both bytes and a URL (Chrome
  // does this for some sources), fetching the URL would just duplicate it.
  const files = readFiles(transfer);
  if (files.length > 0) return { files, remoteUrls: [] };

  const urls = readImageUrls(transfer);
  const inlineFiles = await Promise.all(urls.filter(isDataUrl).map(dataUrlToFile));

  return {
    files: inlineFiles.filter((f): f is File => f !== null),
    remoteUrls: urls.filter(isHttpUrl),
  };
}

function readFiles(transfer: DataTransfer): File[] {
  const fromList = Array.from(transfer.files).filter((f) => f.type.startsWith('image/'));
  if (fromList.length > 0) return fromList;

  // Safari populates `items` but not `files` for some clipboard payloads.
  return Array.from(transfer.items)
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter((f): f is File => f !== null);
}

// Candidate image URLs, most-reliable source first. `text/html` is checked
// before `text/uri-list` because dragging an image out of a page puts the
// page's link in uri-list but the actual <img> in the HTML fragment.
function readImageUrls(transfer: DataTransfer): string[] {
  const html = transfer.getData('text/html');
  const fromHtml = html ? parseImgSources(html) : [];
  if (fromHtml.length > 0) return fromHtml;

  const uriList = transfer.getData('text/uri-list') || transfer.getData('text/plain');
  return uriList
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .filter((line) => isDataUrl(line) || isHttpUrl(line));
}

function parseImgSources(html: string): string[] {
  if (typeof DOMParser === 'undefined') return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(doc.querySelectorAll('img'))
    .map((img) => img.getAttribute('src')?.trim() ?? '')
    .filter((src) => isDataUrl(src) || isHttpUrl(src));
}

function isDataUrl(url: string): boolean {
  return url.startsWith('data:image/');
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

async function dataUrlToFile(dataUrl: string): Promise<File | null> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const ext = blob.type.split('/')[1] || 'png';
    return new File([blob], `dropped-image.${ext}`, { type: blob.type });
  } catch {
    return null; // Malformed data URL — reported upstream as an unreadable drop.
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { MAX_TASK_IMAGES } from '@/lib/images/constants';
import { ImageInputError } from '@/lib/images/errors';
import { fetchRemoteImage } from '@/lib/images/remote';
import { uploadTaskImage } from '@/lib/images/storage';

// POST /api/tasks/images/from-url — import images the user dragged straight out
// of a web page or Slack, where the browser gives us a URL instead of bytes.
// JSON body: { urls: string[], task_id?: string } → { image_urls: string[] }.
//
// The server fetches each URL and re-hosts it in our own bucket, so the ticket
// never depends on someone else's CDN still serving that link. Destination
// validation (public http(s) addresses only) lives in fetchRemoteImage; the
// route itself is gated by the normal team login via middleware.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const urls = Array.isArray(body?.urls)
      ? body.urls.filter((u: unknown): u is string => typeof u === 'string' && u.trim() !== '')
      : [];
    const taskId = typeof body?.task_id === 'string' && body.task_id ? body.task_id : crypto.randomUUID();

    if (urls.length === 0) {
      return NextResponse.json({ error: 'No image URLs provided' }, { status: 400 });
    }
    if (urls.length > MAX_TASK_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_TASK_IMAGES} images allowed` },
        { status: 400 }
      );
    }

    const sb = getSupabaseAdmin();
    const imageUrls: string[] = [];

    for (const url of urls) {
      const { bytes, type } = await fetchRemoteImage(url.trim());
      imageUrls.push(await uploadTaskImage(sb, taskId, bytes, type));
    }

    return NextResponse.json({ image_urls: imageUrls });
  } catch (err) {
    if (err instanceof ImageInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('Task image import error:', err);
    return NextResponse.json({ error: 'Failed to import image. Please try again.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import {
  MAX_IMAGE_SIZE,
  MAX_TASK_IMAGES,
  SUPPORTED_TYPES_LABEL,
  isAllowedImageType,
} from '@/lib/images/constants';
import { ImageInputError } from '@/lib/images/errors';
import { assertSupportedImage } from '@/lib/images/sniff';
import { uploadTaskImage } from '@/lib/images/storage';

const MAX_MB = Math.round(MAX_IMAGE_SIZE / 1024 / 1024);

// POST /api/tasks/images — upload photos for a task, returns their public URLs.
// Multipart form: `images` (files), optional `task_id` (groups files in storage).
// Used by the file picker, by drag-and-drop of files, and by pasted screenshots.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('images').filter((v): v is File => v instanceof File);
    const taskId = (formData.get('task_id') as string) || crypto.randomUUID();

    if (files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }
    if (files.length > MAX_TASK_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_TASK_IMAGES} images allowed` },
        { status: 400 }
      );
    }

    const sb = getSupabaseAdmin();
    const imageUrls: string[] = [];

    for (const file of files) {
      if (!file.size) continue; // skip empty file inputs

      // The declared type is a client-supplied hint; the bytes are the
      // authority, so both are checked.
      if (!isAllowedImageType(file.type)) {
        throw new ImageInputError(
          `"${file.name}" is not a supported image type. Use ${SUPPORTED_TYPES_LABEL}.`
        );
      }
      if (file.size > MAX_IMAGE_SIZE) {
        throw new ImageInputError(`"${file.name}" exceeds the ${MAX_MB}MB limit.`);
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      const type = assertSupportedImage(bytes, file.name);
      imageUrls.push(await uploadTaskImage(sb, taskId, bytes, type));
    }

    return NextResponse.json({ image_urls: imageUrls });
  } catch (err) {
    if (err instanceof ImageInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('Task image upload error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

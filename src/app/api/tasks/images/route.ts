import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const MAX_FILES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// POST /api/tasks/images — upload photos for a task, returns their public URLs.
// Multipart form: `images` (files), optional `task_id` (groups files in storage).
// Reuses the submission-images bucket under a tasks/ prefix so no extra
// Supabase setup is required. The caller saves the returned URLs onto the
// task's image_urls via the normal task save.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('images') as File[];
    const taskId = (formData.get('task_id') as string) || crypto.randomUUID();

    if (files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} images allowed` }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const imageUrls: string[] = [];

    for (const file of files) {
      if (!file.size) continue; // skip empty file inputs

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Only JPEG, PNG, GIF, and WebP are allowed.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 5MB limit` },
          { status: 400 }
        );
      }

      const ext = file.name.split('.').pop() || 'jpg';
      // Sanitize the id so a malicious task_id can't traverse storage paths.
      const safeId = taskId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const path = `tasks/${safeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadErr } = await sb.storage
        .from('submission-images')
        .upload(path, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadErr) {
        console.error('Task image upload error:', uploadErr);
        return NextResponse.json(
          { error: 'Failed to upload image. Please try again.' },
          { status: 500 }
        );
      }

      const { data: urlData } = sb.storage.from('submission-images').getPublicUrl(path);
      imageUrls.push(urlData.publicUrl);
    }

    return NextResponse.json({ image_urls: imageUrls });
  } catch (err) {
    console.error('Task image upload error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

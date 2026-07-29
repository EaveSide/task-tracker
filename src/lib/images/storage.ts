import type { SupabaseClient } from '@supabase/supabase-js';
import { extensionForType, type AllowedImageType } from './constants';

// Task photos reuse the submission-images bucket under a `tasks/` prefix, so no
// extra Supabase setup is needed. Callers save the returned public URLs onto
// the task's image_urls through the normal task save.
export const TASK_IMAGE_BUCKET = 'submission-images';

/** Uploads validated image bytes and returns the public URL. */
export async function uploadTaskImage(
  sb: SupabaseClient,
  taskId: string,
  bytes: Uint8Array,
  type: AllowedImageType
): Promise<string> {
  // Sanitize the id so a malicious task_id can't traverse storage paths.
  const safeId = taskId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const suffix = Math.random().toString(36).slice(2, 8);
  const path = `tasks/${safeId}/${Date.now()}-${suffix}.${extensionForType(type)}`;

  const { error } = await sb.storage.from(TASK_IMAGE_BUCKET).upload(path, bytes, {
    contentType: type,
    upsert: false,
  });

  if (error) {
    console.error('Task image upload error:', error);
    throw new Error('Failed to upload image. Please try again.');
  }

  const { data } = sb.storage.from(TASK_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

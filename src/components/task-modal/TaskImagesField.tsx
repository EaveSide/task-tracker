'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { uploadTaskImages } from '@/lib/api/tasks';
import ImageLightbox from '@/components/ui/ImageLightbox';

const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface TaskImagesFieldProps {
  /** Current image URLs on the task (null = none). */
  value: string[] | null;
  /** Task id used to group uploads in storage; may be '' for a new task. */
  taskId: string;
  onChange: (urls: string[] | null) => void;
}

// Editable photo list for the task modal. Files upload as soon as they're
// picked and the resulting URLs are handed back via onChange; they're only
// persisted onto the task when the modal is saved.
export default function TaskImagesField({ value, taskId, onChange }: TaskImagesFieldProps) {
  const urls = value ?? [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (selected.length === 0) return;

    for (const f of selected) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        setError(`"${f.name}" is not a supported image type. Use JPEG, PNG, GIF, or WebP.`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(`"${f.name}" exceeds the 5MB size limit.`);
        return;
      }
    }
    if (urls.length + selected.length > MAX_IMAGES) {
      setError(`A task can have up to ${MAX_IMAGES} photos.`);
      return;
    }

    setError('');
    setUploading(true);
    try {
      const uploaded = await uploadTaskImages(selected, taskId || undefined);
      onChange([...urls, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    const next = urls.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : null);
  }

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">
        Photos <span className="text-gray-600">(up to {MAX_IMAGES}, 5MB each)</span>
      </label>

      {urls.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div key={url} className="relative group">
              <button type="button" onClick={() => setLightboxIndex(i)} title="View image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Attachment ${i + 1}`}
                  className="h-20 w-20 cursor-pointer rounded-lg border border-gray-700 object-cover transition-colors hover:border-blue-500"
                />
              </button>
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove photo"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {urls.length < MAX_IMAGES && (
        <label
          className={`flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-700 px-3 py-2.5 text-xs text-gray-500 transition-colors ${
            uploading ? 'opacity-60' : 'cursor-pointer hover:border-gray-500 hover:text-gray-400'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          {uploading ? 'Uploading...' : urls.length === 0 ? 'Add photos' : `Add more (${urls.length}/${MAX_IMAGES})`}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            disabled={uploading}
            onChange={handleFiles}
            className="hidden"
          />
        </label>
      )}

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={urls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

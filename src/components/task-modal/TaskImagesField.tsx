'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { IMAGE_ACCEPT_ATTR, MAX_IMAGE_SIZE, MAX_TASK_IMAGES } from '@/lib/images/constants';
import type { TaskImagesController } from './useTaskImages';

const MAX_MB = Math.round(MAX_IMAGE_SIZE / 1024 / 1024);

interface TaskImagesFieldProps {
  images: TaskImagesController;
}

// Photo list for the task modal. Uploads happen as soon as an image arrives —
// picked, dropped, or pasted — and the resulting URLs are only persisted onto
// the task when the modal is saved.
export default function TaskImagesField({ images }: TaskImagesFieldProps) {
  const { urls, uploading, error, canAddMore, addFiles, removeAt } = images;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  function handlePicked(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (selected.length > 0) void addFiles(selected);
  }

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">
        Photos <span className="text-gray-600">(up to {MAX_TASK_IMAGES}, {MAX_MB}MB each)</span>
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
                onClick={() => removeAt(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove photo"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <label
          className={`flex flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-gray-700 px-3 py-3 text-xs text-gray-500 transition-colors ${
            uploading ? 'opacity-60' : 'cursor-pointer hover:border-gray-500 hover:text-gray-400'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            {uploading
              ? 'Uploading...'
              : urls.length === 0
                ? 'Add photos'
                : `Add more (${urls.length}/${MAX_TASK_IMAGES})`}
          </span>
          {!uploading && (
            <span className="text-[11px] text-gray-600">
              or drop an image anywhere on this ticket, or paste with ⌘V
            </span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_ACCEPT_ATTR}
            multiple
            disabled={uploading}
            onChange={handlePicked}
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

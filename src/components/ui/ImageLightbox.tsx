'use client';

import { useCallback, useEffect, useState } from 'react';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

// Full-screen in-app image viewer with a carousel: arrow buttons and
// arrow-key navigation, Esc or backdrop click to close. Sits above the task
// modal (z-50), and swallows its key events in the capture phase so Esc
// closes only the lightbox, not the modal underneath.
export default function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), images.length - 1)
  );

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!['Escape', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.stopPropagation();
      e.preventDefault();
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose, prev, next]);

  const hasMultiple = images.length > 1;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        title="Close"
        aria-label="Close image viewer"
        className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>

      {hasMultiple && (
        <button
          type="button"
          onClick={prev}
          title="Previous image"
          aria-label="Previous image"
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-gray-900/80 p-2.5 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 4L6.5 10l6 6" />
          </svg>
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt={`Image ${index + 1} of ${images.length}`}
        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
      />

      {hasMultiple && (
        <button
          type="button"
          onClick={next}
          title="Next image"
          aria-label="Next image"
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-gray-900/80 p-2.5 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.5 4l6 6-6 6" />
          </svg>
        </button>
      )}

      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-gray-900/80 px-3 py-1 text-xs text-gray-300">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DragEventHandler } from 'react';
import { transferHasImageFiles, transferHasImages } from '@/lib/images/transfer';

interface UseImageDropTargetOptions {
  /** Called with the payload of a drop or an image paste. */
  onTransfer: (transfer: DataTransfer | null) => void | Promise<void>;
}

export interface ImageDropTarget {
  /** True while an image is being dragged over the target, for the drop hint. */
  isDraggingImage: boolean;
  /** Spread onto the element that should accept drops. */
  dropHandlers: {
    onDragEnter: DragEventHandler;
    onDragOver: DragEventHandler;
    onDragLeave: DragEventHandler;
    onDrop: DragEventHandler;
  };
}

// Turns an element into an image drop zone, and listens for pasted images
// anywhere on the page while it is mounted.
export function useImageDropTarget({ onTransfer }: UseImageDropTargetOptions): ImageDropTarget {
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  // dragenter/dragleave also fire when the pointer crosses child elements, so
  // depth is counted rather than toggled — otherwise the hint flickers.
  const depth = useRef(0);

  const reset = useCallback(() => {
    depth.current = 0;
    setIsDraggingImage(false);
  }, []);

  const onDragEnter = useCallback<DragEventHandler>((e) => {
    if (!transferHasImages(e.dataTransfer)) return;
    e.preventDefault();
    depth.current += 1;
    setIsDraggingImage(true);
  }, []);

  const onDragOver = useCallback<DragEventHandler>((e) => {
    if (!transferHasImages(e.dataTransfer)) return;
    // Without preventDefault the browser refuses the drop and, on release,
    // navigates away to the dragged image.
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDragLeave = useCallback<DragEventHandler>(
    (e) => {
      if (!transferHasImages(e.dataTransfer)) return;
      e.preventDefault();
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setIsDraggingImage(false);
    },
    []
  );

  const onDrop = useCallback<DragEventHandler>(
    (e) => {
      if (!transferHasImages(e.dataTransfer)) return;
      e.preventDefault();
      reset();
      void onTransfer(e.dataTransfer);
    },
    [onTransfer, reset]
  );

  // A drag that ends outside the window never fires dragleave on the target,
  // which would strand the hint on screen.
  useEffect(() => {
    window.addEventListener('dragend', reset);
    window.addEventListener('drop', reset);
    return () => {
      window.removeEventListener('dragend', reset);
      window.removeEventListener('drop', reset);
    };
  }, [reset]);

  // Only image pastes are intercepted, so pasting text into the title or
  // description still works normally.
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (!transferHasImageFiles(e.clipboardData)) return;
      e.preventDefault();
      void onTransfer(e.clipboardData);
    }
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [onTransfer]);

  return {
    isDraggingImage,
    dropHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
  };
}

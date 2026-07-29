'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { importTaskImagesFromUrls, uploadTaskImages } from '@/lib/api/tasks';
import {
  MAX_IMAGE_SIZE,
  MAX_TASK_IMAGES,
  SUPPORTED_TYPES_LABEL,
  isAllowedImageType,
} from '@/lib/images/constants';
import { readDroppedImages } from '@/lib/images/transfer';

const MAX_MB = Math.round(MAX_IMAGE_SIZE / 1024 / 1024);

interface UseTaskImagesOptions {
  /** Image URLs currently on the task (null = none). */
  value: string[] | null;
  /** Task id used to group uploads in storage; '' for a task not created yet. */
  taskId: string;
  onChange: (urls: string[] | null) => void;
}

export interface TaskImagesController {
  urls: string[];
  uploading: boolean;
  error: string;
  canAddMore: boolean;
  /** Uploads picked or dropped files. */
  addFiles: (files: File[]) => Promise<void>;
  /** Uploads everything usable in a drop or paste, files and URLs alike. */
  addFromTransfer: (transfer: DataTransfer | null) => Promise<void>;
  removeAt: (index: number) => void;
}

// Owns the upload side of a task's photos: validation, the in-flight flag, and
// the error message. The URLs themselves stay in the modal's form state, which
// is what gets persisted when the task is saved.
export function useTaskImages({ value, taskId, onChange }: UseTaskImagesOptions): TaskImagesController {
  // Memoized so the identity is stable while the task has no photos, which
  // keeps the ref-sync effect below from re-running on every render.
  const urls = useMemo(() => value ?? [], [value]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Uploads are async, so the list is read from a ref when they land rather
  // than from the closure — otherwise removing a photo mid-upload gets undone.
  // Writes update the ref too, so a second batch sees the first one's result
  // without waiting for a re-render.
  const urlsRef = useRef(urls);
  useEffect(() => {
    urlsRef.current = urls;
  }, [urls]);

  const replace = useCallback(
    (next: string[]) => {
      urlsRef.current = next;
      onChange(next.length > 0 ? next : null);
    },
    [onChange]
  );

  // Batches are serialized: dropping again mid-upload queues behind the first
  // one instead of racing it on the same list.
  const queue = useRef<Promise<void>>(Promise.resolve());

  const runAdd = useCallback(
    async (files: File[], remoteUrls: string[]) => {
      const rejection = validate(files, urlsRef.current.length + files.length + remoteUrls.length);
      if (rejection) {
        setError(rejection);
        return;
      }

      setError('');
      setUploading(true);

      // Files and remote URLs upload independently so that a broken link does
      // not discard photos that already made it.
      const added: string[] = [];
      let failure = '';

      if (files.length > 0) {
        try {
          added.push(...(await uploadTaskImages(files, taskId || undefined)));
        } catch (err) {
          failure = messageFor(err, 'Image upload failed');
        }
      }
      if (remoteUrls.length > 0) {
        try {
          added.push(...(await importTaskImagesFromUrls(remoteUrls, taskId || undefined)));
        } catch (err) {
          failure = failure || messageFor(err, 'Could not import that image');
        }
      }

      if (added.length > 0) replace([...urlsRef.current, ...added]);
      if (failure) setError(failure);
      setUploading(false);
    },
    [replace, taskId]
  );

  const add = useCallback(
    (files: File[], remoteUrls: string[]) => {
      const run = queue.current.then(() => runAdd(files, remoteUrls));
      queue.current = run.catch(() => undefined);
      return run;
    },
    [runAdd]
  );

  const addFiles = useCallback((files: File[]) => add(files, []), [add]);

  const addFromTransfer = useCallback(
    async (transfer: DataTransfer | null) => {
      const { files, remoteUrls } = await readDroppedImages(transfer);
      if (files.length === 0 && remoteUrls.length === 0) {
        setError('That was not an image. Drop an image file, or drag an image out of a web page.');
        return;
      }
      await add(files, remoteUrls);
    },
    [add]
  );

  const removeAt = useCallback(
    (index: number) => replace(urlsRef.current.filter((_, i) => i !== index)),
    [replace]
  );

  return {
    urls,
    uploading,
    error,
    canAddMore: urls.length < MAX_TASK_IMAGES,
    addFiles,
    addFromTransfer,
    removeAt,
  };
}

/** Returns a user-facing reason to reject the batch, or '' when it is fine. */
function validate(files: File[], total: number): string {
  for (const file of files) {
    if (!isAllowedImageType(file.type)) {
      return `"${file.name}" is not a supported image type. Use ${SUPPORTED_TYPES_LABEL}.`;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return `"${file.name}" exceeds the ${MAX_MB}MB size limit.`;
    }
  }
  if (total > MAX_TASK_IMAGES) {
    return `A task can have up to ${MAX_TASK_IMAGES} photos.`;
  }
  return '';
}

function messageFor(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

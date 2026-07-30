'use client';

import { useEffect } from 'react';
import SubmissionForm from './SubmissionForm';

interface AddSubmissionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Wraps the shared SubmissionForm in a modal for the internal Submissions tab.
export default function AddSubmissionModal({ onClose, onSuccess }: AddSubmissionModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* One opaque surface holds both the header and the form. The shared form
          card is semi-transparent by design on the public /submit page, where it
          sits on a plain background, and the header text colour flips with the
          theme — so on the bare overlay the list would show through the form and
          the title would be dark-on-dark in light mode. */}
      <div className="w-full max-w-lg rounded-2xl bg-gray-950">
        <div className="flex items-center justify-between px-6 pt-5">
          <h2 className="text-lg font-semibold">New Submission</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <SubmissionForm onSuccess={onSuccess} onClose={onClose} />
      </div>
    </div>
  );
}

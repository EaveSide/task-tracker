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
      <div className="w-full max-w-lg">
        <div className="mb-3 flex items-center justify-between">
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

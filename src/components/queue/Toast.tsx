'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setExiting(true), 2700);
    const t2 = setTimeout(onDismiss, 3000);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [onDismiss]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
        exiting ? 'queue-toast-exit' : 'queue-toast'
      } ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
    >
      {message}
    </div>
  );
}

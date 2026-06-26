'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password.trim()) {
      setStatus('error');
      setErrorMsg('Enter the team password.');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMsg(data.error || 'Login failed. Try again.');
        return;
      }

      // Full navigation so middleware re-evaluates with the new cookie.
      const safeFrom = from.startsWith('/') ? from : '/';
      window.location.assign(safeFrom);
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-2.5">
          <Image src="/eaveside-logo.png" alt="Eaveside" width={32} height={32} className="rounded-lg" />
          <h1 className="text-lg font-bold">Eaveside Task Tracker</h1>
        </div>
        <p className="text-sm text-gray-400 mb-5">Enter the team password to continue.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            placeholder="Team password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (status === 'error') setStatus('idle');
            }}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />

          {status === 'error' && (
            <p className="text-sm text-red-400" role="alert">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {status === 'submitting' ? 'Checking…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

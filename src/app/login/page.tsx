'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

type Mode = 'login' | 'setup';

const inputCls =
  'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500';

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamPassword, setTeamPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function fail(message: string) {
    setStatus('error');
    setErrorMsg(message);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setStatus('idle');
    setErrorMsg('');
  }

  function navigateIn() {
    // Full navigation so middleware re-evaluates with the new cookie.
    const safeFrom = from.startsWith('/') ? from : '/';
    window.location.assign(safeFrom);
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !password) {
      fail('Enter your email and password.');
      return;
    }
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.needsSetup) {
          switchMode('setup');
          setErrorMsg('No password set yet — create one below.');
          return;
        }
        fail(data.error || 'Login failed. Try again.');
        return;
      }
      navigateIn();
    } catch {
      fail('Network error. Try again.');
    }
  }

  async function handleSetup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !teamPassword || !newPassword) {
      fail('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      fail('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      fail('Passwords do not match.');
      return;
    }
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/login/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), teamPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        fail(data.error || 'Setup failed. Try again.');
        return;
      }
      navigateIn();
    } catch {
      fail('Network error. Try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-2.5">
          <Image src="/eaveside-logo.png" alt="Eaveside" width={32} height={32} className="rounded-lg" />
          <h1 className="text-lg font-bold">Eaveside Task Tracker</h1>
        </div>

        {mode === 'login' ? (
          <>
            <p className="text-sm text-gray-400 mb-5">Sign in with your account.</p>
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="email"
                autoFocus
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                className={inputCls}
              />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                className={inputCls}
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
                {status === 'submitting' ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <button
              onClick={() => switchMode('setup')}
              className="mt-4 w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              First time here or forgot your password? Set one up →
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-5">
              Create your personal password. You&apos;ll need the shared team password as the
              invite code, and your email must already be on the team roster.
            </p>
            <form onSubmit={handleSetup} className="space-y-3">
              <input
                type="email"
                autoFocus
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                className={inputCls}
              />
              <input
                type="password"
                placeholder="Team password (invite code)"
                value={teamPassword}
                onChange={(e) => {
                  setTeamPassword(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                className={inputCls}
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="New password (8+ characters)"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                className={inputCls}
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                className={inputCls}
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
                {status === 'submitting' ? 'Setting up…' : 'Set password & sign in'}
              </button>
            </form>
            <button
              onClick={() => switchMode('login')}
              className="mt-4 w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Back to sign in
            </button>
          </>
        )}
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

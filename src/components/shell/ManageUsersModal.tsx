'use client';

import { useState, type FormEvent } from 'react';
import { useUsers } from '@/components/providers/UsersProvider';

export default function ManageUsersModal({ onClose }: { onClose: () => void }) {
  const { users, addUser, updateUser, removeUser } = useUsers();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState('');

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    const created = await addUser(name.trim(), email.trim() || undefined);
    setSaving(false);
    if (created) {
      setName('');
      setEmail('');
    }
  }

  async function handleEmailSave(id: string) {
    setSaving(true);
    const ok = await updateUser(id, { email: editingEmail.trim() || null });
    setSaving(false);
    if (ok) setEditingId(null);
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Team</h2>
        <p className="text-xs text-gray-500 mb-4">
          Names fill the Assignee dropdown. An email lets that person sign in with their own
          account (they set their password on first login using the team password).
        </p>

        <form onSubmit={handleAdd} className="mb-4 space-y-2">
          <div className="flex gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (for login)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium"
            >
              Add
            </button>
          </div>
        </form>

        <div className="max-h-72 overflow-y-auto space-y-1">
          {users.length === 0 && (
            <p className="text-sm text-gray-500 py-4 text-center">No team members yet.</p>
          )}
          {users.map((u) => (
            <div key={u.id} className="rounded-lg bg-gray-800/60 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{u.name}</span>
                    {u.has_account ? (
                      <span
                        className="rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-400"
                        title="Has a personal password"
                      >
                        Account set up
                      </span>
                    ) : u.email ? (
                      <span
                        className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400"
                        title="Email set, waiting for them to create a password on first login"
                      >
                        Invite pending
                      </span>
                    ) : (
                      <span
                        className="rounded-full bg-gray-600/30 px-1.5 py-0.5 text-[10px] font-medium text-gray-400"
                        title="No email — can be assigned tasks but can't sign in"
                      >
                        No login
                      </span>
                    )}
                  </div>
                  {editingId !== u.id && (
                    <p className="truncate text-xs text-gray-500">{u.email || 'No email'}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {editingId !== u.id && (
                    <button
                      onClick={() => {
                        setEditingId(u.id);
                        setEditingEmail(u.email || '');
                      }}
                      className="text-xs text-gray-500 hover:text-white"
                    >
                      Edit email
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${u.name} from the roster? They will no longer be able to sign in.`))
                        removeUser(u.id);
                    }}
                    className="text-xs text-gray-500 hover:text-red-400"
                    title="Remove"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {editingId === u.id && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="email"
                    autoFocus
                    value={editingEmail}
                    onChange={(e) => setEditingEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleEmailSave(u.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleEmailSave(u.id)}
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-1.5 text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

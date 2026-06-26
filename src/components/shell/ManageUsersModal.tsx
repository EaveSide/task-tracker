'use client';

import { useState, type FormEvent } from 'react';
import { useUsers } from '@/components/providers/UsersProvider';

export default function ManageUsersModal({ onClose }: { onClose: () => void }) {
  const { users, addUser, removeUser } = useUsers();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    const created = await addUser(name.trim());
    setSaving(false);
    if (created) setName('');
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold mb-1">Team</h2>
        <p className="text-xs text-gray-500 mb-4">
          These names fill the Assignee dropdown when creating a task.
        </p>

        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add a person..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            Add
          </button>
        </form>

        <div className="max-h-64 overflow-y-auto space-y-1">
          {users.length === 0 && (
            <p className="text-sm text-gray-500 py-4 text-center">No team members yet.</p>
          )}
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-lg bg-gray-800/60 px-3 py-2"
            >
              <span className="text-sm">{u.name}</span>
              <button
                onClick={() => {
                  if (confirm(`Remove ${u.name} from the roster?`)) removeUser(u.id);
                }}
                className="text-xs text-gray-500 hover:text-red-400"
                title="Remove"
              >
                Remove
              </button>
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

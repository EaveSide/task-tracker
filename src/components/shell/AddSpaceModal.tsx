'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { SPACE_COLORS } from '@/lib/spaces';
import { useSpaces } from '@/components/providers/SpacesProvider';

export default function AddSpaceModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { addSpace } = useSpaces();
  const [name, setName] = useState('');
  const [color, setColor] = useState(SPACE_COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    const created = await addSpace(name.trim(), color);
    setSaving(false);
    if (created) {
      onClose();
      router.push(`/s/${created.id}/board`);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm p-6"
      >
        <h2 className="text-lg font-semibold mb-4">New Space</h2>

        <label className="block text-xs text-gray-400 mb-1">Name *</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sales"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />

        <label className="block text-xs text-gray-400 mb-1 mt-4">Color</label>
        <div className="flex flex-wrap gap-2">
          {SPACE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-7 w-7 rounded-md transition-transform ${
                color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''
              }`}
              style={{ background: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {saving ? 'Creating...' : 'Create Space'}
          </button>
        </div>
      </form>
    </div>
  );
}

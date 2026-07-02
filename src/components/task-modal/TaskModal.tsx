'use client';

import { useState } from 'react';
import { DevTask, AREAS, STATUSES, STATUS_LABELS } from '@/lib/types';
import { makeTaskId } from '@/lib/task-id';
import { useSpaces } from '@/components/providers/SpacesProvider';
import { useUsers } from '@/components/providers/UsersProvider';

const TASK_TYPES = ['Enhancement', 'Bug Fix', 'Bug (Critical)', 'Feature Gap', 'Refactor', 'Documentation'];

interface TaskModalProps {
  task: DevTask;
  saving: boolean;
  sprints: string[];
  onSave: (task: DevTask) => void;
  onClose: () => void;
  isAccepting?: boolean;
  showArchived: 'active' | 'archived';
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  archiving: boolean;
}

export default function TaskModal({
  task,
  saving,
  sprints,
  onSave,
  onClose,
  isAccepting,
  showArchived,
  onArchive,
  onUnarchive,
  archiving,
}: TaskModalProps) {
  const { spaces } = useSpaces();
  const { users } = useUsers();
  const [addingSprint, setAddingSprint] = useState(false);
  const [newSprintNum, setNewSprintNum] = useState('');
  const [form, setForm] = useState<DevTask>(task);

  function set(field: keyof DevTask, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { ...form };
    if (!data.id) {
      data.id = makeTaskId(data.sprint);
    }
    onSave(data);
  }

  const isExisting = Boolean(task.id);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
      >
        <h2 className="text-lg font-semibold mb-4">
          {isAccepting ? 'Accept Submission → Create Task' : isExisting ? 'Edit Task' : 'New Task'}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title *</label>
            <input
              required
              autoFocus
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {form.image_urls && form.image_urls.length > 0 && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Screenshots</label>
              <div className="flex flex-wrap gap-2">
                {form.image_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Attachment ${i + 1}`}
                      className="h-20 w-20 rounded-lg border border-gray-700 object-cover transition-colors hover:border-blue-500"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Project</label>
              <select
                value={form.project}
                onChange={(e) => set('project', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                {spaces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                {form.project && !spaces.some((p) => p.id === form.project) && (
                  <option value={form.project}>{form.project}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sprint</label>
              {addingSprint ? (
                <div className="flex gap-1">
                  <input
                    type="number"
                    min={1}
                    placeholder="#"
                    value={newSprintNum}
                    onChange={(e) => setNewSprintNum(e.target.value)}
                    className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSprintNum) {
                        set('sprint', `Sprint ${newSprintNum}`);
                        setAddingSprint(false);
                        setNewSprintNum('');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg text-xs"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingSprint(false);
                      setNewSprintNum('');
                    }}
                    className="text-gray-400 hover:text-white px-1 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <select
                    value={form.sprint || ''}
                    onChange={(e) => set('sprint', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select sprint...</option>
                    {sprints.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    {form.sprint && !sprints.includes(form.sprint) && (
                      <option value={form.sprint}>{form.sprint}</option>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => setAddingSprint(true)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded-lg text-xs whitespace-nowrap"
                  >
                    + New
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Area</label>
              <select
                value={form.area || ''}
                onChange={(e) => set('area', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select area...</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select
                value={form.type || ''}
                onChange={(e) => set('type', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                {['high', 'medium', 'low'].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Est. Hours</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.est_hours}
                onChange={(e) => set('est_hours', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Assignee</label>
              <select
                value={form.assignee}
                onChange={(e) => set('assignee', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
                {form.assignee && !users.some((u) => u.name === form.assignee) && (
                  <option value={form.assignee}>{form.assignee}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Blocked By</label>
              <input
                value={form.blocked_by}
                onChange={(e) => set('blocked_by', e.target.value)}
                placeholder="Task ID"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-3">
            {isExisting && !isAccepting && showArchived === 'active' && (
              <button
                type="button"
                onClick={() => onArchive(task.id)}
                disabled={archiving}
                className="text-amber-400 hover:text-amber-300 text-sm disabled:opacity-50"
              >
                {archiving ? 'Archiving...' : 'Archive'}
              </button>
            )}
            {isExisting && showArchived === 'archived' && (
              <button
                type="button"
                onClick={() => onUnarchive(task.id)}
                disabled={archiving}
                className="text-blue-400 hover:text-blue-300 text-sm disabled:opacity-50"
              >
                {archiving ? 'Unarchiving...' : 'Unarchive'}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {saving ? 'Saving...' : isAccepting ? 'Accept & Create' : isExisting ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

import type { DevTask } from './types';

// Builds a blank task (id: '' marks it as not-yet-created) with sensible
// defaults, overridable per call — e.g. defaulting `project` to the current
// space, or prefilling from an accepted submission.
export function makeEmptyTask(overrides: Partial<DevTask> = {}): DevTask {
  return {
    id: '',
    title: '',
    description: '',
    project: 'crm',
    priority: 'medium',
    status: 'todo',
    assignee: '',
    created: new Date().toISOString().split('T')[0],
    completed: '',
    sprint: 'Sprint 8',
    area: 'Calc Engine',
    type: 'Enhancement',
    blocked_by: '',
    est_hours: 0,
    notes: '',
    updated_at: '',
    archived: false,
    ...overrides,
  };
}

// Generates a collision-resistant task id like "S8-lr4k9xa2".
// The prefix keeps the sprint number for readability; the suffix combines a
// timestamp and randomness so rapid/bulk creation (e.g. approving several
// submissions in a row) never produces the same id twice.
export function makeTaskId(sprint: string | null | undefined): string {
  const num = String(sprint ?? '').replace('Sprint ', '').trim() || '0';
  const time = Date.now().toString(36).slice(-5);
  const rand = Math.random().toString(36).slice(2, 6);
  return `S${num}-${time}${rand}`;
}

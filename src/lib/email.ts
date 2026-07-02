// Transactional email via Resend (https://resend.com). Sending is best-effort:
// if RESEND_API_KEY is unset or the request fails, we log and return false so
// callers never break their main flow (e.g. saving a task).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string | null | undefined): value is string {
  return typeof value === 'string' && EMAIL_RE.test(value.trim());
}

interface TaskCompletedParams {
  to: string;
  taskTitle: string;
}

export async function sendTaskCompletedEmail({ to, taskTitle }: TaskCompletedParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'Eaveside <noreply@eaveside.com>';

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping completion email to', to);
    return false;
  }
  if (!isValidEmail(to)) {
    console.warn('[email] Invalid recipient, skipping completion email:', to);
    return false;
  }

  const subject = `Update: "${taskTitle}" is complete`;
  const text = [
    'Hi there,',
    '',
    `Good news — the request you submitted, "${taskTitle}", has been completed.`,
    '',
    'Thanks for helping us improve Eaveside.',
    '',
    '— The Eaveside Team',
  ].join('\n');
  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111; line-height: 1.5;">
      <p>Hi there,</p>
      <p>Good news — the request you submitted, <strong>${escapeHtml(taskTitle)}</strong>, has been completed.</p>
      <p>Thanks for helping us improve Eaveside.</p>
      <p style="color: #666;">— The Eaveside Team</p>
    </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to.trim()], subject, text, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[email] Resend responded', res.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] Failed to send completion email', err);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

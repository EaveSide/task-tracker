import { ImageResponse } from 'next/og';

// Favicon, generated at build time. Deliberately distinct from the Eaveside
// CRM's icon (white house on black): same house motif, but on the task
// tracker's blue with a checkmark inside so the browser tabs are easy to
// tell apart.

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#2563eb',
          borderRadius: 36,
        }}
      >
        <svg
          width="150"
          height="150"
          viewBox="0 0 192 192"
          fill="none"
          stroke="#ffffff"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M40 156V78L96 36l56 42v78" />
          <path d="M70 110l20 20 36-40" />
        </svg>
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from 'next/og';

// Home-screen icon (iOS applies its own corner mask, so no border radius).
// Same design as icon.tsx: blue tile, house outline, checkmark.

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
        }}
      >
        <svg
          width="140"
          height="140"
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

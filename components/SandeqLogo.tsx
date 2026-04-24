// components/SandeqLogo.tsx
'use client';

interface Props {
  className?: string;
  variant?: 'full' | 'icon';
}

export default function SandeqLogo({ className = 'w-16 h-16', variant = 'icon' }: Props) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Sandeq Logo"
    >
      <defs>
        <linearGradient id="sandeq-sail" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2E86C1" />
          <stop offset="70%" stopColor="#1A4A7A" />
          <stop offset="100%" stopColor="#F39C12" />
        </linearGradient>
        <linearGradient id="sandeq-hull" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1A4A7A" />
          <stop offset="100%" stopColor="#2E86C1" />
        </linearGradient>
        <linearGradient id="sandeq-wave" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2E86C1" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#1A4A7A" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Sail (layar segitiga) */}
      <path
        d="M 60 18 L 62 78 L 98 72 Z"
        fill="url(#sandeq-sail)"
        stroke="#1A4A7A"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Mast (tiang) */}
      <line x1="60" y1="18" x2="62" y2="82" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />

      {/* Hull (lambung perahu) */}
      <path
        d="M 20 85 Q 60 100 102 85 L 95 90 Q 60 102 27 90 Z"
        fill="url(#sandeq-hull)"
        stroke="#0F2A47"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Outrigger support */}
      <line x1="35" y1="87" x2="25" y2="95" stroke="#5D4037" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="85" y1="87" x2="95" y2="95" stroke="#5D4037" strokeWidth="1.5" strokeLinecap="round" />

      {/* Waves (ombak) */}
      <path
        d="M 10 100 Q 25 96 40 100 T 70 100 T 100 100 T 115 100"
        fill="none"
        stroke="url(#sandeq-wave)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 15 108 Q 30 104 45 108 T 75 108 T 110 108"
        fill="none"
        stroke="url(#sandeq-wave)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}
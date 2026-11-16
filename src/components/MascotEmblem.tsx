import React from 'react';

export function StudyGuardianMascot({ size = 56, meditating = false }: { size?: number; meditating?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="JEE AI Study Guardian Mascot"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="sgShieldGrad" x1="20" y1="14" x2="100" y2="108" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00D4FF" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="sgCapGold" x1="36" y1="18" x2="86" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD426" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="#0A1D56" stroke="url(#sgShieldGrad)" strokeWidth="3.5" />
      {/* Graduation Cap */}
      <polygon points="60,16 90,27 60,38 30,27" fill="#1E293B" stroke="#00D4FF" strokeWidth="2" />
      <rect x="44" y="31" width="32" height="10" rx="3" fill="#1E293B" />
      <line x1="84" y1="29" x2="84" y2="45" stroke="url(#sgCapGold)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="84" cy="46" r="3" fill="#FFD426" />
      {/* Robot Visor */}
      <rect x="34" y="40" width="52" height="34" rx="14" fill="#F8FAFC" stroke="#00D4FF" strokeWidth="2.5" />
      <rect x="40" y="46" width="40" height="22" rx="9" fill="#061233" />
      {meditating ? (
        <>
          <path d="M46 57 Q50 61 54 57" stroke="#00D4FF" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M66 57 Q70 61 74 57" stroke="#00D4FF" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M56 63 Q60 66 64 63" stroke="#00D4FF" strokeWidth="2.2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M46 56 Q50 51 54 56" stroke="#00D4FF" strokeWidth="3" strokeLinecap="round" />
          <path d="M66 56 Q70 51 74 56" stroke="#00D4FF" strokeWidth="3" strokeLinecap="round" />
          <path d="M55 62 Q60 66 65 62" stroke="#FFD426" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {/* Shield Chest Core */}
      <path
        d="M44 79 L60 74 L76 79 L76 92 C76 100 69 105 60 108 C51 105 44 100 44 92 Z"
        fill="url(#sgShieldGrad)"
      />
      <rect x="55" y="87" width="10" height="9" rx="2" fill="#061233" />
      <path d="M57 87 V84 A3 3 0 0 1 63 84 V87" stroke="#FFD426" strokeWidth="2" />
    </svg>
  );
}

export function ProgressRing({
  percent,
  size = 56,
  color = '#00D4FF',
}: {
  percent: number;
  size?: number;
  color?: string;
}) {
  const strokeWidth = 5;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c - (clamped / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-semibold tabular-nums">{Math.round(clamped)}%</span>
    </div>
  );
}

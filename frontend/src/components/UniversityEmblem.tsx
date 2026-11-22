import React, { useId } from 'react';

export interface UniversityEmblemProps {
  className?: string;
  size?: number;
  variant?: 'full' | 'shield' | 'seal' | 'wordmark' | 'gold' | 'monochrome';
  /**
   * Controls structural ink color of the pediment, outer columns, and plinth:
   * - `auto` (default): uses `currentColor` to adapt to light/dark surfaces automatically
   * - `dark`: crisp `#FFFFFF` ink for dark badges and dark-surface watermarks
   * - `light`: deep `#161821` obsidian ink for white paper and light surfaces
   */
  tone?: 'auto' | 'dark' | 'light';
}

export const UniversityEmblem: React.FC<UniversityEmblemProps> = ({
  className = '',
  size = 40,
  variant = 'full',
  tone = 'auto',
}) => {
  const rawId = useId();
  const gradId = `dt-rotunda-${rawId.replace(/:/g, '')}`;

  const isMono = variant === 'monochrome';
  const isSeal = variant === 'seal';
  const resolvedTone = tone === 'auto' && variant === 'gold' ? 'dark' : tone;

  const archInk = isMono
    ? 'currentColor'
    : resolvedTone === 'dark'
      ? '#FFFFFF'
      : resolvedTone === 'light'
        ? '#161821'
        : 'currentColor';

  const accentFill = isMono ? 'currentColor' : `url(#${gradId})`;
  const accentOpacity = isMono ? 0.55 : 1;

  if (variant === 'wordmark') {
    return (
      <div className={`inline-flex items-center space-x-3.5 select-none ${className}`}>
        <UniversityEmblem size={size} variant="full" tone={tone} />
        <div className="flex flex-col">
          <span className="font-heading font-bold tracking-tight uppercase text-base sm:text-lg leading-none text-[#161821] dark:text-[#FFFFFF]">
            DemoTech
          </span>
          <span className="text-[10px] sm:text-[11px] font-heading uppercase tracking-[0.22em] text-[#166534] dark:text-[#45d320] font-semibold mt-1">
            University
          </span>
          <span className="text-[8px] sm:text-[9px] font-sans tracking-widest text-[#475569] dark:text-[#94a3b8] uppercase mt-0.5">
            Veritas • Scientia • Innovatio
          </span>
        </div>
      </div>
    );
  }

  const rotundaMark = (
    <>
      {/* Modernist Pediment Chevron */}
      <path
        d="M20 44 L60 20 L100 44"
        stroke={archInk}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Luminous Keystone Beacon Under Apex */}
      <circle cx="60" cy="36.5" r="5.5" fill={accentFill} fillOpacity={accentOpacity} />

      {/* Three Rounded Architectural Pill Columns */}
      <rect x="24" y="54" width="15" height="35" rx="7.5" fill={archInk} />
      <rect
        x="52.5"
        y="46.5"
        width="15"
        height="42.5"
        rx="7.5"
        fill={accentFill}
        fillOpacity={accentOpacity}
      />
      <rect x="81" y="54" width="15" height="35" rx="7.5" fill={archInk} />

      {/* Unified Foundation Plinth with Emerald Center Inlay */}
      <rect x="17" y="96" width="86" height="10" rx="5" fill={archInk} />
      <rect
        x="47"
        y="96"
        width="26"
        height="10"
        rx="5"
        fill={accentFill}
        fillOpacity={accentOpacity}
      />
    </>
  );

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`shrink-0 ${className}`.trim()}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="DemoTech University Emblem"
    >
      {!isMono && (
        <defs>
          <linearGradient
            id={gradId}
            x1="52"
            y1="30"
            x2="68"
            y2="106"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#63ec41" />
            <stop offset="55%" stopColor="#33b712" />
            <stop offset="100%" stopColor={resolvedTone === 'dark' ? '#33b712' : '#27960d'} />
          </linearGradient>
        </defs>
      )}

      {isSeal ? (
        <>
          {/* Official Circular Stamp Rings */}
          <circle cx="60" cy="60" r="56" stroke={archInk} strokeWidth="2.4" strokeOpacity="0.85" />
          <circle
            cx="60"
            cy="60"
            r="49.5"
            stroke={accentFill}
            strokeWidth="1.6"
            strokeDasharray="2.5 3.5"
            strokeOpacity={isMono ? 0.65 : 0.9}
          />
          <circle cx="60" cy="4" r="2.2" fill={accentFill} fillOpacity={accentOpacity} />
          <circle cx="60" cy="116" r="2.2" fill={accentFill} fillOpacity={accentOpacity} />
          <circle cx="4" cy="60" r="2.2" fill={accentFill} fillOpacity={accentOpacity} />
          <circle cx="116" cy="60" r="2.2" fill={accentFill} fillOpacity={accentOpacity} />
          <g transform="translate(21 20) scale(0.65)">{rotundaMark}</g>
        </>
      ) : (
        rotundaMark
      )}
    </svg>
  );
};

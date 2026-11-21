import React from 'react';

export interface UniversityEmblemProps {
  className?: string;
  size?: number;
  variant?: 'full' | 'shield' | 'seal' | 'wordmark' | 'gold' | 'monochrome';
}

export const UniversityEmblem: React.FC<UniversityEmblemProps> = ({
  className = 'w-10 h-10',
  size = 40,
  variant = 'full',
}) => {
  const isMono = variant === 'monochrome';
  const strokeRim = isMono ? 'currentColor' : '#33b712';
  const fillGreen = isMono ? 'currentColor' : '#33b712';
  const fillGreenLight = isMono ? 'currentColor' : '#63ec41';
  const fillAccent = isMono ? 'currentColor' : '#45d320';

  if (variant === 'wordmark') {
    return (
      <div className={`inline-flex items-center space-x-3.5 select-none ${className}`}>
        <UniversityEmblem size={size} variant="full" />
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

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="DemoTech University Official Seal"
    >
      <defs>
        {/* Innopolis vibrant green gradient */}
        <radialGradient id="innoGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#63ec41" />
          <stop offset="100%" stopColor="#33b712" />
        </radialGradient>
        <linearGradient id="innoTechLinear" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#63ec41" />
          <stop offset="50%" stopColor="#45d320" />
          <stop offset="100%" stopColor="#27960d" />
        </linearGradient>
        <linearGradient id="innoDarkLinear" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a2e3d" />
          <stop offset="100%" stopColor="#161821" />
        </linearGradient>
        {/* Text path for circular inscription */}
        <path id="sealTextPathTop" d="M 18,60 A 42,42 0 1,1 102,60" fill="none" />
        <path id="sealTextPathBottom" d="M 102,60 A 42,42 0 0,1 18,60" fill="none" />
      </defs>

      {/* 1. Outer Fine Tech Rings */}
      <circle cx="60" cy="60" r="58" stroke={strokeRim} strokeWidth="1.2" opacity="0.4" />
      <circle
        cx="60"
        cy="60"
        r="54"
        stroke={strokeRim}
        strokeWidth="1"
        strokeDasharray="2 3"
        opacity="0.8"
      />
      <circle cx="60" cy="60" r="47" stroke={strokeRim} strokeWidth="1.2" />

      {/* 2. Circular Latin Inscription in primary sans */}
      <text
        fill={fillGreen}
        fontSize="5"
        fontWeight="700"
        letterSpacing="0.16em"
        fontFamily="var(--font-heading)"
      >
        <textPath href="#sealTextPathTop" startOffset="50%" textAnchor="middle">
          UNIVERSITAS DEMOTECHNICA
        </textPath>
      </text>
      <text
        fill={fillGreen}
        fontSize="4.6"
        fontWeight="600"
        letterSpacing="0.2em"
        fontFamily="var(--font-heading)"
      >
        <textPath href="#sealTextPathBottom" startOffset="50%" textAnchor="middle">
          • ANNO MMXXVI •
        </textPath>
      </text>

      {/* 3. Central Modern Geometric Tech Shield */}
      <path
        d="M 60,26 L 86,38 L 86,66 C 86,82 74,94 60,100 C 46,94 34,82 34,66 L 34,38 Z"
        fill="url(#innoDarkLinear)"
        stroke={fillGreen}
        strokeWidth="2"
      />

      {/* 4. Dynamic Tech Polygons & Innovation Diamond */}
      <path
        d="M 60,34 L 80,48 L 60,62 L 40,48 Z"
        fill="url(#innoGrad)"
        opacity="0.95"
      />
      <path
        d="M 60,66 L 78,54 L 78,74 C 78,84 70,91 60,95 Z"
        fill={fillGreenLight}
        opacity="0.85"
      />
      <path
        d="M 60,66 L 42,54 L 42,74 C 42,84 50,91 60,95 Z"
        fill={fillAccent}
        opacity="0.7"
      />

      {/* Central Core Star / Tech Node */}
      <circle cx="60" cy="48" r="3.5" fill="#ffffff" />
      <circle cx="60" cy="48" r="6" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
    </svg>
  );
};

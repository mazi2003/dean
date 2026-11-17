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
  const isGold = variant === 'gold';

  const strokeRim = isMono ? 'currentColor' : isGold ? '#D8BD8A' : '#C4A46B';
  const fillShield = isMono ? 'currentColor' : isGold ? '#C4A46B' : '#183D35';
  const fillShieldDark = isMono ? 'currentColor' : isGold ? '#B39155' : '#102923';
  const fillGold = isMono ? 'currentColor' : '#C4A46B';
  const fillGoldBright = isMono ? 'currentColor' : '#DFBF82';
  const fillParchment = isMono ? 'currentColor' : '#F3EFE5';
  const fillCrimson = isMono ? 'currentColor' : '#A33D35';

  if (variant === 'wordmark') {
    return (
      <div className={`inline-flex items-center space-x-3.5 select-none ${className}`}>
        <UniversityEmblem size={size} variant="full" />
        <div className="flex flex-col">
          <span className="font-serif font-extrabold tracking-wider uppercase text-base sm:text-lg leading-none text-[#F3EFE5] drop-shadow-xs" style={{ fontFamily: "'Cinzel', 'Crimson Pro', Georgia, serif" }}>
            DemoTech
          </span>
          <span className="text-[10px] sm:text-[11px] font-sans uppercase tracking-[0.22em] text-[#C4A46B] font-semibold mt-1">
            University
          </span>
          <span className="text-[8px] sm:text-[9px] font-sans tracking-widest text-[#F3EFE5]/65 uppercase mt-0.5">
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
        {/* Subtle radial gradient for shield */}
        <radialGradient id="shieldGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#23554A" />
          <stop offset="100%" stopColor={fillShieldDark} />
        </radialGradient>
        {/* Gold linear gradient */}
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E2C997" />
          <stop offset="50%" stopColor="#C4A46B" />
          <stop offset="100%" stopColor="#967941" />
        </linearGradient>
        {/* Text path for circular inscription */}
        <path
          id="sealTextPathTop"
          d="M 18,60 A 42,42 0 1,1 102,60"
          fill="none"
        />
        <path
          id="sealTextPathBottom"
          d="M 102,60 A 42,42 0 0,1 18,60"
          fill="none"
        />
      </defs>

      {/* 1. Outer Fine Guilloche / Concentric Rings */}
      <circle cx="60" cy="60" r="58" stroke={strokeRim} strokeWidth="1.2" />
      <circle cx="60" cy="60" r="55" stroke={strokeRim} strokeWidth="0.8" strokeDasharray="1.5 2" opacity="0.8" />
      <circle cx="60" cy="60" r="47" stroke={strokeRim} strokeWidth="1.2" />

      {/* 2. Circular Latin Inscription (Oxford / ETH style authentic lettering) */}
      <text fill={fillGold} fontSize="5.2" fontWeight="700" letterSpacing="0.2em" style={{ fontFamily: "'Cinzel', 'Crimson Pro', Georgia, serif" }}>
        <textPath href="#sealTextPathTop" startOffset="50%" textAnchor="middle">
          UNIVERSITAS DEMOTECHNICA
        </textPath>
      </text>
      <text fill={fillGold} fontSize="4.8" fontWeight="600" letterSpacing="0.24em" style={{ fontFamily: "'Cinzel', 'Crimson Pro', Georgia, serif" }}>
        <textPath href="#sealTextPathBottom" startOffset="50%" textAnchor="middle">
          • MMXXVI • VERITAS •
        </textPath>
      </text>

      {/* 3. Star Accents on Outer Band */}
      <circle cx="16" cy="60" r="1.5" fill={fillGold} />
      <circle cx="104" cy="60" r="1.5" fill={fillGold} />

      {/* 4. Classical Academic Shield (Central Escutcheon) */}
      <path
        d="M60 19 L88 32 V62 C88 80 75 94 60 101 C45 94 32 80 32 62 V32 L60 19 Z"
        fill="url(#shieldGrad)"
        stroke={strokeRim}
        strokeWidth="1.6"
      />

      {/* Shield Inner Inset Line */}
      <path
        d="M60 22 L85 34 V61 C85 77 73 90 60 97 C47 90 35 77 35 61 V34 L60 22 Z"
        stroke={fillGold}
        strokeWidth="0.6"
        strokeDasharray="2 1.5"
        opacity="0.65"
      />

      {/* 5. Guiding 8-pointed Polaris / Beacon Star (Apex of Truth) */}
      <g transform="translate(60, 29)">
        {/* Radiating beacon rays */}
        <line x1="0" y1="-5.5" x2="0" y2="5.5" stroke={fillGoldBright} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="-5.5" y1="0" x2="5.5" y2="0" stroke={fillGoldBright} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke={fillGoldBright} strokeWidth="0.8" strokeLinecap="round" />
        <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke={fillGoldBright} strokeWidth="0.8" strokeLinecap="round" />
        <circle cx="0" cy="0" r="1.2" fill="#FFFFFF" />
      </g>

      {/* 6. Classical Tripartite Colonnade Portico (Pillars of Science & Knowledge) */}
      {/* Triangular Gable Pediment */}
      <path
        d="M44 41 L60 34 L76 41 Z"
        fill="url(#goldGrad)"
      />
      {/* Entablature Architrave */}
      <rect x="43" y="42" width="34" height="2" rx="0.5" fill={fillParchment} />

      {/* Three Classical Columns (Humanitas, Scientia, Technologia) */}
      <g fill={fillParchment}>
        {/* Left Column */}
        <rect x="47" y="45.5" width="4" height="13" rx="0.5" />
        <rect x="46" y="44.5" width="6" height="1.2" rx="0.3" fill={fillGold} />
        <rect x="46" y="58" width="6" height="1.2" rx="0.3" fill={fillGold} />

        {/* Center Column */}
        <rect x="58" y="45.5" width="4" height="13" rx="0.5" />
        <rect x="57" y="44.5" width="6" height="1.2" rx="0.3" fill={fillGold} />
        <rect x="57" y="58" width="6" height="1.2" rx="0.3" fill={fillGold} />

        {/* Right Column */}
        <rect x="69" y="45.5" width="4" height="13" rx="0.5" />
        <rect x="68" y="44.5" width="6" height="1.2" rx="0.3" fill={fillGold} />
        <rect x="68" y="58" width="6" height="1.2" rx="0.3" fill={fillGold} />
      </g>

      {/* Stylobate / Base Plinth */}
      <rect x="42" y="60" width="36" height="2.2" rx="0.5" fill="url(#goldGrad)" />

      {/* 7. Open Academic Illuminated Codex / Book of Science (Oxford heritage) */}
      <g>
        {/* Book Pages */}
        <path
          d="M42 66 C50 64 56 66 60 69 C64 66 70 64 78 66 V76 C70 74 64 76 60 79 C56 76 50 74 42 76 V66 Z"
          fill={fillParchment}
          stroke={strokeRim}
          strokeWidth="0.8"
        />
        {/* Spine line */}
        <line x1="60" y1="69" x2="60" y2="79" stroke={fillShield} strokeWidth="1.2" />
        {/* Illuminated text lines on pages */}
        <line x1="46" y1="68" x2="55" y2="69.5" stroke={fillShield} strokeWidth="0.7" opacity="0.65" />
        <line x1="46" y1="71" x2="55" y2="72.5" stroke={fillShield} strokeWidth="0.7" opacity="0.65" />
        <line x1="46" y1="74" x2="53" y2="75" stroke={fillShield} strokeWidth="0.7" opacity="0.65" />
        <line x1="65" y1="69.5" x2="74" y2="68" stroke={fillShield} strokeWidth="0.7" opacity="0.65" />
        <line x1="65" y1="72.5" x2="74" y2="71" stroke={fillShield} strokeWidth="0.7" opacity="0.65" />
        <line x1="67" y1="75" x2="74" y2="74" stroke={fillShield} strokeWidth="0.7" opacity="0.65" />
      </g>

      {/* 8. Latin Motto Ribbon / Scroll */}
      <g transform="translate(60, 88)">
        <path
          d="M-22 -3 C-10 -5 10 -5 22 -3 L20 3 C10 1 -10 1 -20 3 Z"
          fill={fillParchment}
          stroke={strokeRim}
          strokeWidth="0.6"
        />
        <text
          x="0"
          y="0.5"
          fill={fillShield}
          fontSize="3.2"
          fontWeight="700"
          textAnchor="middle"
          letterSpacing="0.1em"
          style={{ fontFamily: "'Cinzel', Georgia, serif" }}
        >
          SCIENTIA
        </text>
      </g>
    </svg>
  );
};

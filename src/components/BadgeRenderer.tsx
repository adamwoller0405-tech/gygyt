/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId } from 'react';
import { UserRank } from '../types';

interface BadgeProps {
  rank: UserRank;
  size?: number; // Size in pixels
  className?: string;
  showTooltip?: boolean;
}

export const BadgeRenderer: React.FC<BadgeProps> = ({
  rank,
  size = 64,
  className = '',
  showTooltip = false
}) => {
  const uniqueId = useId();
  // Define visual parameters based on rank
  let badgeTitle = 'Tag';
  let badgeColorLabel = 'Rang';
  
  // Gradients and glow effects
  let filterId = `glow-${rank}-${uniqueId}`;
  let bgGradId = `bgGrad-${rank}-${uniqueId}`;
  let borderGradId = `borderGrad-${rank}-${uniqueId}`;
  let textPathId = `textPath-${rank}-${uniqueId}`;

  let baseColor1 = '#4b5563'; // Custom base grey
  let baseColor2 = '#1f2937';
  let strokeColor = '#f97316'; // GYGYT orange
  let hasGlow = false;
  let hasRotator = false;

  switch (rank) {
    case UserRank.ADMIN:
      badgeTitle = 'Adminisztrátor';
      badgeColorLabel = 'Szuper-Obszidián Izzás';
      baseColor1 = '#090d16';
      baseColor2 = '#111827';
      strokeColor = '#f97316'; // Neon orange
      hasGlow = true;
      hasRotator = true;
      break;
    case UserRank.ELITE:
      badgeTitle = 'Elite';
      badgeColorLabel = 'Obszidián Izzás';
      baseColor1 = '#18181b';
      baseColor2 = '#09090b';
      strokeColor = '#ea580c';
      hasGlow = true;
      hasRotator = true;
      break;
    case UserRank.CHAMPION:
      badgeTitle = 'Bajnok (Champion)';
      badgeColorLabel = 'Platina Prémium';
      baseColor1 = '#334155';
      baseColor2 = '#1e293b';
      strokeColor = '#e2e8f0'; // Chrome/Platinum styling
      hasGlow = true;
      break;
    case UserRank.DIAMOND:
      badgeTitle = 'Gyémánt (Diamond)';
      badgeColorLabel = 'Gyémánt Kristály';
      baseColor1 = '#0ea5e9';
      baseColor2 = '#1e40af';
      strokeColor = '#38bdf8';
      break;
    case UserRank.GOLD:
      badgeTitle = 'Arany (Gold)';
      badgeColorLabel = 'Arany Fémes';
      baseColor1 = '#eab308';
      baseColor2 = '#854d0e';
      strokeColor = '#fef08a';
      break;
    case UserRank.SILVER:
      badgeTitle = 'Ezüst (Silver)';
      badgeColorLabel = 'Ezüst Fémes';
      baseColor1 = '#cbd5e1';
      baseColor2 = '#475569';
      strokeColor = '#f1f5f9';
      break;
    case UserRank.BRONZE:
      badgeTitle = 'Bronz (Bronze)';
      badgeColorLabel = 'Bronz Fémes';
      baseColor1 = '#b45309';
      baseColor2 = '#78350f';
      strokeColor = '#ca8a04';
      break;
  }

  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none group ${className}`} 
      style={{ width: size, height: size }}
      title={showTooltip ? undefined : `${badgeTitle} (${badgeColorLabel})`}
    >
      {/* Background glow for Admin/Elite/Champion */}
      {hasGlow && (
        <div 
          className="absolute inset-0 rounded-full opacity-60 blur-md transition-all duration-1000 group-hover:opacity-100 group-hover:blur-lg"
          style={{
            background: `radial-gradient(circle, ${strokeColor}77 0%, transparent 70%)`
          }}
        />
      )}

      {/* Rotating outer orbit for Admin/Elite */}
      {hasRotator && (
        <svg 
          className="absolute inset-[-4px] animate-[spin_10s_linear_infinite]"
          viewBox="0 0 100 100" 
          fill="none"
        >
          <circle 
            cx="50" 
            cy="50" 
            r="48" 
            stroke={strokeColor} 
            strokeWidth="1.5" 
            strokeDasharray="8,6,2,6" 
            className="opacity-70"
          />
        </svg>
      )}

      {/* Main SVG Badge */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        className="relative z-10 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Main Gradient Background */}
          <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={baseColor1} />
            <stop offset="60%" stopColor={baseColor2} />
            <stop offset="100%" stopColor="#030712" />
          </linearGradient>

          {/* Border Gradient styling */}
          <linearGradient id={borderGradId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" /> {/* Mud/amber base */}
            <stop offset="30%" stopColor={strokeColor} />
            <stop offset="70%" stopColor="#f97316" /> {/* GYGYT premium orange */}
            <stop offset="100%" stopColor="#ffedd5" />
          </linearGradient>

          {/* Shadow Filter */}
          <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.5"/>
          </filter>
        </defs>

        {/* Circular Base (Grey base as request, customized gradients per rank overlayed) */}
        <circle
          cx="50"
          cy="50"
          r="44"
          fill={`url(#${bgGradId})`}
          stroke={`url(#${borderGradId})`}
          strokeWidth="3.5"
          filter={`url(#${filterId})`}
        />

        {/* Subtle Inner Rim */}
        <circle
          cx="50"
          cy="50"
          r="39"
          fill="none"
          stroke="#000000"
          strokeWidth="1"
          strokeOpacity="0.3"
        />

        {/* Text curve helper path (invisible) */}
        <path
          id={textPathId}
          d="M 18,50 A 32,32 0 1,1 82,50"
          fill="none"
        />

        {/* Curved GYGYT Text (Orange as requested) */}
        <text className="font-sans font-extrabold text-[12.5px] tracking-[4px]" fill="#f97316">
          <textPath 
            href={`#${textPathId}`}
            startOffset="50%" 
            textAnchor="middle"
          >
            GYGYT
          </textPath>
        </text>

        {/* Center bicycle icon + Rank highlights */}
        <g transform="translate(30, 42) scale(0.85)">
          {/* Black & Orange bicycle icon */}
          {/* Left Wheel */}
          <circle cx="10" cy="22" r="7.5" fill="none" stroke="#222" strokeWidth="2.5" />
          <circle cx="10" cy="22" r="5" fill="none" stroke="#f97316" strokeWidth="1" />
          {/* Right Wheel */}
          <circle cx="36" cy="22" r="7.5" fill="none" stroke="#222" strokeWidth="2.5" />
          <circle cx="36" cy="22" r="5" fill="none" stroke="#f97316" strokeWidth="1" />
          
          {/* Frame structure (Black and Orange steel tubes) */}
          {/* Bottom bracket to rear hub */}
          <line x1="22" y1="22" x2="10" y2="22" stroke="#222" strokeWidth="2" />
          {/* Rear hub to seat */}
          <line x1="10" y1="22" x2="18" y2="8" stroke="#f97316" strokeWidth="2.5" />
          {/* Bottom bracket to seat */}
          <line x1="22" y1="22" x2="18" y2="8" stroke="#222" strokeWidth="2.5" />
          {/* Bottom bracket to head tube */}
          <line x1="22" y1="22" x2="31" y2="8" stroke="#f97316" strokeWidth="2.5" />
          {/* Seat to head tube */}
          <line x1="18" y1="8" x2="31" y2="8" stroke="#222" strokeWidth="2" />
          {/* Head tube to front fork */}
          <line x1="31" y1="8" x2="36" y2="22" stroke="#f97316" strokeWidth="2.5" />
          {/* Handlebars */}
          <line x1="31" y1="8" x2="28" y2="3" stroke="#222" strokeWidth="2" />
          <line x1="28" y1="3" x2="33" y2="3" stroke="#222" strokeWidth="2" />
          {/* Saddle */}
          <line x1="15" y1="6" x2="21" y2="6" stroke="#222" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Rank Badge Additions / Crystals / Ornaments */}
        {rank === UserRank.ADMIN && (
          // Admin Crown / Super symbol
          <g transform="translate(42, 18) scale(0.65)">
            <polygon points="12,1 18,9 23,2 24,11 0,11" fill="#ea580c" />
            <circle cx="12" cy="0" r="1.5" fill="#fef08a" />
            <circle cx="23" cy="1" r="1.5" fill="#fef08a" />
            <circle cx="1" cy="0" r="1.5" fill="#fef08a" />
          </g>
        )}
        
        {rank === UserRank.ELITE && (
          // Elite Double Chevron / Glowing Star
          <g transform="translate(44, 18) scale(0.7)">
            <polygon points="8,0 11,6 16,8 11,10 8,16 5,10 0,8 5,6" fill="#f97316" className="animate-pulse" />
          </g>
        )}

        {rank === UserRank.CHAMPION && (
          // Champion laurel branches
          <g transform="translate(42, 18) scale(0.8)">
            <polygon points="5,0 10,12 0,12" fill="#cbd5e1" />
          </g>
        )}

        {rank === UserRank.DIAMOND && (
          // Diamond crystal shape
          <g transform="translate(45, 17) scale(0.65)" fill="#38bdf8">
            <polygon points="7,0 14,7 7,14 0,7" />
          </g>
        )}

        {rank === UserRank.GOLD && (
          // Gold Circle Accent
          <g transform="translate(47, 19) scale(0.7)" fill="#facc15">
            <circle cx="4" cy="4" r="3" />
          </g>
        )}
      </svg>

      {/* Detail Overlay Tooltip built-in */}
      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-gray-900 border border-orange-500/30 text-white rounded-lg p-3 text-center text-xs shadow-2xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <p className="font-bold text-orange-400">{badgeTitle}</p>
          <div className="w-12 h-[1px] bg-orange-500/30 my-1 mx-auto" />
          <p className="text-[10px] text-gray-400">{badgeColorLabel} téma alapozású, körkörös GYGYT design.</p>
        </div>
      )}
    </div>
  );
};

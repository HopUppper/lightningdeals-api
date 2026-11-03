/**
 * src/components/brand/OrbitIcon.tsx
 *
 * Official Orbit Brand Mark and Icon Component.
 * Features an elegant orbital rings vector icon with a central core and orbiting nodes.
 */

import React from 'react';

interface OrbitIconProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const OrbitIcon: React.FC<OrbitIconProps> = ({
  className = 'w-5 h-5 text-violet-500',
  size = 20,
  glow = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? 'filter drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]' : ''}`}
    >
      {/* Central Core Nucleus */}
      <circle cx="12" cy="12" r="3" fill="currentColor" />

      {/* Primary Tilted Orbital Ring */}
      <ellipse
        cx="12"
        cy="12"
        rx="9.5"
        ry="4.5"
        transform="rotate(-28 12 12)"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="1 0"
        opacity="0.85"
      />

      {/* Secondary Opposing Orbital Ring */}
      <ellipse
        cx="12"
        cy="12"
        rx="9.5"
        ry="4.5"
        transform="rotate(32 12 12)"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="1 0"
        opacity="0.5"
      />

      {/* Orbiting Satellite Node 1 */}
      <circle cx="19.2" cy="8.2" r="1.3" fill="currentColor" />

      {/* Orbiting Satellite Node 2 */}
      <circle cx="4.8" cy="15.8" r="1.1" fill="currentColor" opacity="0.9" />
    </svg>
  );
};

export const OrbitBrandBadge: React.FC<{ className?: string; subtitle?: boolean }> = ({
  className = '',
  subtitle = true,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="w-8 h-8 rounded-xl bg-violet-600/10 dark:bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shadow-xs">
        <OrbitIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" size={18} glow />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white">Orbit</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/20">
            Workspace
          </span>
        </div>
        {subtitle && (
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
            Powered by LightningAPI
          </p>
        )}
      </div>
    </div>
  );
};

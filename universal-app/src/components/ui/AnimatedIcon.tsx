import React from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface AnimatedIconProps {
  className?: string;
  onClick?: () => void;
  pulse?: boolean;
  hoverColor?: string;
  rotate?: boolean;
  active?: boolean;
  filledColor?: string;
  children: React.ReactNode;
}

export function AnimatedIcon({
  className = '',
  onClick,
  pulse,
  hoverColor,
  rotate,
  active,
  filledColor,
  children,
}: AnimatedIconProps) {
  const reduceMotion = usePrefersReducedMotion();
  return (
    <span
      onClick={onClick}
      className={`p-3 rounded-full inline-flex items-center justify-center transition-transform duration-300 ease-in-out focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-amber-500 cursor-default ${className} ${active ? 'scale-105 shadow-xl' : ''}`}
      style={{
        animation: reduceMotion ? undefined : pulse ? 'pulse-slow 3s ease-in-out infinite' : undefined,
        filter: hoverColor ? `drop-shadow(0 0 6px ${hoverColor})` : undefined,
        color: filledColor,
      }}
      aria-label="icon action"
    >
      <span
        className={`inline-flex items-center justify-center transition-all duration-300 ${!reduceMotion && rotate ? 'hover:rotate-12' : ''}`}
      >
        {children}
      </span>
    </span>
  );
}

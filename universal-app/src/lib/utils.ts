import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert hex color to rgba for runtime styling (e.g., theme soft backgrounds)
export function hexToRgba(hex: string, alpha = 1) {
  const sanitized = hex.replace('#', '');
  if (sanitized.length !== 6) return hex;
  const num = parseInt(sanitized, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

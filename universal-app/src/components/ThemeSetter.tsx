'use client';

import { useLayoutEffect } from 'react';
import { useDemo } from '@/context/DemoContext';
import { hexToRgba } from '@/lib/utils';

export function ThemeSetter() {
  const { config } = useDemo();

  useLayoutEffect(() => {
    const root = document.documentElement;
    
    // Primary theme colors
    root.style.setProperty('--primary', config.theme.primary);
    root.style.setProperty('--accent', config.theme.accent);
    root.style.setProperty('--brand-gradient', config.theme.gradient);
    
    // Soft/transparent variations for backgrounds and hover states
    root.style.setProperty('--primary-soft', hexToRgba(config.theme.primary, 0.12));
    root.style.setProperty('--primary-softer', hexToRgba(config.theme.primary, 0.06));
    root.style.setProperty('--accent-soft', hexToRgba(config.theme.accent, 0.12));
    root.style.setProperty('--accent-softer', hexToRgba(config.theme.accent, 0.06));
    
    // Login page specific tokens
    root.style.setProperty('--login-panel-bg', hexToRgba(config.theme.primary, 0.25));
    root.style.setProperty('--login-panel-border', hexToRgba(config.theme.primary, 0.55));
    root.style.setProperty('--login-muted-text', hexToRgba(config.theme.primary, 0.65));
    root.style.setProperty('--login-focus-ring', hexToRgba(config.theme.accent, 0.85));
    
    // Card and interaction states
    root.style.setProperty('--card-border', hexToRgba(config.theme.primary, 0.15));
    root.style.setProperty('--card-hover-border', hexToRgba(config.theme.accent, 0.3));
    root.style.setProperty('--card-shadow', hexToRgba(config.theme.primary, 0.1));
    
    // Button and badge tokens
    root.style.setProperty('--button-primary-bg', config.theme.primary);
    root.style.setProperty('--button-primary-hover', hexToRgba(config.theme.primary, 0.9));
    root.style.setProperty('--badge-bg', hexToRgba(config.theme.accent, 0.15));
    root.style.setProperty('--badge-text', config.theme.primary);
  }, [config]);

  return null;
}

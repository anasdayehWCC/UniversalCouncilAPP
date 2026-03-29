'use client';

/**
 * Theme Toggle Component
 * 
 * A button that allows users to switch between light, dark, and system color modes.
 * Integrates with ThemeProvider for global theme state management.
 * 
 * @module components/ThemeToggle
 */

import { useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useColorMode } from '@/hooks/useTheme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================================================
// Types
// ============================================================================

type ColorMode = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  /** Compact mode - just shows icon, no dropdown */
  compact?: boolean;
  /** Custom className */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Show label next to icon */
  showLabel?: boolean;
}

// ============================================================================
// Theme Mode Options
// ============================================================================

const THEME_OPTIONS: Array<{ value: ColorMode; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

// ============================================================================
// Component
// ============================================================================

export function ThemeToggle({
  compact = false,
  className,
  size = 'default',
  showLabel = false,
}: ThemeToggleProps) {
  // Track hydration to prevent SSR mismatch without a state-setting effect
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const { colorMode, resolvedColorMode, setColorMode, toggleColorMode } = useColorMode();

  // Handle mode change
  const handleModeChange = (mode: ColorMode) => {
    setColorMode(mode);
  };

  // Quick toggle between light/dark
  const handleQuickToggle = () => {
    toggleColorMode();
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <Button
        variant="ghost"
        size={size === 'sm' ? 'sm' : 'icon'}
        className={cn('text-muted-foreground', className)}
        aria-label="Toggle theme"
        disabled
      >
        <Sun className={cn(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
      </Button>
    );
  }

  const CurrentIcon = resolvedColorMode === 'dark' ? Moon : Sun;
  const currentOption = THEME_OPTIONS.find(o => o.value === colorMode);

  // Compact mode - just a toggle button
  if (compact) {
    return (
      <Button
        variant="ghost"
        size={size === 'sm' ? 'sm' : 'icon'}
        onClick={handleQuickToggle}
        className={cn(
          'text-muted-foreground hover:text-foreground transition-colors',
          className
        )}
        aria-label={`Switch to ${resolvedColorMode === 'dark' ? 'light' : 'dark'} mode`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={resolvedColorMode}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <CurrentIcon className={cn(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
          </motion.div>
        </AnimatePresence>
      </Button>
    );
  }

  // Full dropdown mode
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size === 'sm' ? 'sm' : 'icon'}
          className={cn(
            'text-muted-foreground hover:text-foreground transition-colors',
            showLabel && 'gap-2 px-3',
            className
          )}
          aria-label="Choose theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={resolvedColorMode}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <CurrentIcon className={cn(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
            </motion.div>
          </AnimatePresence>
          {showLabel && (
            <span className="text-sm font-medium">
              {currentOption?.label}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = colorMode === option.value;
          
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleModeChange(option.value)}
              className={cn(
                'cursor-pointer gap-2',
                isActive && 'bg-muted'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{option.label}</span>
              {isActive && <Check className="w-4 h-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default ThemeToggle;

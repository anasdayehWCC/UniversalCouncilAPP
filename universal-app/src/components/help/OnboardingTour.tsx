'use client';

/**
 * OnboardingTour Component
 *
 * Step-by-step interactive tour for new users with spotlight effects,
 * progress tracking, and keyboard navigation support.
 *
 * @module components/help/OnboardingTour
 */

import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface TourStep {
  /** Unique step identifier */
  id: string;
  /** CSS selector for target element to highlight */
  target?: string;
  /** Title of this step */
  title: string;
  /** Step description/instructions */
  content: React.ReactNode;
  /** Position of the tooltip relative to target */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Whether to highlight the target element */
  spotlight?: boolean;
  /** Action to perform when step is shown */
  onEnter?: () => void;
  /** Action to perform when leaving step */
  onExit?: () => void;
  /** Custom next button text */
  nextLabel?: string;
  /** Custom back button text */
  backLabel?: string;
  /** Disable back button for this step */
  disableBack?: boolean;
}

export interface OnboardingTourProps {
  /** Tour steps to display */
  steps: TourStep[];
  /** Whether tour is currently active */
  isActive: boolean;
  /** Called when tour is completed */
  onComplete: () => void;
  /** Called when tour is skipped */
  onSkip: () => void;
  /** Called when current step changes */
  onStepChange?: (stepIndex: number) => void;
  /** Starting step index */
  initialStep?: number;
  /** Allow closing with ESC key */
  allowEscapeClose?: boolean;
  /** Show progress indicator */
  showProgress?: boolean;
  /** Custom overlay opacity (0-1) */
  overlayOpacity?: number;
  /** Z-index for tour elements */
  zIndex?: number;
  /** Class name for tour container */
  className?: string;
}

// ============================================================================
// Spotlight Overlay
// ============================================================================

interface SpotlightOverlayProps {
  targetRect: DOMRect | null;
  opacity: number;
  zIndex: number;
  onClick?: () => void;
}

function SpotlightOverlay({
  targetRect,
  opacity,
  zIndex,
  onClick,
}: SpotlightOverlayProps) {
  const padding = 8;

  return (
    <div
      className="fixed inset-0 pointer-events-auto"
      style={{ zIndex }}
      onClick={onClick}
    >
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={`rgba(0, 0, 0, ${opacity})`}
          mask="url(#spotlight-mask)"
        />
      </svg>
    </div>
  );
}

// ============================================================================
// Tour Card Component
// ============================================================================

interface TourCardProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  showProgress: boolean;
  position: { x: number; y: number };
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  zIndex: number;
}

function TourCard({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onBack,
  onSkip,
  showProgress,
  position,
  placement,
  zIndex,
}: TourCardProps) {
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;

  // Animation variants based on placement
  const getAnimationOrigin = () => {
    switch (placement) {
      case 'top':
        return { y: 10 };
      case 'bottom':
        return { y: -10 };
      case 'left':
        return { x: 10 };
      case 'right':
        return { x: -10 };
      default:
        return { scale: 0.95 };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...getAnimationOrigin() }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, ...getAnimationOrigin() }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'fixed w-80 max-w-[calc(100vw-2rem)]',
        'bg-card dark:bg-card rounded-xl shadow-2xl',
        'border border-border dark:border-border',
        'overflow-hidden'
      )}
      style={{
        left: position.x,
        top: position.y,
        zIndex: zIndex + 2,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div>
          <h3 className="font-semibold text-foreground dark:text-foreground">
            {step.title}
          </h3>
          {showProgress && (
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
              Step {stepIndex + 1} of {totalSteps}
            </p>
          )}
        </div>
        <button
          onClick={onSkip}
          className={cn(
            'p-1 -mr-1 -mt-1 rounded-md transition-colors',
            'text-muted-foreground hover:text-foreground hover:bg-muted',
            'dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-muted'
          )}
          aria-label="Skip tour"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <div className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">
          {step.content}
        </div>
      </div>

      {/* Progress dots */}
      {showProgress && totalSteps > 1 && (
        <div className="px-4 pb-3 flex justify-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === stepIndex
                  ? 'w-6 bg-[var(--primary)]'
                  : i < stepIndex
                    ? 'w-1.5 bg-[var(--primary)] opacity-50'
                    : 'w-1.5 bg-border dark:bg-border'
              )}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div
        className={cn(
          'flex items-center justify-between gap-2 px-4 py-3',
          'bg-muted dark:bg-muted',
          'border-t border-border dark:border-border'
        )}
      >
        <button
          onClick={onSkip}
          className={cn(
            'text-sm text-muted-foreground hover:text-foreground',
            'dark:text-muted-foreground dark:hover:text-foreground',
            'transition-colors'
          )}
        >
          Skip tour
        </button>

        <div className="flex items-center gap-2">
          {!isFirstStep && !step.disableBack && (
            <button
              onClick={onBack}
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg',
                'text-foreground hover:bg-muted',
                'dark:text-foreground dark:hover:bg-muted',
                'transition-colors'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              {step.backLabel || 'Back'}
            </button>
          )}

          <button
            onClick={onNext}
            className={cn(
              'inline-flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-lg',
              'bg-[var(--primary)] text-white',
              'hover:bg-[var(--primary-hover)]',
              'transition-colors'
            )}
          >
            {isLastStep ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {step.nextLabel || 'Finish'}
              </>
            ) : (
              <>
                {step.nextLabel || 'Next'}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Interactive onboarding tour with spotlight effects.
 *
 * @example
 * ```tsx
 * const tourSteps: TourStep[] = [
 *   {
 *     id: 'welcome',
 *     title: 'Welcome to the App',
 *     content: 'Let us show you around!',
 *     placement: 'center',
 *   },
 *   {
 *     id: 'record-button',
 *     target: '#record-btn',
 *     title: 'Start Recording',
 *     content: 'Click here to begin recording your meeting.',
 *     placement: 'bottom',
 *     spotlight: true,
 *   },
 * ];
 *
 * <OnboardingTour
 *   steps={tourSteps}
 *   isActive={showTour}
 *   onComplete={() => setShowTour(false)}
 *   onSkip={() => setShowTour(false)}
 * />
 * ```
 */
export function OnboardingTour({
  steps,
  isActive,
  onComplete,
  onSkip,
  onStepChange,
  initialStep = 0,
  allowEscapeClose = true,
  showProgress = true,
  overlayOpacity = 0.6,
  zIndex = 9999,
  className,
}: OnboardingTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(initialStep);
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  const currentStep = steps[currentStepIndex];

  // Client-side mount check for portal
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset to initial step when tour becomes active
  React.useEffect(() => {
    if (isActive) {
      setCurrentStepIndex(initialStep);
    }
  }, [isActive, initialStep]);

  // Update target rect when step changes
  React.useEffect(() => {
    if (!isActive || !currentStep?.target) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const element = document.querySelector(currentStep.target!);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updateRect();

    // Update on scroll/resize
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isActive, currentStep?.target, currentStepIndex]);

  // Trigger step lifecycle callbacks
  React.useEffect(() => {
    if (!isActive) return;

    currentStep?.onEnter?.();

    return () => {
      currentStep?.onExit?.();
    };
  }, [isActive, currentStepIndex, currentStep]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (allowEscapeClose) {
            e.preventDefault();
            onSkip();
          }
          break;
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          if (currentStepIndex > 0 && !currentStep?.disableBack) {
            e.preventDefault();
            handleBack();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStepIndex, allowEscapeClose, onSkip]);

  // Calculate card position
  const getCardPosition = React.useCallback(() => {
    const placement = currentStep?.placement || 'center';
    const cardWidth = 320;
    const cardHeight = 200; // Approximate
    const gap = 16;

    // Center position (no target)
    if (!targetRect || placement === 'center') {
      return {
        x: (window.innerWidth - cardWidth) / 2,
        y: (window.innerHeight - cardHeight) / 2,
      };
    }

    let x = 0;
    let y = 0;

    switch (placement) {
      case 'top':
        x = targetRect.left + targetRect.width / 2 - cardWidth / 2;
        y = targetRect.top - cardHeight - gap;
        break;
      case 'bottom':
        x = targetRect.left + targetRect.width / 2 - cardWidth / 2;
        y = targetRect.bottom + gap;
        break;
      case 'left':
        x = targetRect.left - cardWidth - gap;
        y = targetRect.top + targetRect.height / 2 - cardHeight / 2;
        break;
      case 'right':
        x = targetRect.right + gap;
        y = targetRect.top + targetRect.height / 2 - cardHeight / 2;
        break;
    }

    // Keep within viewport
    x = Math.max(16, Math.min(x, window.innerWidth - cardWidth - 16));
    y = Math.max(16, Math.min(y, window.innerHeight - cardHeight - 16));

    return { x, y };
  }, [currentStep?.placement, targetRect]);

  const handleNext = React.useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onStepChange?.(nextIndex);
    } else {
      onComplete();
    }
  }, [currentStepIndex, steps.length, onComplete, onStepChange]);

  const handleBack = React.useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onStepChange?.(prevIndex);
    }
  }, [currentStepIndex, onStepChange]);

  // Don't render on server or when inactive
  if (!isMounted || !isActive || !currentStep) {
    return null;
  }

  const position = getCardPosition();
  const placement = currentStep.placement || 'center';

  return createPortal(
    <AnimatePresence mode="wait">
      <div
        className={cn('fixed inset-0 pointer-events-none', className)}
        style={{ zIndex }}
        role="dialog"
        aria-modal="true"
        aria-label="Onboarding tour"
      >
        {/* Spotlight overlay */}
        {currentStep.spotlight !== false && (
          <SpotlightOverlay
            targetRect={targetRect}
            opacity={overlayOpacity}
            zIndex={zIndex}
          />
        )}

        {/* Tour card */}
        <TourCard
          key={currentStep.id}
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={steps.length}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={onSkip}
          showProgress={showProgress}
          position={position}
          placement={placement}
          zIndex={zIndex}
        />
      </div>
    </AnimatePresence>,
    document.body
  );
}

// ============================================================================
// Exports
// ============================================================================

// TourStep and OnboardingTourProps are exported inline

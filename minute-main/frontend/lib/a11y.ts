/**
 * Accessibility Utilities
 * 
 * Common accessibility helpers for WCAG 2.2 AA compliance
 */

/**
 * Generate a unique ID for ARIA relationships
 */
export function generateA11yId(prefix: string = 'a11y'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Announce a message to screen readers via live region
 */
export function announce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return
  
  const container = document.getElementById('a11y-announcer') || createAnnouncer()
  container.setAttribute('aria-live', priority)
  
  // Clear and set message (ensures re-announcement)
  container.textContent = ''
  requestAnimationFrame(() => {
    container.textContent = message
  })
}

/**
 * Create the announcer element if it doesn't exist
 */
function createAnnouncer(): HTMLElement {
  const announcer = document.createElement('div')
  announcer.id = 'a11y-announcer'
  announcer.setAttribute('role', 'status')
  announcer.setAttribute('aria-live', 'polite')
  announcer.setAttribute('aria-atomic', 'true')
  announcer.className = 'sr-only'
  document.body.appendChild(announcer)
  return announcer
}

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Move focus to an element after a short delay (for transitions)
   */
  focusAfterDelay(element: HTMLElement | null, delay = 100): void {
    if (!element) return
    setTimeout(() => element.focus(), delay)
  },

  /**
   * Trap focus within a container (useful for modals)
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstFocusable?.focus()

    return () => container.removeEventListener('keydown', handleKeyDown)
  },

  /**
   * Restore focus to previously focused element
   */
  createFocusRestorer(): () => void {
    const previouslyFocused = document.activeElement as HTMLElement
    return () => previouslyFocused?.focus()
  },
}

/**
 * Keyboard navigation helpers
 */
export const keyboardNav = {
  /**
   * Check if a key event is an activation key (Enter or Space)
   */
  isActivationKey(event: React.KeyboardEvent): boolean {
    return event.key === 'Enter' || event.key === ' '
  },

  /**
   * Check if a key event is an arrow key
   */
  isArrowKey(event: React.KeyboardEvent): 'up' | 'down' | 'left' | 'right' | false {
    switch (event.key) {
      case 'ArrowUp':
        return 'up'
      case 'ArrowDown':
        return 'down'
      case 'ArrowLeft':
        return 'left'
      case 'ArrowRight':
        return 'right'
      default:
        return false
    }
  },

  /**
   * Check if Escape key was pressed
   */
  isEscape(event: React.KeyboardEvent): boolean {
    return event.key === 'Escape'
  },
}

/**
 * Generate aria-describedby IDs for form validation
 */
export function getValidationDescribedBy(
  fieldId: string,
  options: { hasError?: boolean; hasHint?: boolean }
): string | undefined {
  const ids: string[] = []
  if (options.hasHint) ids.push(`${fieldId}-hint`)
  if (options.hasError) ids.push(`${fieldId}-error`)
  return ids.length > 0 ? ids.join(' ') : undefined
}

/**
 * Skip link component props generator
 */
export function getSkipLinkProps(targetId: string = 'main-content') {
  return {
    href: `#${targetId}`,
    className: 'sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground focus:border focus:border-primary focus:rounded-md',
    children: 'Skip to main content',
  }
}

/**
 * Color contrast utilities
 */
export const contrastUtils = {
  /**
   * Check if contrast ratio meets WCAG AA (4.5:1 for normal text)
   */
  meetsWCAG_AA(ratio: number, isLargeText = false): boolean {
    return ratio >= (isLargeText ? 3 : 4.5)
  },

  /**
   * Check if contrast ratio meets WCAG AAA (7:1 for normal text)
   */
  meetsWCAG_AAA(ratio: number, isLargeText = false): boolean {
    return ratio >= (isLargeText ? 4.5 : 7)
  },
}

/**
 * Reduced motion preference detection
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * High contrast preference detection
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-contrast: more)').matches
}

const a11yUtils = {
  generateA11yId,
  announce,
  focusUtils,
  keyboardNav,
  getValidationDescribedBy,
  getSkipLinkProps,
  contrastUtils,
  prefersReducedMotion,
  prefersHighContrast,
}

export default a11yUtils

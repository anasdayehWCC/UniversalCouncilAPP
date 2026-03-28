/**
 * Accessibility Audit Utilities
 * 
 * Runtime accessibility checks for development mode.
 * Logs warnings to console for common accessibility issues.
 */

import type { A11yAuditIssue, A11yAuditResult, A11yIssueSeverity, ContrastCheckResult } from './types';

// ============================================================================
// Constants
// ============================================================================

const WCAG_AA_CONTRAST_NORMAL = 4.5;
const WCAG_AA_CONTRAST_LARGE = 3;
const WCAG_AAA_CONTRAST_NORMAL = 7;
const LARGE_TEXT_SIZE = 18; // 18px or 14px bold

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Parse color string to RGB values
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }
  
  // Handle hex
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
    };
  }
  
  // Handle short hex
  const shortHexMatch = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHexMatch) {
    return {
      r: parseInt(shortHexMatch[1] + shortHexMatch[1], 16),
      g: parseInt(shortHexMatch[2] + shortHexMatch[2], 16),
      b: parseInt(shortHexMatch[3] + shortHexMatch[3], 16),
    };
  }
  
  return null;
}

/**
 * Calculate relative luminance (WCAG 2.1)
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check color contrast compliance
 */
export function checkColorContrast(
  foreground: string,
  background: string
): ContrastCheckResult {
  const ratio = getContrastRatio(foreground, background);
  
  return {
    foreground,
    background,
    ratio: Math.round(ratio * 100) / 100,
    passesAA: ratio >= WCAG_AA_CONTRAST_NORMAL,
    passesAALarge: ratio >= WCAG_AA_CONTRAST_LARGE,
    passesAAA: ratio >= WCAG_AAA_CONTRAST_NORMAL,
  };
}

// ============================================================================
// Element Auditors
// ============================================================================

/**
 * Audit images for alt text
 */
function auditImages(container: HTMLElement): A11yAuditIssue[] {
  const issues: A11yAuditIssue[] = [];
  const images = container.querySelectorAll<HTMLImageElement>('img');
  
  images.forEach((img) => {
    const hasAlt = img.hasAttribute('alt');
    const altValue = img.getAttribute('alt');
    const isDecora = img.getAttribute('role') === 'presentation' || altValue === '';
    
    if (!hasAlt) {
      issues.push({
        id: `img-no-alt-${issues.length}`,
        severity: 'error',
        criterion: '1.1.1',
        message: 'Image is missing alt attribute',
        element: img,
        selector: getSelector(img),
        suggestion: 'Add alt="" for decorative images or descriptive alt text for meaningful images',
      });
    } else if (!isDecora && altValue && altValue.length > 125) {
      issues.push({
        id: `img-long-alt-${issues.length}`,
        severity: 'warning',
        criterion: '1.1.1',
        message: 'Alt text is very long (>125 chars). Consider using aria-describedby for complex images.',
        element: img,
        selector: getSelector(img),
        suggestion: 'Keep alt text concise; use aria-describedby for longer descriptions',
      });
    }
  });
  
  return issues;
}

/**
 * Audit buttons for accessible names
 */
function auditButtons(container: HTMLElement): A11yAuditIssue[] {
  const issues: A11yAuditIssue[] = [];
  const buttons = container.querySelectorAll<HTMLButtonElement>('button, [role="button"]');
  
  buttons.forEach((button) => {
    const hasText = button.textContent?.trim();
    const hasAriaLabel = button.getAttribute('aria-label');
    const hasAriaLabelledby = button.getAttribute('aria-labelledby');
    const hasTitle = button.getAttribute('title');
    
    if (!hasText && !hasAriaLabel && !hasAriaLabelledby) {
      issues.push({
        id: `button-no-name-${issues.length}`,
        severity: 'error',
        criterion: '4.1.2',
        message: 'Button has no accessible name',
        element: button,
        selector: getSelector(button),
        suggestion: 'Add aria-label, text content, or aria-labelledby',
      });
    } else if (!hasText && !hasAriaLabel && !hasAriaLabelledby && hasTitle) {
      issues.push({
        id: `button-title-only-${issues.length}`,
        severity: 'warning',
        criterion: '4.1.2',
        message: 'Button relies only on title for accessible name',
        element: button,
        selector: getSelector(button),
        suggestion: 'title is not universally announced; prefer aria-label',
      });
    }
  });
  
  return issues;
}

/**
 * Audit links for accessible names
 */
function auditLinks(container: HTMLElement): A11yAuditIssue[] {
  const issues: A11yAuditIssue[] = [];
  const links = container.querySelectorAll<HTMLAnchorElement>('a[href]');
  
  links.forEach((link) => {
    const hasText = link.textContent?.trim();
    const hasAriaLabel = link.getAttribute('aria-label');
    const hasAriaLabelledby = link.getAttribute('aria-labelledby');
    const hasImage = link.querySelector('img[alt]');
    
    if (!hasText && !hasAriaLabel && !hasAriaLabelledby && !hasImage) {
      issues.push({
        id: `link-no-name-${issues.length}`,
        severity: 'error',
        criterion: '2.4.4',
        message: 'Link has no accessible name',
        element: link,
        selector: getSelector(link),
        suggestion: 'Add link text, aria-label, or an image with alt text',
      });
    }
    
    // Check for generic link text
    const genericTexts = ['click here', 'read more', 'learn more', 'here', 'more'];
    if (hasText && genericTexts.includes(hasText.toLowerCase())) {
      issues.push({
        id: `link-generic-name-${issues.length}`,
        severity: 'warning',
        criterion: '2.4.4',
        message: `Generic link text "${hasText}" is not descriptive`,
        element: link,
        selector: getSelector(link),
        suggestion: 'Use descriptive link text that indicates the destination',
      });
    }
  });
  
  return issues;
}

/**
 * Audit form inputs for labels
 */
function auditFormInputs(container: HTMLElement): A11yAuditIssue[] {
  const issues: A11yAuditIssue[] = [];
  const inputs = container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), textarea, select'
  );
  
  inputs.forEach((input) => {
    const id = input.id;
    const hasLabel = id && container.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.getAttribute('aria-label');
    const hasAriaLabelledby = input.getAttribute('aria-labelledby');
    const hasTitleAttr = input.getAttribute('title');
    const hasPlaceholder = input.getAttribute('placeholder');
    const isWrappedByLabel = input.closest('label');
    
    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby && !isWrappedByLabel) {
      const severity: A11yIssueSeverity = hasTitleAttr || hasPlaceholder ? 'warning' : 'error';
      issues.push({
        id: `input-no-label-${issues.length}`,
        severity,
        criterion: '1.3.1',
        message: `Form input has no associated label${hasTitleAttr || hasPlaceholder ? ' (uses title/placeholder only)' : ''}`,
        element: input,
        selector: getSelector(input),
        suggestion: 'Add a <label> with for attribute, aria-label, or wrap input in <label>',
      });
    }
    
    // Check for placeholder-only labels
    if (hasPlaceholder && !hasLabel && !hasAriaLabel && !hasAriaLabelledby && !isWrappedByLabel) {
      issues.push({
        id: `input-placeholder-label-${issues.length}`,
        severity: 'warning',
        criterion: '3.3.2',
        message: 'Input relies only on placeholder for labeling',
        element: input,
        selector: getSelector(input),
        suggestion: 'Placeholders disappear when typing; use a visible label',
      });
    }
  });
  
  return issues;
}

/**
 * Audit headings for hierarchy
 */
function auditHeadings(container: HTMLElement): A11yAuditIssue[] {
  const issues: A11yAuditIssue[] = [];
  const headings = container.querySelectorAll<HTMLHeadingElement>('h1, h2, h3, h4, h5, h6');
  
  let previousLevel = 0;
  
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.charAt(1), 10);
    
    // Check for skipped levels
    if (previousLevel > 0 && level > previousLevel + 1) {
      issues.push({
        id: `heading-skip-${issues.length}`,
        severity: 'warning',
        criterion: '1.3.1',
        message: `Heading level skipped from h${previousLevel} to h${level}`,
        element: heading,
        selector: getSelector(heading),
        suggestion: 'Heading levels should increase by one (e.g., h2 should follow h1)',
      });
    }
    
    // Check for empty headings
    if (!heading.textContent?.trim()) {
      issues.push({
        id: `heading-empty-${issues.length}`,
        severity: 'error',
        criterion: '1.3.1',
        message: `Empty heading found (h${level})`,
        element: heading,
        selector: getSelector(heading),
        suggestion: 'Headings should have visible text content',
      });
    }
    
    previousLevel = level;
  });
  
  return issues;
}

/**
 * Audit for missing landmarks
 */
function auditLandmarks(container: HTMLElement): A11yAuditIssue[] {
  const issues: A11yAuditIssue[] = [];
  
  // Check for main landmark
  const hasMain = container.querySelector('main, [role="main"]');
  if (!hasMain) {
    issues.push({
      id: 'landmark-no-main',
      severity: 'warning',
      criterion: '1.3.1',
      message: 'Page is missing a main landmark',
      suggestion: 'Add <main> or role="main" to the primary content area',
    });
  }
  
  // Check for multiple mains
  const mains = container.querySelectorAll('main, [role="main"]');
  if (mains.length > 1) {
    issues.push({
      id: 'landmark-multiple-mains',
      severity: 'error',
      criterion: '1.3.1',
      message: `Page has ${mains.length} main landmarks (should have only 1)`,
      suggestion: 'Remove duplicate main landmarks',
    });
  }
  
  // Check for nav without label when multiple navs exist
  const navs = container.querySelectorAll<HTMLElement>('nav, [role="navigation"]');
  if (navs.length > 1) {
    navs.forEach((nav, index) => {
      if (!nav.getAttribute('aria-label') && !nav.getAttribute('aria-labelledby')) {
        issues.push({
          id: `landmark-nav-no-label-${index}`,
          severity: 'warning',
          criterion: '1.3.1',
          message: 'Multiple nav landmarks exist but this one has no accessible name',
          element: nav,
          selector: getSelector(nav),
          suggestion: 'Add aria-label to distinguish navigation landmarks',
        });
      }
    });
  }
  
  return issues;
}

/**
 * Audit color contrast (samples visible text)
 */
function auditColorContrast(container: HTMLElement): A11yAuditIssue[] {
  const issues: A11yAuditIssue[] = [];
  
  // Sample of elements to check
  const textElements = container.querySelectorAll<HTMLElement>(
    'p, span, a, button, h1, h2, h3, h4, h5, h6, label, li, td, th'
  );
  
  const checked = new Set<string>();
  
  textElements.forEach((el) => {
    const styles = window.getComputedStyle(el);
    const color = styles.color;
    const bgColor = getEffectiveBackgroundColor(el);
    const fontSize = parseFloat(styles.fontSize);
    const fontWeight = parseInt(styles.fontWeight, 10);
    
    // Skip if already checked this combination
    const key = `${color}|${bgColor}`;
    if (checked.has(key)) return;
    checked.add(key);
    
    const result = checkColorContrast(color, bgColor);
    const isLargeText = fontSize >= LARGE_TEXT_SIZE || (fontSize >= 14 && fontWeight >= 700);
    const requiredRatio = isLargeText ? WCAG_AA_CONTRAST_LARGE : WCAG_AA_CONTRAST_NORMAL;
    
    if (result.ratio < requiredRatio) {
      issues.push({
        id: `contrast-fail-${issues.length}`,
        severity: 'error',
        criterion: '1.4.3',
        message: `Insufficient color contrast: ${result.ratio}:1 (required: ${requiredRatio}:1)`,
        element: el,
        selector: getSelector(el),
        suggestion: `Foreground: ${color}, Background: ${bgColor}. Increase contrast to at least ${requiredRatio}:1`,
      });
    }
  });
  
  return issues;
}

/**
 * Get effective background color (traverse parents)
 */
function getEffectiveBackgroundColor(element: HTMLElement): string {
  let el: HTMLElement | null = element;
  
  while (el) {
    const styles = window.getComputedStyle(el);
    const bgColor = styles.backgroundColor;
    
    // If not transparent, return this color
    if (bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
      return bgColor;
    }
    
    el = el.parentElement;
  }
  
  // Default to white if no background found
  return 'rgb(255, 255, 255)';
}

/**
 * Audit for focus indicators
 */
function auditFocusIndicators(container: HTMLElement): A11yAuditIssue[] {
  const issues: A11yAuditIssue[] = [];
  
  const interactiveElements = container.querySelectorAll<HTMLElement>(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  interactiveElements.forEach((el) => {
    const styles = window.getComputedStyle(el);
    const outlineStyle = styles.outlineStyle;
    
    // Check for outline: none without alternative focus indicator
    if (outlineStyle === 'none') {
      // This is a heuristic check - we can't fully detect CSS :focus-visible rules
      const hasFocusVisible = el.classList.toString().includes('focus') ||
        el.getAttribute('data-focus-visible') !== null;
      
      if (!hasFocusVisible) {
        issues.push({
          id: `focus-indicator-${issues.length}`,
          severity: 'info',
          criterion: '2.4.7',
          message: 'Element has outline:none - verify focus indicator via :focus-visible',
          element: el,
          selector: getSelector(el),
          suggestion: 'Ensure visible focus indicator exists via CSS :focus-visible',
        });
      }
    }
  });
  
  return issues;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate a CSS selector for an element
 */
function getSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }
  
  const parts: string[] = [];
  let el: HTMLElement | null = element;
  
  while (el && el !== document.body) {
    let selector = el.tagName.toLowerCase();
    
    if (el.className) {
      const classes = el.className.split(' ').filter(c => c && !c.startsWith('__')).slice(0, 2);
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }
    
    parts.unshift(selector);
    el = el.parentElement;
    
    // Limit depth
    if (parts.length >= 4) break;
  }
  
  return parts.join(' > ');
}

// ============================================================================
// Main Audit Function
// ============================================================================

/**
 * Run accessibility audit on a container
 */
export function runA11yAudit(
  container: HTMLElement = document.body,
  options: {
    checkImages?: boolean;
    checkButtons?: boolean;
    checkLinks?: boolean;
    checkForms?: boolean;
    checkHeadings?: boolean;
    checkLandmarks?: boolean;
    checkContrast?: boolean;
    checkFocus?: boolean;
  } = {}
): A11yAuditResult {
  const {
    checkImages = true,
    checkButtons = true,
    checkLinks = true,
    checkForms = true,
    checkHeadings = true,
    checkLandmarks = true,
    checkContrast = true,
    checkFocus = true,
  } = options;
  
  const allIssues: A11yAuditIssue[] = [];
  
  if (checkImages) allIssues.push(...auditImages(container));
  if (checkButtons) allIssues.push(...auditButtons(container));
  if (checkLinks) allIssues.push(...auditLinks(container));
  if (checkForms) allIssues.push(...auditFormInputs(container));
  if (checkHeadings) allIssues.push(...auditHeadings(container));
  if (checkLandmarks) allIssues.push(...auditLandmarks(container));
  if (checkContrast) allIssues.push(...auditColorContrast(container));
  if (checkFocus) allIssues.push(...auditFocusIndicators(container));
  
  const errors = allIssues.filter((i) => i.severity === 'error');
  const warnings = allIssues.filter((i) => i.severity === 'warning');
  const info = allIssues.filter((i) => i.severity === 'info');
  
  return {
    totalIssues: allIssues.length,
    errors,
    warnings,
    info,
    passed: errors.length === 0,
    timestamp: Date.now(),
  };
}

/**
 * Log audit results to console (dev mode)
 */
export function logA11yAudit(result: A11yAuditResult): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const { errors, warnings, info, passed } = result;
  
  console.group(
    `%c♿ Accessibility Audit: ${passed ? '✅ Passed' : '❌ Failed'}`,
    `color: ${passed ? 'green' : 'red'}; font-weight: bold`
  );
  
  if (errors.length > 0) {
    console.group(`%c❌ Errors (${errors.length})`, 'color: red');
    errors.forEach((issue) => {
      console.log(`[${issue.criterion || 'N/A'}] ${issue.message}`);
      if (issue.element) console.log('  Element:', issue.element);
      if (issue.suggestion) console.log('  Fix:', issue.suggestion);
    });
    console.groupEnd();
  }
  
  if (warnings.length > 0) {
    console.group(`%c⚠️ Warnings (${warnings.length})`, 'color: orange');
    warnings.forEach((issue) => {
      console.log(`[${issue.criterion || 'N/A'}] ${issue.message}`);
      if (issue.suggestion) console.log('  Fix:', issue.suggestion);
    });
    console.groupEnd();
  }
  
  if (info.length > 0) {
    console.group(`%cℹ️ Info (${info.length})`, 'color: blue');
    info.forEach((issue) => {
      console.log(issue.message);
    });
    console.groupEnd();
  }
  
  console.groupEnd();
}

/**
 * Run and log audit (convenience function)
 */
export function auditAndLog(container?: HTMLElement): A11yAuditResult {
  const result = runA11yAudit(container);
  logA11yAudit(result);
  return result;
}

// ============================================================================
// React Hook for Development Audit
// ============================================================================

/**
 * Hook to run accessibility audit on mount (dev only)
 */
export function useA11yAudit(
  containerRef: React.RefObject<HTMLElement | null>,
  options: {
    runOnMount?: boolean;
    runOnUpdate?: boolean;
    debounceMs?: number;
  } = {}
): {
  audit: () => A11yAuditResult | null;
  lastResult: A11yAuditResult | null;
} {
  // Implementation imports dynamically to avoid SSR issues
  const { useCallback, useEffect, useRef, useState } = require('react') as typeof import('react');
  
  const { runOnMount = true, runOnUpdate = false, debounceMs = 1000 } = options;
  const [lastResult, setLastResult] = useState<A11yAuditResult | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const audit = useCallback(() => {
    if (process.env.NODE_ENV !== 'development') return null;
    if (!containerRef.current) return null;
    
    const result = runA11yAudit(containerRef.current);
    logA11yAudit(result);
    setLastResult(result);
    return result;
  }, [containerRef]);
  
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    if (runOnMount) {
      // Delay initial audit to allow DOM to settle
      timeoutRef.current = setTimeout(audit, debounceMs);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [audit, debounceMs, runOnMount]);
  
  useEffect(() => {
    if (!runOnUpdate) return;
    if (process.env.NODE_ENV !== 'development') return;
    
    // MutationObserver for DOM changes
    const observer = new MutationObserver(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(audit, debounceMs);
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }
    
    return () => observer.disconnect();
  }, [audit, containerRef, debounceMs, runOnUpdate]);
  
  return { audit, lastResult };
}

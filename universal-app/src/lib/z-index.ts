/**
 * Z-Index Scale Constants
 * 
 * This file defines a consistent z-index scale for the application.
 * Use these constants instead of arbitrary z-index values to ensure
 * proper stacking order across components.
 * 
 * Scale:
 * - CONTENT (0-10): Base content layer
 * - STICKY (20-30): Sticky headers, table columns
 * - HEADER (40): Main navigation header
 * - BACKDROP (40): Modal/drawer backdrops
 * - DROPDOWN (50): Dropdown menus, popovers
 * - MODAL (50): Modal dialogs
 * - FLOATING (45): FABs, floating elements (below modals)
 * - TOAST (100): Toast notifications (always on top)
 * - TOOLTIP (100): Tooltips (always on top)
 */

export const ZINDEX = {
  // Base content layer
  content: 0,
  relative: 10,
  
  // Tables & scoped overlays
  tableColumn: 20,
  stickyContent: 20,
  
  // Chrome headers & navigation
  header: 40,
  sidebar: 40,
  
  // Backdrops & overlays
  backdrop: 40,
  sticky: 40,
  
  // Floating UI (below modals)
  floatingButton: 45,
  floatingAction: 45,
  
  // Modals, dropdowns, overlays
  dropdown: 50,
  popover: 50,
  modal: 50,
  panel: 50,
  sheet: 50,
  
  // Very top layer - always visible
  toast: 100,
  tooltip: 100,
  notification: 100,
} as const;

/**
 * Tailwind z-index class mapping
 * Use these to generate consistent class names
 */
export const ZINDEX_CLASSES = {
  content: 'z-0',
  relative: 'z-10',
  tableColumn: 'z-20',
  stickyContent: 'z-20',
  header: 'z-40',
  sidebar: 'z-40',
  backdrop: 'z-40',
  sticky: 'z-40',
  floatingButton: 'z-[45]',
  floatingAction: 'z-[45]',
  dropdown: 'z-50',
  popover: 'z-50',
  modal: 'z-50',
  panel: 'z-50',
  sheet: 'z-50',
  toast: 'z-[100]',
  tooltip: 'z-[100]',
  notification: 'z-[100]',
} as const;

export type ZIndexKey = keyof typeof ZINDEX;

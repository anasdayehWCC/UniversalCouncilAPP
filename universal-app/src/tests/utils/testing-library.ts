/**
 * Custom Testing Library Queries
 * 
 * Extended queries for common testing patterns.
 */

import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================
// Re-exports
// ============================================

export * from '@testing-library/react';
export { userEvent };

// ============================================
// Custom Query Helpers
// ============================================

/**
 * Find element by test ID with better error messages
 */
export function getByTestIdWithin(container: HTMLElement, testId: string) {
  const element = within(container).queryByTestId(testId);
  if (!element) {
    throw new Error(
      `Unable to find element with test ID "${testId}" within container.\n` +
      `Container HTML:\n${container.innerHTML.substring(0, 500)}...`
    );
  }
  return element;
}

/**
 * Find button by its accessible name
 */
export function getButtonByName(name: string | RegExp) {
  return screen.getByRole('button', { name });
}

/**
 * Find link by its accessible name
 */
export function getLinkByName(name: string | RegExp) {
  return screen.getByRole('link', { name });
}

/**
 * Find input by its label
 */
export function getInputByLabel(label: string | RegExp) {
  return screen.getByLabelText(label);
}

/**
 * Find heading by level and text
 */
export function getHeading(level: 1 | 2 | 3 | 4 | 5 | 6, name?: string | RegExp) {
  return screen.getByRole('heading', { level, name });
}

// ============================================
// Async Helpers
// ============================================

/**
 * Wait for element to appear and return it
 */
export async function waitForElement(
  getter: () => HTMLElement,
  options?: { timeout?: number }
): Promise<HTMLElement> {
  let element: HTMLElement | null = null;
  
  await waitFor(
    () => {
      element = getter();
      return element;
    },
    { timeout: options?.timeout ?? 5000 }
  );
  
  return element!;
}

/**
 * Wait for element to disappear
 */
export async function waitForElementToDisappear(
  getter: () => HTMLElement | null,
  options?: { timeout?: number }
): Promise<void> {
  await waitFor(
    () => {
      const element = getter();
      if (element) {
        throw new Error('Element still present');
      }
    },
    { timeout: options?.timeout ?? 5000 }
  );
}

/**
 * Wait for loading indicator to disappear
 */
export async function waitForLoadingToFinish(options?: { timeout?: number }): Promise<void> {
  await waitFor(
    () => {
      const loaders = screen.queryAllByRole('status');
      const skeletons = screen.queryAllByTestId(/skeleton/i);
      const spinners = screen.queryAllByTestId(/spinner|loading/i);
      
      if (loaders.length > 0 || skeletons.length > 0 || spinners.length > 0) {
        throw new Error('Still loading');
      }
    },
    { timeout: options?.timeout ?? 10000 }
  );
}

// ============================================
// Form Helpers
// ============================================

/**
 * Fill a form field by label
 */
export async function fillField(label: string | RegExp, value: string): Promise<void> {
  const user = userEvent.setup();
  const input = screen.getByLabelText(label);
  await user.clear(input);
  await user.type(input, value);
}

/**
 * Select an option in a select/combobox
 */
export async function selectOption(label: string | RegExp, option: string): Promise<void> {
  const user = userEvent.setup();
  const select = screen.getByLabelText(label);
  await user.click(select);
  const optionElement = screen.getByRole('option', { name: option });
  await user.click(optionElement);
}

/**
 * Toggle a checkbox
 */
export async function toggleCheckbox(label: string | RegExp): Promise<void> {
  const user = userEvent.setup();
  const checkbox = screen.getByLabelText(label);
  await user.click(checkbox);
}

/**
 * Submit a form
 */
export async function submitForm(): Promise<void> {
  const user = userEvent.setup();
  const submitButton = screen.getByRole('button', { name: /submit|save|confirm/i });
  await user.click(submitButton);
}

// ============================================
// Assertion Helpers
// ============================================

/**
 * Assert element has specific CSS class
 */
export function expectToHaveClass(element: HTMLElement, className: string): void {
  expect(element.classList.contains(className)).toBe(true);
}

/**
 * Assert element is focused
 */
export function expectToBeFocused(element: HTMLElement): void {
  expect(document.activeElement).toBe(element);
}

/**
 * Assert element has specific attribute value
 */
export function expectToHaveAttribute(
  element: HTMLElement,
  attr: string,
  value?: string
): void {
  if (value !== undefined) {
    expect(element.getAttribute(attr)).toBe(value);
  } else {
    expect(element.hasAttribute(attr)).toBe(true);
  }
}

// ============================================
// Navigation Helpers
// ============================================

/**
 * Click a navigation link
 */
export async function navigateTo(linkText: string | RegExp): Promise<void> {
  const user = userEvent.setup();
  const link = screen.getByRole('link', { name: linkText });
  await user.click(link);
}

/**
 * Click a menu item
 */
export async function clickMenuItem(menuName: string | RegExp, itemName: string | RegExp): Promise<void> {
  const user = userEvent.setup();
  
  // Open menu
  const menuButton = screen.getByRole('button', { name: menuName });
  await user.click(menuButton);
  
  // Click item
  const menuItem = screen.getByRole('menuitem', { name: itemName });
  await user.click(menuItem);
}

// ============================================
// Debug Helpers
// ============================================

/**
 * Print currently rendered DOM (useful for debugging)
 */
export function debugDOM(): void {
  screen.debug(undefined, Infinity);
}

/**
 * Print specific element
 */
export function debugElement(element: HTMLElement): void {
  console.log(element.outerHTML);
}

/**
 * Get text content of all elements matching selector
 */
export function getAllTextContent(selector: string): string[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map((el) => el.textContent ?? '');
}

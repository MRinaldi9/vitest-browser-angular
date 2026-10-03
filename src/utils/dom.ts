import { server } from 'vitest/browser';

let testIdCounter = 0;

/**
 * @internal
 * Ensures the element carries a stable `data-testid` so that
 * `page.elementLocator()` generates a selector that survives DOM mutations
 * (instead of a text-based selector that goes stale).
 */
export function ensureTestIdAttribute(element: HTMLElement) {
  const attributeId = server.config.browser.locators.testIdAttribute;
  if (!element.hasAttribute(attributeId)) {
    element.setAttribute(attributeId, `__vitest_${testIdCounter++}__`);
  }
}

/**
 * @internal
 * Strips Angular-specific attributes (`ng-version`, `id`) from a rendered element.
 */
export function removeAngularAttributes(element: HTMLElement) {
  element.removeAttribute('ng-version');
  element.removeAttribute('id');
}

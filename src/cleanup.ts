import { ɵgetCleanupHook as getCleanupHook } from '@angular/core/testing';

import { destroyEmulatedDirectiveFixtures } from './directive-fixture';

/**
 * Destroys every fixture created by the previous render, resetting the TestBed.
 *
 * Called automatically before each test when importing `@wismaz/vitest-browser-angular`; the
 * `/pure` entry requires an explicit call (e.g. in an `afterEach`).
 *
 * @param shouldTeardown - Whether the whole testing module should be torn down.
 */
export function cleanup(shouldTeardown = false) {
  destroyEmulatedDirectiveFixtures();
  return getCleanupHook(shouldTeardown)();
}

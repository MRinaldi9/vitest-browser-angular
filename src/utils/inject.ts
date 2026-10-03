import type { Injector, ProviderToken } from '@angular/core';

import { VitestBrowserAngularError } from '../errors/vitest-browser-angular';

/**
 * @param injector - The Angular injector to use for dependency resolution.
 * @returns A function that takes a token and returns the corresponding instance from the injector.
 * @internal
 * Closure that returns an `inject` function for the given injector. Throws if the injector is undefined.
 */
export function createInjectFn(injector: Injector | undefined): <T>(token: ProviderToken<T>) => T {
  if (!injector) {
    throw new VitestBrowserAngularError('Injector is undefined. Cannot inject dependencies.');
  }
  return token => injector.get(token);
}

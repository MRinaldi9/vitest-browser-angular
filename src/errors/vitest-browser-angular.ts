/**
 * Error thrown by the library, e.g. for invalid render options or unsupported Angular features.
 *
 * The message is always prefixed with `[vitest-browser-angular]`, so it can be told apart from
 * errors coming from Angular itself.
 *
 * @example
 *   ```typescript
 *   import { VitestBrowserAngularError } from '@wismaz/vitest-browser-angular';
 *
 *   const error = await renderDirective(MyDirective, {}).catch((e: unknown) => e);
 *   expect(error).toBeInstanceOf(VitestBrowserAngularError);
 *   ```;
 */
export class VitestBrowserAngularError extends Error {
  constructor(message: string) {
    super(`[vitest-browser-angular] ${message}`);
    this.name = 'VBAError';
  }
}

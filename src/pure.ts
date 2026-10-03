/**
 * Entry point without the Vitest `page` extension and without the automatic cleanup hook.
 *
 * Use it when the render helpers are driven by a custom runner: register `cleanup()` yourself.
 */
export { cleanup } from './cleanup';
export { VitestBrowserAngularError } from './errors/vitest-browser-angular';
export { render } from './render';
export { renderDirective } from './render-directive';

export { setCreateDirectiveMode as ɵsetCreateDirectiveMode } from './directive-fixture';
export type { CreateDirectiveMode } from './directive-fixture';

export type {
  Inputs,
  Outputs,
  ComponentRenderOptions,
  DeferBlockStateConfig,
  RoutedFallbackRenderOptions,
  RoutedRenderOptions,
  RenderFn,
  RenderResult,
  RoutedRenderResult,
  DirectiveFixtureLike,
  DirectiveHostRenderOptions,
  DirectiveRenderOptions,
  DirectiveRenderResult,
} from './types/render';

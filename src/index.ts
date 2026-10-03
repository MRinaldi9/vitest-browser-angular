import { beforeEach } from 'vitest';
import { page } from 'vitest/browser';

import { cleanup } from './cleanup';
import { render } from './render';
import { renderDirective } from './render-directive';

page.extend({
  render,
  renderDirective,
  [Symbol.for('vitest:component-cleanup')]: cleanup,
});

beforeEach(async () => {
  await cleanup(true);
});

declare module 'vitest/browser' {
  interface BrowserPage {
    render: typeof render;
    renderDirective: typeof renderDirective;
  }
}

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
export { VitestBrowserAngularError } from './errors/vitest-browser-angular';
export { setCreateDirectiveMode as ɵsetCreateDirectiveMode } from './directive-fixture';
export type { CreateDirectiveMode } from './directive-fixture';
export { cleanup, render, renderDirective };

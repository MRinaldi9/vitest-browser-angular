import { beforeEach } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, render, renderDirective } from './pure';

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
  DirectiveRenderOptions,
  DirectiveRenderResult,
} from './types/render';
export { cleanup, render, renderDirective };

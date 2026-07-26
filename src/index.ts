import { beforeEach } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, render } from './pure';

page.extend({
  render,
  [Symbol.for('vitest:component-cleanup')]: cleanup,
});

beforeEach(async () => {
  await cleanup(true);
});

declare module 'vitest/browser' {
  interface BrowserPage {
    render: typeof render;
  }
}

export type { Inputs, ComponentRenderOptions, RenderFn, RenderResult } from './types/render';
export { cleanup, render };

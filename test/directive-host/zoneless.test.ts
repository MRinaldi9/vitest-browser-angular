import { signal } from '@angular/core';
import { renderDirective, ɵsetCreateDirectiveMode } from '@wismaz/vitest-browser-angular';
import type { CreateDirectiveMode } from '@wismaz/vitest-browser-angular';

import { ChangeClass } from '../directives/change-class';
import { Highlight } from '../directives/highlight';

describe.each<CreateDirectiveMode>(['auto', 'emulated'])('Zoneless host mode (%s)', mode => {
  beforeEach(() => {
    ɵsetCreateDirectiveMode(mode);
  });

  afterEach(() => {
    ɵsetCreateDirectiveMode('auto');
  });

  test('binds inputs without an explicit change detection run', async () => {
    const color = signal('red');
    const { hostElement } = await renderDirective(ChangeClass, {
      tagName: 'button',
      inputs: { className: color },
    });

    expect(hostElement).toHaveClass('red');

    color.set('changed');
    await expect.element(hostElement).toHaveClass('changed');
  });

  test('infers the tag name from the directive selector', async () => {
    const { container, directiveInstance } = await renderDirective(Highlight);

    expect(container.tagName).toBe('APP-HIGHLIGHT');
    expect(directiveInstance.color()).toBe('black');
  });

  test('rerenders inputs', async () => {
    const { hostElement, rerender } = await renderDirective(ChangeClass, {
      tagName: 'button',
      inputs: { className: 'red' },
    });

    await rerender({ className: 'changed' });
    await expect.element(hostElement).toHaveClass('changed');
  });
});

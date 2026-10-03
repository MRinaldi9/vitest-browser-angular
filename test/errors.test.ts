import { Component } from '@angular/core';
import { render, renderDirective, VitestBrowserAngularError } from '@wismaz/vitest-browser-angular';

import { ChangeClass } from './directives/change-class';

@Component({ selector: 'not-standalone-cmp', template: '', standalone: false })
class NotStandaloneComponent {}

async function catchError(renderPromise: Promise<unknown>): Promise<unknown> {
  return renderPromise.then(
    () => undefined,
    (error: unknown) => error,
  );
}

describe('VitestBrowserAngularError', () => {
  test('render() failures throw the custom error', async () => {
    const error = await catchError(render(NotStandaloneComponent));

    expect(error).toBeInstanceOf(VitestBrowserAngularError);
    expect((error as VitestBrowserAngularError).name).toBe('VBAError');
    expect((error as Error).message).toBe(
      '[vitest-browser-angular] The component must be standalone.',
    );
  });

  test('renderDirective() failures throw the custom error', async () => {
    const error = await catchError(renderDirective(ChangeClass, {}));

    expect(error).toBeInstanceOf(VitestBrowserAngularError);
    expect((error as Error).message).toMatch(
      /^\[vitest-browser-angular\] Cannot determine the tag name/,
    );
  });

  test('rerender() failures throw the custom error', async () => {
    const { rerender } = await renderDirective(ChangeClass, { tagName: 'button' });
    const error = await catchError(rerender({ className: 'red' }));

    expect(error).toBeInstanceOf(VitestBrowserAngularError);
    expect((error as Error).message).toBe(
      '[vitest-browser-angular] Cannot rerender directive with input "className" because it was not provided in the initial render options.',
    );
  });

  test('is a real Error carrying the library prefix and name', async () => {
    const error = await catchError(renderDirective(ChangeClass, {}));

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).name).toBe('VBAError');
    expect((error as Error).message.startsWith('[vitest-browser-angular] ')).toBe(true);
  });
});

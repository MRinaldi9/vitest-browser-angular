import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { DeferBlockState } from '@angular/core/testing';
import { cleanup, renderDirective, ɵsetCreateDirectiveMode } from '@wismaz/vitest-browser-angular';
import type { CreateDirectiveMode } from '@wismaz/vitest-browser-angular';
import { userEvent } from 'vitest/browser';

import { ChangeClass } from './directives/change-class';
import { Highlight } from './directives/highlight';
import { MultiTagDirective } from './directives/multi-tag';
import { ScopedDirective, ScopedService, TwoWayDirective } from './directives/scoped';

/**
 * Every assertion runs twice: with Angular's `TestBed.createDirective()` when available and with
 * the emulated implementation, so both code paths stay in sync.
 */
describe.each<CreateDirectiveMode>(['auto', 'emulated'])('host mode (%s)', mode => {
  beforeEach(() => {
    ɵsetCreateDirectiveMode(mode);
  });

  afterEach(() => {
    ɵsetCreateDirectiveMode('auto');
  });

  test('applies the directive to a bare host element', async () => {
    const { container, hostElement, directiveInstance, fixture } = await renderDirective(
      ChangeClass,
      { tagName: 'button', inputs: { className: 'red' } },
    );

    expect(container).toBe(hostElement);
    expect(hostElement.tagName).toBe('BUTTON');
    expect(directiveInstance).toBeInstanceOf(ChangeClass);
    expect(hostElement).toHaveClass('red');
    expect(fixture.directiveInstance).toBe(directiveInstance);
    expect(fixture.nativeElement).toBe(hostElement);
  });

  test('infers the tag name from an element selector', async () => {
    const { container, directiveInstance } = await renderDirective(Highlight);

    expect(container.tagName).toBe('APP-HIGHLIGHT');
    expect(directiveInstance).toBeInstanceOf(Highlight);
    expect(directiveInstance.color()).toBe('black');
  });

  test('binds inputs and rerenders them', async () => {
    const color = signal('red');
    const { hostElement, rerender } = await renderDirective(ChangeClass, {
      tagName: 'button',
      inputs: { className: color },
    });

    expect(hostElement).toHaveClass('red');

    await rerender({ className: 'changed' });
    expect(hostElement).toHaveClass('changed');

    // signals passed to `inputs` stay reactive
    color.set('blue');
    await expect.element(hostElement).toHaveClass('blue');
  });

  test('emits outputs', async () => {
    const blurredSpy = vi.fn();
    const { hostElement } = await renderDirective(ChangeClass, {
      tagName: 'button',
      outputs: { blurred: blurredSpy },
    });

    (hostElement as HTMLElement).focus();
    await userEvent.keyboard('{Tab}');

    expect(blurredSpy).toHaveBeenCalled();
  });

  test('exposes locators scoped to the host element', async () => {
    const { locator, getByText, container } = await renderDirective(ChangeClass, {
      tagName: 'button',
    });

    expect(container.innerHTML).toBe('');
    await expect.element(locator).toBeInTheDocument();
    expect(getByText('missing').query()).toBeNull();
  });

  test('exposes inject bound to the directive injector', async () => {
    const { inject } = await renderDirective(ScopedDirective, { tagName: 'div' });

    expect(inject(ScopedDirective)).toBeInstanceOf(ScopedDirective);
    expect(inject(ScopedService)).toBeInstanceOf(ScopedService);
  });

  test('exposes httpTesting and supports HTTP requests when withHttp is enabled', async () => {
    const { inject, httpTesting } = await renderDirective(ChangeClass, {
      tagName: 'button',
      withHttp: true,
    });

    expect(httpTesting).toBeDefined();

    inject(HttpClient).get('/api/data').subscribe();

    const req = httpTesting!.expectOne('/api/data');
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true });
  });

  test('does not expose httpTesting when withHttp is omitted', async () => {
    const { httpTesting } = await renderDirective(ChangeClass, { tagName: 'button' });

    expect(httpTesting).toBeUndefined();
  });

  test('removes ng-version when removeAngularAttributes is true', async () => {
    const { container } = await renderDirective(ChangeClass, {
      tagName: 'button',
      removeAngularAttributes: true,
    });

    expect(container.hasAttribute('ng-version')).toBe(false);
    expect(container.hasAttribute('id')).toBe(false);
  });

  test('overrideProvidersDirective replaces a provider declared on the directive', async () => {
    const mockService = { marker: 'mocked' };

    const { inject } = await renderDirective(ScopedDirective, {
      tagName: 'div',
      overrideProvidersDirective: [
        {
          replace: ScopedService,
          with: { provide: ScopedService, useValue: mockService },
        },
      ],
    });

    expect(inject(ScopedService)).toBe(mockService);
  });

  test('renders into a custom baseElement', async () => {
    const baseElement = document.createElement('section');
    document.body.appendChild(baseElement);

    const { container } = await renderDirective(ChangeClass, {
      tagName: 'button',
      baseElement,
    });

    expect(container.parentElement).toBe(baseElement);

    baseElement.remove();
  });
});

describe('host mode errors', () => {
  test('throws when the tag name cannot be inferred', async () => {
    await expect(renderDirective(ChangeClass, {})).rejects.toThrow(
      `[vitest-browser-angular] Cannot determine the tag name for ChangeClass: its selector does not ` +
        `include one and ` +
        `no \`tagName\` option was provided. Directives with an attribute-only selector (e.g. \`[appHighlight]\`) ` +
        `require an explicit \`tagName\`, e.g. 'div'.`,
    );
  });

  test('throws when the selector declares multiple tag names', async () => {
    await expect(renderDirective(MultiTagDirective, {})).rejects.toThrow(
      `[vitest-browser-angular] The directive MultiTagDirective has multiple tag names in its ` +
        `selector ` +
        `(app-first, app-second). Specify which one to use via the \`tagName\` option.`,
    );
  });

  test('rerender throws for an input that was not provided initially', async () => {
    const { rerender } = await renderDirective(ChangeClass, { tagName: 'button' });

    await expect(rerender({ className: 'red' })).rejects.toThrow(
      '[vitest-browser-angular] Cannot rerender directive with input "className" because it was not provided in the initial render options.',
    );
  });

  test('renderDeferBlock throws when no template is provided', async () => {
    const { renderDeferBlock } = await renderDirective(ChangeClass, { tagName: 'button' });

    await expect(renderDeferBlock(DeferBlockState.Complete)).rejects.toThrow(
      '[vitest-browser-angular] renderDeferBlock() is only available when the directive is rendered ' +
        'with a `template`.',
    );
  });

  test('rerender throws when a template is provided', async () => {
    const { rerender } = await renderDirective(ChangeClass, {
      template: `<button test>Test</button>`,
    });

    await expect(rerender({ className: 'red' })).rejects.toThrow(
      '[vitest-browser-angular] rerender() is only available when the directive is rendered ' +
        'without a `template`.',
    );
  });
});

test('emulated fixtures are removed from the DOM on cleanup', async () => {
  ɵsetCreateDirectiveMode('emulated');
  try {
    const { container } = await renderDirective(ChangeClass, { tagName: 'button' });

    expect(document.body.contains(container)).toBe(true);

    cleanup(true);

    expect(document.body.contains(container)).toBe(false);
  } finally {
    ɵsetCreateDirectiveMode('auto');
  }
});

test('model inputs write back to the source signal', async () => {
  const source = signal('a');
  const { directiveInstance } = await renderDirective(TwoWayDirective, {
    tagName: 'div',
    inputs: { value: source },
  });

  directiveInstance.value.set('b');

  expect(source()).toBe('b');
});

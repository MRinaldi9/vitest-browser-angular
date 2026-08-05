import { HttpClient } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { userEvent } from 'vitest/browser';
import { renderDirective } from '@wismaz/vitest-browser-angular';
import { ChangeClass } from './directives/change-class';
import { Unless, UnlessLocalService } from './directives/unless';

test('renders directive', async () => {
  const className = signal('test');
  const { getByText, hostFixture } = await renderDirective(ChangeClass, {
    template: `<button test [className]="test()" (blurred)="onBlur($event)">Test</button>`,
    hostProps: {
      test: className,
    },
  });
  expect(getByText('Test')).toHaveClass('test');

  className.set('changed');
  await hostFixture.whenStable();
  await expect.element(getByText('Test')).toHaveClass('changed');
});

test('renders directive and emits outputs', async () => {
  const blurredSpy = vi.fn();
  const { getByText } = await renderDirective(ChangeClass, {
    template: `<button test (blurred)="onBlur($event)">Test</button>`,
    hostProps: {
      onBlur: blurredSpy,
    },
  });
  await userEvent.keyboard('{Tab}');
  await expect.element(getByText('Test')).toHaveFocus();
  await userEvent.keyboard('{Tab}');
  expect(blurredSpy).toHaveBeenCalled();
});

test('throws when the directive is also listed in imports', async () => {
  await expect(
    renderDirective(ChangeClass, {
      template: `<button test>Test</button>`,
      imports: [ChangeClass],
    }),
  ).rejects.toThrow(
    `[renderDirective] The directive ChangeClass is already passed as the first argument and is added ` +
      `to the test module's \`imports\` automatically. Remove it from \`options.imports\` to avoid a duplicate import.`,
  );
});

describe('passthrough options', () => {
  test('exposes inject bound to the directive injector', async () => {
    class GreetingService {
      message = 'hello';
    }

    const { inject } = await renderDirective(ChangeClass, {
      template: `<button test>Test</button>`,
      providers: [{ provide: GreetingService, useClass: GreetingService }],
    });

    expect(inject(GreetingService).message).toBe('hello');
    expect(inject(ChangeClass)).toBeInstanceOf(ChangeClass);
  });

  test('inject resolves providers declared on the directive itself', async () => {
    const { inject } = await renderDirective(Unless, {
      template: `<div *appUnless="false">Hidden</div>`,
    });

    expect(inject(UnlessLocalService)).toBeInstanceOf(UnlessLocalService);
  });

  test('exposes httpTesting and supports HTTP requests when withHttp is enabled', async () => {
    const { inject, httpTesting } = await renderDirective(ChangeClass, {
      template: `<button test>Test</button>`,
      withHttp: true,
    });

    expect(httpTesting).toBeDefined();

    inject(HttpClient).get('/api/data').subscribe();

    const req = httpTesting!.expectOne('/api/data');
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true });
  });

  test('does not expose httpTesting when withHttp is omitted', async () => {
    const { httpTesting } = await renderDirective(ChangeClass, {
      template: `<button test>Test</button>`,
    });

    expect(httpTesting).toBeUndefined();
  });

  test('supports schema for unknown elements in the template', async () => {
    const { container } = await renderDirective(ChangeClass, {
      template: `<button test><my-custom-widget></my-custom-widget>Test</button>`,
      schema: CUSTOM_ELEMENTS_SCHEMA,
    });

    expect(container.querySelector('my-custom-widget')).not.toBeNull();
  });

  test('removes ng-version when removeAngularAttributes is true', async () => {
    const { container } = await renderDirective(ChangeClass, {
      template: `<button test>Test</button>`,
      removeAngularAttributes: true,
    });

    expect(container.hasAttribute('ng-version')).toBe(false);
  });

  test('overrideProvidersDirective replaces a provider declared on the directive', async () => {
    const mockService = { marker: 'mocked' };

    const { inject } = await renderDirective(Unless, {
      template: `<div *appUnless="false">Hidden content</div>`,
      overrideProvidersDirective: [
        {
          replace: UnlessLocalService,
          with: { provide: UnlessLocalService, useValue: mockService },
        },
      ],
    });

    expect(inject(UnlessLocalService)).toBe(mockService);
  });

  test('overrideImportsDirective is applied without breaking the render', async () => {
    const { directiveInstance, container } = await renderDirective(Unless, {
      template: `<div *appUnless="false">Hidden content</div>`,
      overrideImportsDirective: [{ replace: ChangeClass, with: Unless }],
    });

    expect(directiveInstance).toBeInstanceOf(Unless);
    expect(container.textContent).toContain('Hidden content');
  });
});

describe('structural directives', () => {
  test('finds the directive on its ng-template anchor and toggles its view', async () => {
    const show = signal(false);
    const { directiveInstance, inject, container, hostFixture } = await renderDirective(Unless, {
      template: `<div *appUnless="show()">Hidden content</div>`,
      hostProps: { show },
    });

    expect(directiveInstance).toBeInstanceOf(Unless);
    expect(directiveInstance.unless()).toBe(false);
    expect(container.textContent).toContain('Hidden content');

    show.set(true);
    await hostFixture.whenStable();
    expect(container.textContent).not.toContain('Hidden content');

    show.set(false);
    await hostFixture.whenStable();
    expect(container.textContent).toContain('Hidden content');

    expect(inject(Unless)).toBeInstanceOf(Unless);
  });
});
